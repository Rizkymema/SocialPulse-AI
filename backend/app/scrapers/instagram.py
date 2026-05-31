from __future__ import annotations

import logging
import re
from typing import Any, Dict, List
from urllib.parse import urlparse

import httpx
import yt_dlp

from app.config import settings
from app.scrapers.profile_metadata import (
    fetch_open_graph_metadata,
    parse_compact_number,
)
from app.scrapers.base import BaseScraper, ScraperError

logger = logging.getLogger(__name__)

# yt-dlp opts — aktifkan getcomments, User-Agent browser, dan sleep
_YDL_OPTS: Dict[str, Any] = {
    "quiet": True,
    "no_warnings": True,
    "skip_download": True,
    "extract_flat": False,
    "socket_timeout": 30,
    "format": "bestaudio/best",
    "ignore_no_formats_error": True,
    "getcomments": True,
    "extractor_args": {
        "instagram": {
            "max_comments": ["all"],
        }
    },
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

# Regex untuk ekstrak shortcode dari URL Instagram
_SHORTCODE_RE = re.compile(
    r"instagram\.com/(?:p|reel|tv|reels)/([A-Za-z0-9_\-]+)"
)
_PROFILE_RE = re.compile(
    r"instagram\.com/(?P<username>(?!p/|reel/|reels/|tv/|stories/|explore/|accounts/|direct/)[A-Za-z0-9._]+)/?",
    re.IGNORECASE,
)

# Instagram oEmbed publik
_IG_OEMBED = "https://www.instagram.com/api/v1/oembed/"


class InstagramScraper(BaseScraper):
    """
    Scrape public Instagram posts / reels.

    Strategy (berurutan):
    1. yt-dlp        — terbaik untuk Reels & video, mendukung komentar
    2. instaloader   — foto & carousel akun publik, komentar publik
    3. Meta Graph API oEmbed — jika META_ACCESS_TOKEN dikonfigurasi
    4. Instagram oEmbed publik — fallback ringan (metadata only)
    """

    def scrape(self, url: str, comment_limit: int | str | None = 200) -> Dict[str, Any]:
        if self._is_profile_url(url):
            return self._scrape_profile_metadata(url)

        # 1. yt-dlp
        try:
            return self._scrape_via_ytdlp(url, comment_limit=comment_limit)
        except ScraperError as exc:
            logger.warning("yt-dlp failed for Instagram (%s), trying instaloader", exc)

        # 2. instaloader
        try:
            return self._scrape_via_instaloader(url, comment_limit=comment_limit)
        except Exception as exc:
            logger.warning("instaloader failed (%s), trying oEmbed", exc)

        # 3. Meta Graph API jika ada token
        if settings.META_ACCESS_TOKEN:
            try:
                return self._scrape_via_graph_oembed(url)
            except ScraperError as exc:
                logger.warning("Meta Graph API oEmbed failed: %s", exc)

        # 4. Instagram oEmbed publik
        return self._scrape_via_oembed(url)

    def _is_profile_url(self, url: str) -> bool:
        return _SHORTCODE_RE.search(url) is None and _PROFILE_RE.search(url) is not None

    def _scrape_profile_metadata(self, url: str) -> Dict[str, Any]:
        metadata = fetch_open_graph_metadata(url)
        parsed = urlparse(url)
        username = parsed.path.strip("/").split("/")[0]

        description = metadata.get("description") or f"Profil Instagram @{username}"
        match = re.search(
            r"([\d.,]+[KMB]?)\s+Followers,\s+([\d.,]+[KMB]?)\s+Following,\s+([\d.,]+[KMB]?)\s+Posts",
            description,
            re.IGNORECASE,
        )

        followers = parse_compact_number(match.group(1)) if match else None
        following = parse_compact_number(match.group(2)) if match else None
        posts_count = parse_compact_number(match.group(3)) if match else None

        return {
            "_source": "instagram_profile_meta",
            "profile_type": "profile",
            "id": username,
            "title": metadata.get("title") or f"Instagram @{username}",
            "description": description,
            "author_name": username,
            "owner_username": username,
            "thumbnail_url": metadata.get("image"),
            "webpage_url": url,
            "profile_followers": followers,
            "profile_following": following,
            "profile_posts": posts_count,
        }

    # ── 1. yt-dlp ─────────────────────────────────────────────────────────────
    def _scrape_via_ytdlp(self, url: str, comment_limit: int | str | None = 200) -> Dict[str, Any]:
        try:
            from copy import deepcopy
            opts = deepcopy(_YDL_OPTS)
            opts["extractor_args"] = {
                "instagram": {
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
                info["comments"] = self._normalize_comments(
                    info.get("comments") or []
                )
                logger.info(
                    "Instagram yt-dlp OK: %d comments", len(info["comments"])
                )
                return info
        except yt_dlp.utils.DownloadError as exc:
            raise ScraperError(f"yt-dlp download error: {exc}") from exc
        except Exception as exc:
            raise ScraperError(f"Unexpected yt-dlp error: {exc}") from exc

    # ── 2. instaloader ────────────────────────────────────────────────────────
    def _scrape_via_instaloader(self, url: str, comment_limit: int | str | None = 200) -> Dict[str, Any]:
        """Scrape post publik via instaloader — tidak memerlukan login."""
        try:
            import instaloader
        except ImportError:
            raise ScraperError("instaloader not installed")

        m = _SHORTCODE_RE.search(url)
        if not m:
            raise ScraperError(f"Cannot extract Instagram shortcode from: {url}")

        shortcode = m.group(1)
        L = instaloader.Instaloader(
            quiet=True,
            download_pictures=False,
            download_videos=False,
            download_video_thumbnails=False,
            download_geotags=False,
            download_comments=True,
            save_metadata=False,
            compress_json=False,
        )

        post = instaloader.Post.from_shortcode(L.context, shortcode)

        limit = int(comment_limit) if comment_limit else 200
        comments: List[Dict[str, Any]] = []
        try:
            for c in post.get_comments():
                if len(comments) >= limit:
                    break
                comments.append({
                    "id": str(c.id),
                    "text": c.text,
                    "author": c.owner.username if c.owner else None,
                    "author_id": str(c.owner.userid) if c.owner else None,
                    "timestamp": (
                        int(c.created_at_utc.timestamp())
                        if c.created_at_utc else None
                    ),
                    "like_count": getattr(c, "likes_count", 0) or 0,
                    "is_favorited": False,
                    "author_is_uploader": (
                        c.owner.userid == post.owner_id if c.owner else False
                    ),
                    "parent": "root",
                })
        except Exception as exc:
            logger.warning("Could not fetch comments via instaloader: %s", exc)

        logger.info("Instagram instaloader OK: %d comments", len(comments))
        return {
            "_source": "instaloader",
            "id": shortcode,
            "title": post.caption or "",
            "description": post.caption or "",
            "uploader": post.owner_username,
            "uploader_id": str(post.owner_id),
            "timestamp": int(post.date_utc.timestamp()),
            "like_count": post.likes,
            "comment_count": post.comments,
            "view_count": post.video_view_count if post.is_video else None,
            "thumbnail": post.url,
            "webpage_url": url,
            "is_video": post.is_video,
            "comments": comments,
        }

    # ── 3. Instagram oEmbed publik ────────────────────────────────────────────
    def _scrape_via_oembed(self, url: str) -> Dict[str, Any]:
        """Instagram public oEmbed — no token required."""
        try:
            response = httpx.get(
                _IG_OEMBED,
                params={"url": url, "hidecaption": False},
                headers={"User-Agent": "Mozilla/5.0"},
                timeout=15,
            )
            response.raise_for_status()
            data = response.json()
            data["_source"] = "instagram_oembed"
            return data
        except httpx.HTTPStatusError as exc:
            raise ScraperError(f"Instagram oEmbed HTTP error: {exc}") from exc
        except Exception as exc:
            raise ScraperError(f"Instagram oEmbed error: {exc}") from exc

    # ── 4. Meta Graph API oEmbed ──────────────────────────────────────────────
    def _scrape_via_graph_oembed(self, url: str) -> Dict[str, Any]:
        """Meta Graph API oEmbed — requires META_ACCESS_TOKEN."""
        try:
            response = httpx.get(
                "https://graph.facebook.com/v19.0/instagram_oembed",
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
