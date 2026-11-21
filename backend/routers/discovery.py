from fastapi import APIRouter, HTTPException, Query

from services.discovery_service import (
    get_home_discovery,
    get_popular_artists,
    get_trending_tracks,
    get_artist_details,
    get_artist_top_tracks,
    artist_name_from_id,
    search_discovery,
    resolve_discovery_video,
)

router = APIRouter(
    prefix="/discovery",
    tags=["Music Discovery"],
)


@router.get("/home")
async def home_discovery():
    try:
        return await get_home_discovery()

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Discovery service failed: {str(exc)}",
        )


@router.get("/artists")
async def popular_artists(
    limit: int = Query(12, ge=1, le=30),
):
    try:
        return await get_popular_artists(limit)

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Could not retrieve artists: {str(exc)}",
        )


@router.get("/tracks")
async def trending_tracks(
    limit: int = Query(12, ge=1, le=30),
):
    try:
        return await get_trending_tracks(limit)

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Could not retrieve tracks: {str(exc)}",
        )


@router.get("/artists/{artist_id}")
async def artist_details(artist_id: str):
    try:
        artist_name = artist_name_from_id(artist_id)

        return await get_artist_details(artist_name)

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Could not retrieve artist: {str(exc)}",
        )


@router.get("/artists/{artist_id}/tracks")
async def artist_tracks(
    artist_id: str,
    limit: int = Query(10, ge=1, le=10),
):
    try:
        artist_name = artist_name_from_id(artist_id)

        artist, tracks = await __import__(
            "asyncio"
        ).gather(
            get_artist_details(artist_name),
            get_artist_top_tracks(artist_name, limit),
        )

        return {
            "artist": artist,
            "tracks": tracks,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Could not retrieve artist tracks: {str(exc)}",
        )


@router.get("/search")
async def discovery_search(q: str = Query(..., min_length=2), limit: int = Query(10, ge=1, le=20)):
    try:
        return await search_discovery(q, limit)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Discovery search failed: {str(exc)}")


@router.get("/resolve")
async def resolve_track(artist: str = Query(..., min_length=1), title: str = Query(..., min_length=1), exclude_video_id: str | None = Query(None, alias="excludeVideoId")):
    try:
        video_id = await resolve_discovery_video(artist, title, exclude_video_id)
        return {"videoId": video_id}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Could not resolve track: {str(exc)}")
