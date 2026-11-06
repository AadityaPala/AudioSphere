import asyncio
import httpx
import logging
import re

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from prometheus_fastapi_instrumentator import Instrumentator


app = FastAPI(
    title="Audiosphere Metadata & AI Service",
    version="0.2.0",
)

Instrumentator().instrument(app).expose(app)

logger = logging.getLogger("audiosphere.lyrics")

# Allow local development, Caddy gateway, and Vercel frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:9000",
        "https://audiosphere0211.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint for Render deployment."""
    return {"status": "healthy"}


def normalize_text(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", value.lower())

async def fetch_lyrics(
    client: httpx.AsyncClient,
    artist: str,
    title: str
) -> dict | None:

    clean_title = re.sub(
        r"\s*[\(\[][^)\]]*?(official|video|audio|lyrics|hd|4k)[^)\]]*[\)\]]",
        "",
        title,
        flags=re.IGNORECASE,
    )

    clean_title = re.sub(r"\|.*$", "", clean_title).strip()

    try:
        response = await client.get(
            "https://lrclib.net/api/get",
            params = {
                "artist_name": artist,
                "track_name": clean_title
            },
        )

        if response.status_code == 200:
            data = response.json()

            if isinstance(data, dict) and (data.get("plainLyrics") or data.get("syncedLyrics")):
                logger.info("Lyrics found through exact lookup : %s", clean_title)
                return data

        elif response.status_code != 404:
            response.raise_for_status()

        logger.info(
            "Exact lyrics lookup failed: trying %s - %s",
            artist,
            clean_title,
        )

        search_response = await client.get(
            "https://lrclib.net/api/search",
            params={
                "track_name": clean_title,
                "artist_name": artist,
            },
        )

        search_response.raise_for_status()
        results = search_response.json()

        if not isinstance(results, list):
            return None

        for result in results:
            if not isinstance(result, dict):
                continue

            result_artist = normalize_text(
                result.get("artistName") or ""
            )
            result_title = normalize_text(
                result.get("trackName") or result.get("name") or ""
            )

            if (
                result_artist == normalize_text(artist)
                and result_title == normalize_text(clean_title)
                and (
                    result.get("plainLyrics")
                    or result.get("syncedLyrics")
                )
            ):
                logger.info("Lyrics found through search: %s", clean_title)
                return result

        logger.warning(
            "No matching lyrics found: %s - %s",
            artist,
            clean_title,
        )
        return None

    except (httpx.HTTPError, ValueError) as exc:
        logger.exception("LRCLIB request failed: %s", exc)
        return None


@app.get("/metadata/enrich")
async def enrich_song(
    artist: str = Query(..., min_length=1),
    title: str = Query(..., min_length=1),
) -> dict[str, str | None]:
    headers = {
        "User-Agent": "Audiosphere/0.2.0 (https://audiosphere0211.vercel.app)"
    }

    async with httpx.AsyncClient(
        timeout=httpx.Timeout(25.0, connect=5.0),
        headers=headers,
    ) as client:

        async def fetch_itunes():
            try:
                response = await client.get(
                    "https://itunes.apple.com/search",
                    params={
                        "term": f"{artist} {title}",
                        "entity": "song",
                        "limit": 1,
                    },
                )
                response.raise_for_status()
                return response.json()

            except (httpx.HTTPError, ValueError) as exc:
                logger.exception("iTunes metadata request failed: %s", exc)
                return {}

        itunes_data, lyrics_data = await asyncio.gather(
            fetch_itunes(),
            fetch_lyrics(client, artist, title),
        )

    results = itunes_data.get("results", [])
    track = results[0] if results and isinstance(results[0], dict) else {}
    lyrics_data = lyrics_data or {}

    artwork_url = track.get("artworkUrl100")
    release_date = track.get("releaseDate")
    genre = track.get("primaryGenreName")
    lyrics = lyrics_data.get("plainLyrics") or lyrics_data.get("syncedLyrics")

    logger.info(
        "Metadata completed | Artist: %s | Title: %s | Lyrics: %s",
        artist,
        title,
        bool(lyrics),
    )

    return {
        "albumArtUrl": (
            artwork_url.replace("100x100", "600x600")
            if isinstance(artwork_url, str)
            else None
        ),
        "genre": genre if isinstance(genre, str) else None,
        "releaseYear": release_date[:4] if isinstance(release_date, str) else None,
        "lyrics": lyrics if isinstance(lyrics, str) else None,
    }