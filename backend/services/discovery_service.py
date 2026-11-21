
import asyncio
import logging
import os
import re
import time
from urllib.parse import quote

import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("audiosphere.discovery")

LASTFM_API_KEY = os.getenv("LASTFM_API_KEY")
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

LASTFM_URL = "https://ws.audioscrobbler.com/2.0/"
ITUNES_URL = "https://itunes.apple.com/search"
YOUTUBE_URL = "https://www.googleapis.com/youtube/v3/search"
YOUTUBE_VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos"

# In-memory TTL cache.
# This is suitable for the initial single-instance deployment.
_cache = {}

POPULAR_ARTISTS_TTL = 6 * 60 * 60
TRENDING_TRACKS_TTL = 30 * 60
ARTIST_TRACKS_TTL = 6 * 60 * 60
YOUTUBE_TTL = 7 * 24 * 60 * 60

_cache_lock = asyncio.Lock()


def cache_get(key):
    item = _cache.get(key)

    if not item:
        return None

    value, expires_at = item

    if time.monotonic() >= expires_at:
        _cache.pop(key, None)
        return None

    return value


def cache_set(key, value, ttl):
    _cache[key] = (value, time.monotonic() + ttl)


def normalize_name(value):
    return re.sub(r"[^a-z0-9]", "", value.lower())


def artist_id(name, mbid=None):
    if mbid:
        return f"lastfm:{mbid}"

    return f"lastfm:{quote(name.lower().strip(), safe='')}"


def artist_name_from_id(value):
    prefix = "lastfm:"

    if value.startswith(prefix):
        return value[len(prefix):]

    return value


async def lastfm_request(client, method, **params):
    if not LASTFM_API_KEY:
        raise RuntimeError("LASTFM_API_KEY is not configured")

    response = await client.get(
        LASTFM_URL,
        params={
            "method": method,
            "api_key": LASTFM_API_KEY,
            "format": "json",
            **params,
        },
    )

    response.raise_for_status()
    data = response.json()

    if "error" in data:
        raise RuntimeError(
            f"Last.fm error: {data.get('message', 'Unknown error')}"
        )

    return data


def best_image(images):
    if not isinstance(images, list):
        return None

    for image in reversed(images):
        if isinstance(image, dict) and image.get("#text"):
            return image["#text"]

    return None



async def artist_artwork(client, artist_name):
    # Last.fm may return its generic placeholder instead of artist artwork.
    try:
        response = await client.get(ITUNES_URL, params={
            "term": artist_name, "entity": "album", "attribute": "artistTerm", "limit": 5,
        })
        response.raise_for_status()
        for item in response.json().get("results", []):
            artwork = item.get("artworkUrl100") or item.get("artworkUrl60")
            if artwork:
                return artwork.replace("100x100bb", "600x600bb").replace("100x100", "600x600")
    except (httpx.HTTPError, ValueError):
        logger.exception("Artist artwork lookup failed: %s", artist_name)
    return None


async def get_popular_artists(limit=12):
    limit = max(1, min(limit, 30))
    cache_key = f"popular_artists:{limit}"

    cached = cache_get(cache_key)
    if cached is not None:
        return cached

    async with httpx.AsyncClient(timeout=15.0) as client:
        data = await lastfm_request(
            client,
            "chart.getTopArtists",
            limit=limit,
        )

    raw_artists = data.get("artists", {}).get("artist", [])

    artists = []

    for artist in raw_artists:
        name = artist.get("name")

        if not name:
            continue

        mbid = artist.get("mbid") or None

        artists.append({
            "id": artist_id(name, mbid),
            "name": name,
            "image": best_image(artist.get("image")),
            "listeners": int(artist.get("listeners") or 0),
            "playcount": int(artist.get("playcount") or 0),
            "source": "lastfm",
        })

    cache_set(cache_key, artists, POPULAR_ARTISTS_TTL)
    return artists


async def enrich_track(client, title, artist):
    try:
        response = await client.get(
            ITUNES_URL,
            params={
                "term": f"{artist} {title}",
                "entity": "song",
                "limit": 5,
            },
        )

        response.raise_for_status()
        results = response.json().get("results", [])

        expected_artist = normalize_name(artist)
        expected_title = normalize_name(title)

        # Prefer a close artist/title match instead of
        # blindly selecting the first search result.
        for result in results:
            result_artist = normalize_name(
                result.get("artistName", "")
            )
            result_title = normalize_name(
                result.get("trackName", "")
            )

            if (
                result_artist == expected_artist
                and result_title == expected_title
            ):
                artwork = result.get("artworkUrl100")

                if artwork:
                    artwork = artwork.replace(
                        "100x100",
                        "600x600"
                    )

                return {
                    "album": result.get("collectionName"),
                    "artwork": artwork,
                    "duration": (
                        round(result["trackTimeMillis"] / 1000)
                        if result.get("trackTimeMillis")
                        else None
                    ),
                }

        # No reliable match.
        return {
            "album": None,
            "artwork": None,
            "duration": None,
        }

    except (httpx.HTTPError, ValueError):
        logger.exception("iTunes enrichment failed: %s", title)

        return {
            "album": None,
            "artwork": None,
            "duration": None,
        }


async def resolve_youtube_video(client, title, artist, exclude_video_ids=None):
    """Resolve a different explicitly embeddable candidate for playback fallback."""
    excluded = {value for value in (exclude_video_ids or []) if value}
    cache_key = f"youtube:embeddable:v3:{normalize_name(artist)}:{normalize_name(title)}"
    if not excluded:
        cached = cache_get(cache_key)
        if cached is not None:
            return cached
    if not YOUTUBE_API_KEY:
        logger.warning("YOUTUBE_API_KEY is not configured")
        return None

    queries = [f"{artist} {title} official audio", f"{artist} {title} official", f"{artist} {title}"]
    candidates, seen = [], set()
    try:
        for query in queries:
            response = await client.get(YOUTUBE_URL, params={
                "part": "snippet", "q": query, "type": "video",
                "videoCategoryId": "10", "maxResults": 10, "key": YOUTUBE_API_KEY,
            })
            response.raise_for_status()
            for item in response.json().get("items", []):
                video_id = item.get("id", {}).get("videoId")
                if not video_id or video_id in seen or video_id in excluded:
                    continue
                snippet = item.get("snippet", {})
                candidate_title = normalize_name(snippet.get("title", ""))
                channel = normalize_name(snippet.get("channelTitle", ""))
                expected_title, expected_artist = normalize_name(title), normalize_name(artist)
                title_match = expected_title in candidate_title or all(
                    token in candidate_title for token in expected_title.split() if len(token) > 2
                )
                artist_match = expected_artist in candidate_title or expected_artist in channel or all(
                    token in candidate_title + channel for token in expected_artist.split() if len(token) > 2
                )
                score = (4 if title_match else 0) + (3 if artist_match else 0)
                if "official" in candidate_title or "topic" in channel:
                    score += 1
                if any(word in candidate_title for word in ("live", "cover", "karaoke")):
                    score -= 2
                seen.add(video_id)
                candidates.append((score, video_id))

        candidates.sort(key=lambda item: item[0], reverse=True)
        ids = [video_id for score, video_id in candidates if score >= 4]
        if not ids:
            ids = [video_id for _, video_id in candidates]
        for offset in range(0, len(ids), 50):
            batch = ids[offset:offset + 50]
            if not batch:
                continue
            status_response = await client.get(YOUTUBE_VIDEOS_URL, params={
                "part": "status", "id": ",".join(batch), "key": YOUTUBE_API_KEY,
            })
            status_response.raise_for_status()
            flags = {
                item.get("id"): item.get("status", {}).get("embeddable")
                for item in status_response.json().get("items", [])
            }
            for video_id in batch:
                if flags.get(video_id) is True:
                    if not excluded:
                        cache_set(cache_key, video_id, YOUTUBE_TTL)
                    return video_id
        if not excluded:
            cache_set(cache_key, None, 300)
        return None
    except (httpx.HTTPError, ValueError):
        logger.exception("YouTube resolution failed: %s - %s", artist, title)
        return None


async def enrich_track_for_discovery(track):
    title = track["title"]
    artist = track["artist"]

    async with httpx.AsyncClient(timeout=20.0) as client:
        metadata_task = enrich_track(client, title, artist)
        youtube_task = resolve_youtube_video(
            client, title, artist
        )

        metadata, video_id = await asyncio.gather(
            metadata_task,
            youtube_task,
        )

    return {
        **track,
        **metadata,
        "youtubeVideoId": video_id,
        "playable": bool(video_id),
    }


async def get_trending_tracks(limit=12):
    limit = max(1, min(limit, 30))
    cache_key = f"trending_tracks:{limit}"

    cached = cache_get(cache_key)
    if cached is not None:
        return cached

    async with httpx.AsyncClient(timeout=15.0) as client:
        data = await lastfm_request(
            client,
            "chart.getTopTracks",
            limit=limit,
        )

    raw_tracks = data.get("tracks", {}).get("track", [])

    tracks = []

    for item in raw_tracks:
        title = item.get("name")
        artist = item.get("artist", {}).get("name")

        if not title or not artist:
            continue

        tracks.append({
            "id": (
                f"lastfm:{normalize_name(artist)}:"
                f"{normalize_name(title)}"
            ),
            "title": title,
            "artist": artist,
            "source": "lastfm",
        })

    enriched = await asyncio.gather(
        *(enrich_track_for_discovery(track) for track in tracks)
    )

    cache_set(cache_key, enriched, TRENDING_TRACKS_TTL)
    return enriched


async def get_artist_details(artist):
    async with httpx.AsyncClient(timeout=15.0) as client:
        data = await lastfm_request(
            client,
            "artist.getInfo",
            artist=artist,
        )

    details = data.get("artist", {})

    return {
        "id": artist_id(
            details.get("name", artist),
            details.get("mbid") or None,
        ),
        "name": details.get("name", artist),
        "image": best_image(details.get("image")),
        "listeners": int(details.get("stats", {}).get("listeners") or 0),
        "playcount": int(details.get("stats", {}).get("playcount") or 0),
        "source": "lastfm",
    }


async def get_artist_top_tracks(artist, limit=10):
    limit = max(1, min(limit, 10))

    cache_key = (
        f"artist_tracks:{normalize_name(artist)}:{limit}"
    )

    cached = cache_get(cache_key)
    if cached is not None:
        return cached

    async with httpx.AsyncClient(timeout=15.0) as client:
        data = await lastfm_request(
            client,
            "artist.getTopTracks",
            artist=artist,
            limit=limit,
        )

    raw_tracks = data.get("toptracks", {}).get("track", [])

    tracks = []

    for item in raw_tracks:
        title = item.get("name")

        if not title:
            continue

        tracks.append({
            "id": (
                f"lastfm:{normalize_name(artist)}:"
                f"{normalize_name(title)}"
            ),
            "title": title,
            "artist": artist,
            "source": "lastfm",
        })

    enriched = await asyncio.gather(
        *(enrich_track_for_discovery(track) for track in tracks)
    )

    cache_set(cache_key, enriched, ARTIST_TRACKS_TTL)
    return enriched



async def search_discovery(query, limit=10):
    query = (query or "").strip()
    if len(query) < 2:
        return {"artists": [], "tracks": []}
    limit = max(1, min(limit, 20))
    async with httpx.AsyncClient(timeout=15.0) as client:
        artist_data, track_data = await asyncio.gather(
            lastfm_request(client, "artist.search", artist=query, limit=limit),
            lastfm_request(client, "track.search", track=query, limit=limit),
        )
    raw_artists = artist_data.get("results", {}).get("artistmatches", {}).get("artist", [])
    raw_tracks = track_data.get("results", {}).get("trackmatches", {}).get("track", [])
    if isinstance(raw_artists, dict): raw_artists = [raw_artists]
    if isinstance(raw_tracks, dict): raw_tracks = [raw_tracks]
    artists = []
    for item in raw_artists:
        name = item.get("name")
        if not name: continue
        image = best_image(item.get("image"))
        if not image or "2a96cbd8b46e442fc41c2b86b821562f" in image:
            async with httpx.AsyncClient(timeout=12.0) as image_client:
                image = await artist_artwork(image_client, name)
        artists.append({"id": artist_id(name, item.get("mbid") or None), "name": name,
                        "image": image, "listeners": int(item.get("listeners") or 0), "source": "lastfm"})
    tracks = []
    for item in raw_tracks:
        title, artist = item.get("name"), item.get("artist")
        if title and artist:
            tracks.append({"id": f"lastfm:{normalize_name(artist)}:{normalize_name(title)}",
                           "title": title, "artist": artist, "source": "lastfm"})
    enriched = await asyncio.gather(*(enrich_track_for_discovery(t) for t in tracks))
    return {"artists": artists, "tracks": enriched}


async def resolve_discovery_video(artist, title, exclude_video_id=None):
    async with httpx.AsyncClient(timeout=20.0) as client:
        return await resolve_youtube_video(
            client, title, artist, [exclude_video_id] if exclude_video_id else None
        )


async def get_home_discovery():
    artists, tracks = await asyncio.gather(
        get_popular_artists(12),
        get_trending_tracks(12),
    )

    return {
        "artists": artists,
        "trendingTracks": tracks,
        "updatedAt": time.strftime(
            "%Y-%m-%dT%H:%M:%SZ",
            time.gmtime(),
        ),
    }