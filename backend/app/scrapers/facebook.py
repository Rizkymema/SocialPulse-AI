from __future__ import annotations

import logging
from typing import Any, Dict, List

import httpx
import yt_dlp

from app.config import settings
from app.scrapers.base import BaseScraper, ScraperError

logger = logging.getLogger(__name__)

# yt-dlp opts — aktifkan getcomments dan User-Agent browser
_YDL_OPTS: Dict[str, Any] = {
    "quiet": True,
    "no_warnings": True,
    "skip_download": True,
    "extract_flat": False,
    "socket_timeout": 30,
    "format": "bestaudio/best",
    "ignore_no_formats_error": True,
    "getcomments": True,
    "sleep_interval": 1,
    "max_sleep_interval": 3,
    "http_headers": {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
    },
}


class FacebookScraper(BaseScraper):
    """
    Scrape public Facebook posts / videos / Reels.

    Strategy (berurutan):
    1. yt-dlp         — terbaik untuk video, Reels, dan fb.watch links
    2. Meta Graph API oEmbed — jika META_ACCESS_TOKEN dikonfigurasi
    """

    def scrape(self, url: str) -> Dict[str, Any]:
        # 1. yt-dlp
        try:
            return self._scrape_via_ytdlp(url)
        except ScraperError as exc:
            logger.warning("yt-dlp failed for Facebook (%s), trying Graph oEmbed", exc)

        # 2. Meta Graph API jika ada token
        if settings.META_ACCESS_TOKEN:
            return self._scrape_via_graph_oembed(url)

        raise ScraperError(
            "Facebook scraping via yt-dlp failed. "
            "Set META_ACCESS_TOKEN in .env to enable Meta Graph API fallback."
        )

    # ── 1. yt-dlp ─────────────────────────────────────────────────────────────
    def _scrape_via_ytdlp(self, url: str) -> Dict[str, Any]:
        try:
            with yt_dlp.YoutubeDL(_YDL_OPTS) as ydl:
                info = ydl.extract_info(url, download=False)
                if info is None:
                    raise ScraperError("yt-dlp returned no info")
                info.pop("formats", None)
                info.pop("thumbnails", None)
                info["_source"] = "yt_dlp"
                info["comments"] = self._normalize_comments(
                    info.get("comments") or []
                )
                logger.info(
                    "Facebook yt-dlp OK: %d comments", len(info["comments"])
                )
                return info
        except yt_dlp.utils.DownloadError as exc:
            raise ScraperError(f"yt-dlp download error: {exc}") from exc
        except Exception as exc:
            raise ScraperError(f"Unexpected yt-dlp error: {exc}") from exc

    # ── 2. Meta Graph API oEmbed ─────────────────────────────────────────────
    def _scrape_via_graph_oembed(self, url: str) -> Dict[str, Any]:
        """Meta Graph API oEmbed for public Facebook posts — requires META_ACCESS_TOKEN."""
        try:
            response = httpx.get(
                "https://graph.facebook.com/v19.0/oembed_post",
                params={
                    "url": url,
                    "access_token": settings.META_ACCESS_TOKEN,
                    "fields": "author_name,provider_name,title,thumbnail_url,html",
                },
                timeout=15,
            )
            response.raise_for_status()
            data = response.json()
            data["_source"] = "meta_graph_oembed"
            return data
        except httpx.HTTPStatusError as exc:
            raise ScraperError(f"Meta Graph API error: {exc}") from exc
        except Exception as exc:
            raise ScraperError(f"Meta Graph API error: {exc}") from exc

    # ── Helpers ───────────────────────────────────────────────────────────────
    @staticmethod
    def _normalize_comments(raw: list) -> List[Dict[str, Any]]:
        return [
            {
                "id": c.get("id"),
                "text": c.get("text", ""),
                "author": c.get("author"),
                "author_id": c.get("author_id"),
                "timestamp": c.get("timestamp"),
                "like_count": int(c.get("like_count") or 0),
                "is_favorited": bool(c.get("is_favorited", False)),
                "author_is_uploader": bool(c.get("author_is_uploader", False)),
                "parent": c.get("parent") or "root",
            }
            for c in raw
            if c.get("text")
        ]
