
import re
from urllib.parse import quote_plus


def normalize_text(value: str | None) -> str:
    """Normalize music metadata for reliable comparisons."""

    if not value:
        return ""

    return re.sub(r"[^a-z0-9]", "", value.lower())


def create_youtube_search_url(
    artist: str,
    title: str
) -> str:
    """Create a YouTube search URL for a recommended track."""

    query = quote_plus(f"{artist} {title}")

    return (
        "https://www.youtube.com/results"
        f"?search_query={query}"
    )
