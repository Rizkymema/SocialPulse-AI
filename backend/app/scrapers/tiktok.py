from __future__ import annotations

import logging
from typing import Any, Dict

import httpx
import yt_dlp

from app.scrapers.base import BaseScraper, ScraperError

logger = logging.getLogger(__name__)

_YDL_OPTS: Dict[str, Any] = {
    "quiet": True,
    "no_warnings": True,
    "skip_download": True,
    "extract_flat": False,
    "socket_timeout": 30,
    "format": "bestaudio/best",
    "ignore_no_formats_error": True,
    # Enable comment extraction (yt-dlp has partial TikTok support)
    "getcomments": True,
}

_TIKTOK_OEMBED = "https://www.tiktok.com/oembed"


class TikTokScraper(BaseScraper):
    """
    Scrape public TikTok video metadata.

    Strategy (in order):
    1. yt-dlp – extracts rich metadata from public TikTok videos
    2. TikTok oEmbed API – lightweight fallback (title, author, thumbnail)
    """

    def scrape(self, url: str) -> Dict[str, Any]:
        try:
            return self._scrape_via_ytdlp(url)
        except ScraperError as exc:
            logger.warning("yt-dlp failed for TikTok, trying oEmbed: %s", exc)

        return self._scrape_via_oembed(url)

    def _scrape_via_ytdlp(self, url: str) -> Dict[str, Any]:
        try:
            with yt_dlp.YoutubeDL(_YDL_OPTS) as ydl:
                info = ydl.extract_info(url, download=False)
                if info is None:
                    raise ScraperError("yt-dlp returned no info")
                info.pop("formats", None)
                info.pop("thumbnails", None)
                info["_source"] = "yt_dlp"
                # Normalize comments
                raw_comments = info.get("comments") or []
                info["comments"] = [
                    {
                        "id": c.get("id"),
                        "text": c.get("text", ""),
                        "author": c.get("author"),
                        "author_id": c.get("author_id"),
                        "timestamp": c.get("timestamp"),
                        "like_count": c.get("like_count", 0),
                        "is_favorited": c.get("is_favorited", False),
                        "author_is_uploader": c.get("author_is_uploader", False),
                        "parent": c.get("parent", "root"),
                    }
                    for c in raw_comments
                    if c.get("text")
                ]
                logger.info(
                    "TikTok scrape complete: %d comments collected",
                    len(info["comments"]),
                )
                return info
        except yt_dlp.utils.DownloadError as exc:
            raise ScraperError(f"yt-dlp download error: {exc}") from exc
        except Exception as exc:
            raise ScraperError(f"Unexpected yt-dlp error: {exc}") from exc

    def _scrape_via_oembed(self, url: str) -> Dict[str, Any]:
        try:
            response = httpx.get(
                _TIKTOK_OEMBED,
                params={"url": url},
                headers={"User-Agent": "Mozilla/5.0"},
                timeout=15,
            )
            response.raise_for_status()
            data = response.json()
            data["_source"] = "tiktok_oembed"
            return data
        except httpx.HTTPStatusError as exc:
            raise ScraperError(f"TikTok oEmbed HTTP error: {exc}") from exc
        except Exception as exc:
            raise ScraperError(f"TikTok oEmbed error: {exc}") from exc
