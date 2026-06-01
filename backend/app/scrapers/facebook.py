from __future__ import annotations

import logging
import re
from typing import Any, Dict, List
from urllib.parse import parse_qs, urlparse

import httpx
import yt_dlp

from app.config import settings
from app.scrapers.profile_metadata import (
    fetch_open_graph_metadata,
    parse_compact_number,
)
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

    def scrape(self, url: str, comment_limit: int | str | None = 200) -> Dict[str, Any]:
        if self._is_profile_url(url):
            return self._scrape_profile_metadata(url)

        # 1. yt-dlp
        try:
            return self._scrape_via_ytdlp(url, comment_limit=comment_limit)
        except ScraperError as exc:
            logger.warning("yt-dlp failed for Facebook (%s), trying Graph oEmbed", exc)

        # 2. Meta Graph API jika ada token
        if settings.META_ACCESS_TOKEN:
            return self._scrape_via_graph_oembed(url)

        raise ScraperError(
            "Facebook scraping via yt-dlp failed. "
            "Set META_ACCESS_TOKEN in .env to enable Meta Graph API fallback."
        )

    def _is_profile_url(self, url: str) -> bool:
        parsed = urlparse(url)
        host = parsed.netloc.lower()
        path = parsed.path.lower().strip("/")

        if host.endswith("fb.watch"):
            return False
        if path == "profile.php":
            return True
        if not path:
            return False
        return not any(
            marker in path
            for marker in ("posts/", "videos/", "video/", "watch/", "reel/")
        ) and "v=" not in parsed.query

    def _scrape_profile_metadata(self, url: str) -> Dict[str, Any]:
        metadata = fetch_open_graph_metadata(url)
        parsed = urlparse(url)
        profile_id = parse_qs(parsed.query).get("id", [None])[0]
        path_segment = parsed.path.strip("/").split("/")[0] if parsed.path.strip("/") else None
        description = metadata.get("description") or "Profil halaman Facebook"

        match = re.search(
            r"([\d.,]+[KMB]?)\s+likes(?:\s*[·•]\s*([\d.,]+[KMB]?)\s+talking about this)?",
            description,
            re.IGNORECASE,
        )
        page_likes = parse_compact_number(match.group(1)) if match else None
        talking_about = parse_compact_number(match.group(2)) if match and match.group(2) else None

        return {
            "_source": "facebook_profile_meta",
            "profile_type": "profile",
            "id": profile_id or path_segment or metadata.get("title"),
            "title": metadata.get("title") or "Facebook",
            "description": description,
            "author_name": metadata.get("title") or path_segment,
            "page_name": metadata.get("title") or path_segment,
            "thumbnail_url": metadata.get("image"),
            "webpage_url": url,
            "profile_likes": page_likes,
            "profile_talking_about": talking_about,
        }

    # ── 1. yt-dlp ─────────────────────────────────────────────────────────────
    def _scrape_via_ytdlp(self, url: str, comment_limit: int | str | None = 200) -> Dict[str, Any]:
        try:
            from copy import deepcopy
            opts = deepcopy(_YDL_OPTS)
            opts["extractor_args"] = {
                "facebook": {
                    "max_comments": [str(comment_limit or 200)],
                }
            }
            with yt_dlp.YoutubeDL(opts) as ydl:
                info = ydl.extract_info(url, download=False)
                if info is None:
                    raise ScraperError("yt-dlp returned no info")
                info.pop("formats", None)
                info.pop("thumbnails", None)
                info["_source"] = "yt_dlp"
                info["comments"] = self.normalize_comment_list(
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
