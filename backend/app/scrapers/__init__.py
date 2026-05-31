from __future__ import annotations

from app.scrapers.base import BaseScraper, ScraperError
from app.scrapers.youtube import YouTubeScraper
from app.scrapers.tiktok import TikTokScraper
from app.scrapers.instagram import InstagramScraper
from app.scrapers.facebook import FacebookScraper
from app.core.detector import Platform

_REGISTRY: dict[str, type[BaseScraper]] = {
    Platform.YOUTUBE: YouTubeScraper,
    Platform.TIKTOK: TikTokScraper,
    Platform.INSTAGRAM: InstagramScraper,
    Platform.FACEBOOK: FacebookScraper,
}


def get_scraper(platform: str) -> BaseScraper:
    """Return the appropriate scraper instance for the given platform name."""
    cls = _REGISTRY.get(platform)
    if cls is None:
        raise ScraperError(f"No scraper registered for platform: {platform!r}")
    return cls()


__all__ = [
    "BaseScraper",
    "ScraperError",
    "YouTubeScraper",
    "TikTokScraper",
    "InstagramScraper",
    "FacebookScraper",
    "get_scraper",
]
