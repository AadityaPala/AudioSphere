
from pydantic import BaseModel, Field


class RecommendationSeed(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    artist: str | None = None
    genre: str | None = None
    releaseYear: str | None = None


class RecommendationRequest(BaseModel):
    seeds: list[RecommendationSeed] = Field(
        min_length=1,
        max_length=100
    )
    limit: int = Field(default=12, ge=1, le=30)
    preferredGenre: str | None = None


class RecommendationResponse(BaseModel):
    id: str
    title: str
    artist: str
    artwork: str | None = None
    genre: str | None = None
    releaseYear: str | None = None
    previewUrl: str | None = None
    trackViewUrl: str | None = None
    youtubeSearchUrl: str
    score: float
    reason: str
