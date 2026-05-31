from __future__ import annotations

import logging
from typing import Any, Dict

import yt_dlp

from app.config import settings
from app.scrapers.base import BaseScraper, ScraperError

logger = logging.getLogger(__name__)

# yt-dlp options – metadata only, no download
_YDL_OPTS: Dict[str, Any] = {
    "quiet": True,
    "no_warnings": True,
    "skip_download": True,
    "extract_flat": False,
    "writeinfojson": False,
    "socket_timeout": 30,
    "format": "bestaudio/best",
    "ignore_no_formats_error": True,
    # Enable comment extraction via YouTube InnerTube (no API key needed)
    "getcomments": True,
    "extractor_args": {
        "youtube": {
            "skip": ["hls", "dash", "translated_subs"],
            # Fetch semua komentar (tanpa batas); ubah ke "500" jika ingin dibatasi
            "max_comments": ["all"],
        }
    },
}


class YouTubeScraper(BaseScraper):
    """
    Scrape public YouTube video metadata.

    Strategy (in order):
    1. YouTube Data API v3 – if YOUTUBE_API_KEY is set in env
    2. yt-dlp extraction (public video, no auth required)
    """

    def scrape(self, url: str) -> Dict[str, Any]:
        # Try YouTube Data API first (richer data, respects quotas)
        if settings.YOUTUBE_API_KEY:
            try:
                return self._scrape_via_api(url)
            except Exception as exc:
                logger.warning("YouTube API failed, falling back to yt-dlp: %s", exc)

        # Fall back to yt-dlp
        return self._scrape_via_ytdlp(url)

    # ── YouTube Data API v3 ───────────────────────────────────────────────────
    def _scrape_via_api(self, url: str) -> Dict[str, Any]:
        import re
        import httpx

        m = re.search(
            r"(?:v=|youtu\.be/|shorts/|embed/)([A-Za-z0-9_\-]{11})", url
        )
        if not m:
            raise ScraperError(f"Could not extract video ID from URL: {url}")
        video_id = m.group(1)

        api_url = (
            "https://www.googleapis.com/youtube/v3/videos"
            f"?id={video_id}"
            "&part=snippet,statistics,contentDetails"
            f"&key={settings.YOUTUBE_API_KEY}"
        )
        response = httpx.get(api_url, timeout=15)
        response.raise_for_status()
        data = response.json()

        items = data.get("items", [])
        if not items:
            raise ScraperError(f"YouTube API returned no results for video ID: {video_id}")

        item = items[0]
        snippet = item.get("snippet", {})
        stats = item.get("statistics", {})

        return {
            "id": video_id,
            "title": snippet.get("title"),
            "description": snippet.get("description"),
            "uploader": snippet.get("channelTitle"),
            "channel": snippet.get("channelTitle"),
            "channel_id": snippet.get("channelId"),
            "upload_date": snippet.get("publishedAt"),
            "thumbnail": (
                snippet.get("thumbnails", {}).get("high", {}).get("url")
                or snippet.get("thumbnails", {}).get("default", {}).get("url")
            ),
            "view_count": stats.get("viewCount"),
            "like_count": stats.get("likeCount"),
            "comment_count": stats.get("commentCount"),
            "tags": snippet.get("tags", []),
            "_source": "youtube_api_v3",
        }

    # ── yt-dlp ────────────────────────────────────────────────────────────────
    def _scrape_via_ytdlp(self, url: str) -> Dict[str, Any]:
        try:
            with yt_dlp.YoutubeDL(_YDL_OPTS) as ydl:
                info = ydl.extract_info(url, download=False)
                if info is None:
                    raise ScraperError("yt-dlp returned no info for URL")
                # Strip large binary blobs from raw_data, keep comments
                info.pop("formats", None)
                info.pop("thumbnails", None)
                info["_source"] = "yt_dlp"
                # Normalize comments into a clean list
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
                    "YouTube scrape complete: %d comments collected for %s",
                    len(info["comments"]),
                    url,
                )
                return info
        except yt_dlp.utils.DownloadError as exc:
            raise ScraperError(f"yt-dlp download error: {exc}") from exc
        except Exception as exc:
            raise ScraperError(f"Unexpected yt-dlp error: {exc}") from exc
