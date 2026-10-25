import asyncio
import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Audiosphere Metadata & AI Service",
    version="0.2.0",
)

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


@app.get("/metadata/enrich")
async def enrich_song(
    artist: str = Query(..., min_length=1, description="Artist name"),
    title: str = Query(..., min_length=1, description="Song title"),
) -> dict[str, str | None]:
    """Concurrently fetches album art, genre, release year (iTunes) and lyrics (LRCLIB)."""
    headers = {"User-Agent": "Audiosphere/0.2.0 (https://audiosphere0211.vercel.app)"}
    
    async with httpx.AsyncClient(timeout=10.0, headers=headers) as client:
        try:
            itunes_res, lyrics_res = await asyncio.gather(
                client.get(
                    "https://itunes.apple.com/search",
                    params={"term": f"{artist} {title}", "entity": "song", "limit": 1},
                ),
                client.get(
                    "https://lrclib.net/api/get",
                    params={"artist_name": artist, "track_name": title},
                ),
            )
            itunes_res.raise_for_status()
            if lyrics_res.status_code not in (200, 404):
                lyrics_res.raise_for_status()
        except httpx.HTTPError as exc:
            raise HTTPException(
                status_code=502, detail=f"Upstream metadata provider failed: {str(exc)}"
            ) from exc

    # Parse iTunes Metadata
    itunes_data = itunes_res.json() if itunes_res.status_code == 200 else {}
    results = itunes_data.get("results", [])
    track = results[0] if results and isinstance(results[0], dict) else {}

    # Parse LRCLIB Lyrics
    lyrics_data = lyrics_res.json() if lyrics_res.status_code == 200 else {}
    if not isinstance(lyrics_data, dict):
        lyrics_data = {}

    artwork_url = track.get("artworkUrl100")
    release_date = track.get("releaseDate")
    genre = track.get("primaryGenreName")
    lyrics = lyrics_data.get("plainLyrics") or lyrics_data.get("syncedLyrics")

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