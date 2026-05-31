from __future__ import annotations

import logging
import re
from typing import Any, Dict
from urllib.parse import urlparse

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
        if self._is_profile_url(url):
            return self._scrape_profile_via_ytdlp(url)

        try:
            return self._scrape_via_ytdlp(url)
        except ScraperError as exc:
            logger.warning("yt-dlp failed for TikTok, trying oEmbed: %s", exc)

        return self._scrape_via_oembed(url)

    def _is_profile_url(self, url: str) -> bool:
        parsed = urlparse(url)
        return bool(
            re.search(r"^/@[\w.\-]+/?$", parsed.path, re.IGNORECASE)
        )

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

    def _scrape_profile_via_ytdlp(self, url: str) -> Dict[str, Any]:
        opts = dict(_YDL_OPTS)
        opts["extract_flat"] = True
        opts["playlistend"] = 1
        opts.pop("getcomments", None)

        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                info = ydl.extract_info(url, download=False)
                if info is None:
                    raise ScraperError("yt-dlp returned no profile info")

            first_entry = next(
                (
                    entry
                    for entry in info.get("entries") or []
                    if isinstance(entry, dict)
                ),
                {},
            )
            parsed = urlparse(url)
            fallback_username = parsed.path.strip("/").split("/")[0].lstrip("@")
            profile_name = (
                first_entry.get("uploader")
                or info.get("title")
                or fallback_username
                or "unknown"
            )

            sample_title = first_entry.get("title")
            sample_views = first_entry.get("view_count")
            sample_likes = first_entry.get("like_count")
            sample_comments = first_entry.get("comment_count")

            description_parts = [f"Profil akun TikTok @{profile_name}."]
            if isinstance(sample_title, str) and sample_title.strip():
                description_parts.append(
                    f"Contoh video terbaru: {sample_title.strip()}"
                )
            sample_metrics = []
            if isinstance(sample_views, int) and sample_views > 0:
                sample_metrics.append(f"{sample_views:,} views")
            if isinstance(sample_likes, int) and sample_likes > 0:
                sample_metrics.append(f"{sample_likes:,} likes")
            if isinstance(sample_comments, int) and sample_comments > 0:
                sample_metrics.append(f"{sample_comments:,} komentar")
            if sample_metrics:
                description_parts.append(
                    f"Stat video contoh: {' · '.join(sample_metrics)}."
                )

            return {
                "_source": "yt_dlp_profile",
                "profile_type": "profile",
                "id": info.get("id") or fallback_username,
                "title": profile_name,
                "description": " ".join(description_parts).strip(),
                "uploader": profile_name,
                "channel": first_entry.get("channel") or info.get("title"),
                "thumbnail": first_entry.get("thumbnail") or info.get("thumbnail"),
                "webpage_url": info.get("webpage_url") or url,
                "profile_sample_url": first_entry.get("url"),
                "profile_sample_title": sample_title,
                "profile_sample_views": sample_views,
                "profile_sample_likes": sample_likes,
                "profile_sample_comments": sample_comments,
            }
        except yt_dlp.utils.DownloadError as exc:
            raise ScraperError(f"yt-dlp profile download error: {exc}") from exc
        except Exception as exc:
            raise ScraperError(f"Unexpected yt-dlp profile error: {exc}") from exc

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
