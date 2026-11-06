
import asyncio
import logging

from collections import Counter

import httpx

from schemas.recommendation import (
    RecommendationRequest,
    RecommendationResponse,
)

from utils.music_utils import (
    normalize_text,
    create_youtube_search_url,
)


logger = logging.getLogger("audiosphere.recommendations")


async def search_itunes(
    client: httpx.AsyncClient,
    term: str,
) -> list[dict]:

    try:
        response = await client.get(
            "https://itunes.apple.com/search",
            params={
                "term": term,
                "entity": "song",
                "limit": 50,
            },
        )

        response.raise_for_status()

        data = response.json()
        results = data.get("results", [])

        return results if isinstance(results, list) else []

    except (httpx.HTTPError, ValueError) as exc:

        logger.warning(
            "Recommendation search failed for %s: %s",
            term,
            exc,
        )

        return []


async def generate_recommendations(
    request: RecommendationRequest,
) -> list[RecommendationResponse]:

    seeds = request.seeds

    # Identify the user's preferred artists and genres.
    genre_counts = Counter(
        normalize_text(seed.genre)
        for seed in seeds
        if seed.genre
    )

    artist_counts = Counter(
        normalize_text(seed.artist)
        for seed in seeds
        if seed.artist
    )

    # Exclude songs already saved by the user.
    existing_tracks = {
        (
            normalize_text(seed.title),
            normalize_text(seed.artist),
        )
        for seed in seeds
    }

    search_terms = []

    # Search the three most frequent genres.
    for genre, _ in genre_counts.most_common(3):

        original_genre = next(
            seed.genre
            for seed in seeds
            if seed.genre
            and normalize_text(seed.genre) == genre
        )

        search_terms.append(f"{original_genre} music")

    # Search the two most frequent artists.
    for artist, _ in artist_counts.most_common(2):

        original_artist = next(
            seed.artist
            for seed in seeds
            if seed.artist
            and normalize_text(seed.artist) == artist
        )

        search_terms.append(original_artist)

    search_terms = list(dict.fromkeys(search_terms))

    if not search_terms:
        return []

    async with httpx.AsyncClient(
        timeout=httpx.Timeout(15.0, connect=5.0),
        headers={
            "User-Agent": "AudioSphere/0.2.0"
        },
    ) as client:

        search_results = await asyncio.gather(
            *[
                search_itunes(client, term)
                for term in search_terms
            ],
            return_exceptions=True,
        )

    candidates = {}

    for results in search_results:

        if isinstance(results, Exception):
            continue

        for track in results:

            if not isinstance(track, dict):
                continue

            title = track.get("trackName")
            artist = track.get("artistName")
            track_id = track.get("trackId")

            if not title or not artist or not track_id:
                continue

            normalized_title = normalize_text(title)
            normalized_artist = normalize_text(artist)

            if (
                normalized_title,
                normalized_artist,
            ) in existing_tracks:
                continue

            genre = track.get("primaryGenreName") or ""
            normalized_genre = normalize_text(genre)

            score = 0.0

            # Genre similarity.
            if normalized_genre in genre_counts:
                score += (
                    5.0 * genre_counts[normalized_genre]
                )

            # Artist similarity.
            if normalized_artist in artist_counts:
                score += (
                    2.0 * artist_counts[normalized_artist]
                )

            artwork = track.get("artworkUrl100")

            if artwork:
                score += 0.25

            release_date = track.get("releaseDate") or ""

            candidate = RecommendationResponse(
                id=f"itunes-{track_id}",
                title=title,
                artist=artist,
                artwork=(
                    artwork.replace(
                        "100x100bb",
                        "600x600bb"
                    )
                    if isinstance(artwork, str)
                    else None
                ),
                genre=genre,
                releaseYear=(
                    release_date[:4]
                    if isinstance(release_date, str)
                    else None
                ),
                previewUrl=track.get("previewUrl"),
                trackViewUrl=track.get("trackViewUrl"),
                youtubeSearchUrl=create_youtube_search_url(
                    artist,
                    title,
                ),
                score=score,
                reason=(
                    f"Because you listen to {genre}"
                    if normalized_genre in genre_counts
                    else f"More music by {artist}"
                ),
            )

            key = (
                normalized_title,
                normalized_artist,
            )

            if key not in candidates:
                candidates[key] = candidate

            elif score > candidates[key].score:
                candidates[key] = candidate

    ranked = sorted(
        candidates.values(),
        key=lambda item: item.score,
        reverse=True,
    )

    # Limit repeated artists.
    recommendations = []
    artist_limit = Counter()

    for candidate in ranked:

        artist_key = normalize_text(candidate.artist)

        if artist_limit[artist_key] >= 2:
            continue

        recommendations.append(candidate)
        artist_limit[artist_key] += 1

        if len(recommendations) >= request.limit:
            break

    logger.info(
        "Generated %s recommendations from %s seed tracks",
        len(recommendations),
        len(seeds),
    )

    return recommendations
