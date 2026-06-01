from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
import logging
import re
from typing import Any, Dict
from urllib.parse import urlparse

import httpx
import yt_dlp

from app.config import settings
from app.scrapers.base import BaseScraper, ScraperError

logger = logging.getLogger(__name__)

# yt-dlp options – metadata only, no download
_BASE_YDL_OPTS: Dict[str, Any] = {
    "quiet": True,
    "no_warnings": True,
    "skip_download": True,
    "extract_flat": False,
    "writeinfojson": False,
    "socket_timeout": 30,
    "format": "bestaudio/best",
    "ignore_no_formats_error": True,
}

_YOUTUBE_SKIP_EXTRACTORS = ["hls", "dash", "translated_subs"]
_FALLBACK_PLAYER_CLIENTS = ("mweb", "web", "tv")
_ENGAGEMENT_FIELDS = ("like_count", "comment_count", "view_count")
_WATCH_PAGE_LIKE_COUNT_RE = re.compile(
    r'"accessibilityText":"like this video along with ([0-9,]+) other people"',
    re.IGNORECASE,
)


def _has_metric(value: Any) -> bool:
    return value is not None and value != ""


def _build_ydl_opts(
    *,
    include_comments: bool,
    player_client: str | None = None,
    comment_limit: int | str | None = None,
) -> Dict[str, Any]:
    opts = deepcopy(_BASE_YDL_OPTS)
    youtube_args: Dict[str, Any] = {
        "skip": list(_YOUTUBE_SKIP_EXTRACTORS),
    }

    if include_comments:
        opts["getcomments"] = True
        # Keep inline scrapes bounded so Vercel requests can finish reliably.
        youtube_args["max_comments"] = [str(comment_limit or 200)]

    if player_client:
        youtube_args["player_client"] = [player_client]

    opts["extractor_args"] = {"youtube": youtube_args}
    return opts


class YouTubeScraper(BaseScraper):
    """
    Scrape public YouTube video metadata.

    Strategy (in order):
    1. YouTube Data API v3 – if YOUTUBE_API_KEY is set in env
    2. yt-dlp extraction (public video, no auth required)
    """

    def scrape(self, url: str, comment_limit: int | str | None = 200) -> Dict[str, Any]:
        if self._is_profile_url(url):
            return self._scrape_profile_via_ytdlp(url)

        # Try YouTube Data API first (richer data, respects quotas)
        if settings.YOUTUBE_API_KEY:
            try:
                return self._scrape_via_api(url, comment_limit=comment_limit)
            except Exception as exc:
                logger.warning("YouTube API failed, falling back to yt-dlp: %s", exc)

        # Fall back to yt-dlp
        return self._scrape_via_ytdlp(url, comment_limit=comment_limit)

    def _is_profile_url(self, url: str) -> bool:
        parsed = urlparse(url)
        host = parsed.netloc.lower()
        path = parsed.path.lower()

        if "youtu.be" in host:
            return False
        return bool(
            re.search(r"^/(?:@|channel/|c/|user/)", path, re.IGNORECASE)
        )

    # ── YouTube Data API v3 ───────────────────────────────────────────────────
    def _scrape_via_api(self, url: str, comment_limit: int | str | None = 200) -> Dict[str, Any]:
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

        video_info = {
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

        # Fetch comments via API
        comments_list = []
        limit = int(comment_limit) if comment_limit else 200
        try:
            next_page_token = None
            while len(comments_list) < limit:
                max_results = min(100, limit - len(comments_list))
                comments_url = (
                    "https://www.googleapis.com/youtube/v3/commentThreads"
                    f"?part=snippet&videoId={video_id}&maxResults={max_results}&key={settings.YOUTUBE_API_KEY}"
                )
                if next_page_token:
                    comments_url += f"&pageToken={next_page_token}"
                comments_resp = httpx.get(comments_url, timeout=15)
                if comments_resp.status_code != 200:
                    break
                comments_data = comments_resp.json()
                thread_items = comments_data.get("items", [])
                if not thread_items:
                    break
                for item in thread_items:
                    top_comment = item.get("snippet", {}).get("topLevelComment", {})
                    c_snippet = top_comment.get("snippet", {})
                    
                    published_at = c_snippet.get("publishedAt")
                    timestamp = None
                    if published_at:
                        try:
                            # 2020-06-01T00:00:00Z
                            dt = datetime.strptime(published_at, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
                            timestamp = int(dt.timestamp())
                        except Exception:
                            try:
                                dt = datetime.strptime(published_at, "%Y-%m-%dT%H:%M:%S.%fZ").replace(tzinfo=timezone.utc)
                                timestamp = int(dt.timestamp())
                            except Exception:
                                pass

                    comments_list.append({
                        "id": top_comment.get("id"),
                        "text": c_snippet.get("textDisplay", ""),
                        "author": c_snippet.get("authorDisplayName"),
                        "author_id": c_snippet.get("authorChannelId", {}).get("value"),
                        "timestamp": timestamp,
                        "like_count": int(c_snippet.get("likeCount") or 0),
                        "is_favorited": False,
                        "author_is_uploader": False,
                        "parent": "root",
                    })
                next_page_token = comments_data.get("nextPageToken")
                if not next_page_token:
                    break
        except Exception as exc:
            logger.warning("Failed to fetch comments via YouTube API: %s", exc)

        video_info["comments"] = self.normalize_comment_list(comments_list)
        logger.info(
            "YouTube API scrape: %d comments fetched (API reported %s) for %s",
            len(video_info["comments"]),
            video_info.get("comment_count", "?"),
            url,
        )
        return video_info

    # ── yt-dlp ────────────────────────────────────────────────────────────────
    def _extract_with_ytdlp(
        self,
        url: str,
        *,
        include_comments: bool,
        player_client: str | None = None,
        comment_limit: int | str | None = None,
    ) -> Dict[str, Any]:
        opts = _build_ydl_opts(
            include_comments=include_comments,
            player_client=player_client,
            comment_limit=comment_limit,
        )
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=False)
            if info is None:
                raise ScraperError("yt-dlp returned no info for URL")
            return info

    def _scrape_profile_via_ytdlp(self, url: str) -> Dict[str, Any]:
        opts = deepcopy(_BASE_YDL_OPTS)
        opts["extract_flat"] = True
        opts["playlistend"] = 1

        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                info = ydl.extract_info(url, download=False)
                if info is None:
                    raise ScraperError("yt-dlp returned no profile info for URL")

            first_entry = next(
                (
                    entry
                    for entry in info.get("entries") or []
                    if isinstance(entry, dict)
                ),
                {},
            )
            profile_name = (
                info.get("uploader")
                or info.get("channel")
                or info.get("title")
                or "unknown"
            )
            follower_count = info.get("channel_follower_count")
            description_parts = [f"Profil channel YouTube {profile_name}."]
            if isinstance(follower_count, int) and follower_count > 0:
                description_parts.append(
                    f"Subscriber: {follower_count:,}."
                )

            bio = (info.get("description") or "").strip()
            if bio:
                description_parts.append(bio[:1600])

            sample_title = first_entry.get("title")
            if isinstance(sample_title, str) and sample_title.strip():
                description_parts.append(
                    f"Contoh video terbaru: {sample_title.strip()}"
                )

            return {
                "_source": "yt_dlp_profile",
                "profile_type": "profile",
                "id": info.get("id"),
                "title": profile_name,
                "description": " ".join(description_parts).strip(),
                "uploader": profile_name,
                "channel": profile_name,
                "channel_follower_count": follower_count,
                "thumbnail": first_entry.get("thumbnail") or info.get("thumbnail"),
                "webpage_url": info.get("webpage_url") or url,
                "profile_followers": follower_count,
                "profile_sample_url": first_entry.get("url"),
                "profile_sample_title": sample_title,
            }
        except yt_dlp.utils.DownloadError as exc:
            raise ScraperError(f"yt-dlp profile download error: {exc}") from exc
        except Exception as exc:
            raise ScraperError(f"Unexpected yt-dlp profile error: {exc}") from exc

    def _backfill_missing_engagement(self, url: str, info: Dict[str, Any]) -> None:
        missing_fields = [
            field for field in _ENGAGEMENT_FIELDS if not _has_metric(info.get(field))
        ]
        if not missing_fields:
            return

        for player_client in _FALLBACK_PLAYER_CLIENTS:
            try:
                fallback = self._extract_with_ytdlp(
                    url, include_comments=False, player_client=player_client
                )
            except Exception as exc:
                logger.warning(
                    "YouTube metadata retry failed with client %s for %s: %s",
                    player_client,
                    url,
                    exc,
                )
                continue

            restored_fields: list[str] = []
            for field in missing_fields:
                if _has_metric(info.get(field)):
                    continue

                fallback_value = fallback.get(field)
                if _has_metric(fallback_value):
                    info[field] = fallback_value
                    restored_fields.append(field)

            if restored_fields:
                logger.info(
                    "YouTube metadata retry restored %s with client %s for %s",
                    ", ".join(restored_fields),
                    player_client,
                    url,
                )

            if all(_has_metric(info.get(field)) for field in missing_fields):
                return

        if "like_count" in missing_fields and not _has_metric(info.get("like_count")):
            watch_page_like_count = self._fetch_watch_page_like_count(url)
            if watch_page_like_count is not None:
                info["like_count"] = watch_page_like_count
                logger.info(
                    "Recovered YouTube like_count from watch page for %s",
                    url,
                )

    def _fetch_watch_page_like_count(self, url: str) -> int | None:
        try:
            response = httpx.get(
                url,
                params={"hl": "en", "gl": "US"},
                headers={
                    "User-Agent": (
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) "
                        "Chrome/136.0.0.0 Safari/537.36"
                    ),
                    "Accept-Language": "en-US,en;q=0.9",
                },
                follow_redirects=True,
                timeout=30,
            )
            response.raise_for_status()
        except Exception as exc:
            logger.warning("Failed to fetch YouTube watch page for %s: %s", url, exc)
            return None

        match = _WATCH_PAGE_LIKE_COUNT_RE.search(response.text)
        if not match:
            return None

        try:
            return int(match.group(1).replace(",", ""))
        except ValueError:
            return None

    def _scrape_via_ytdlp(
        self,
        url: str,
        *,
        comment_limit: int | str | None = 200,
    ) -> Dict[str, Any]:
        try:
            info = self._extract_with_ytdlp(
                url,
                include_comments=True,
                comment_limit=comment_limit,
            )
            self._backfill_missing_engagement(url, info)

            # Strip large binary blobs from raw_data, keep comments
            info.pop("formats", None)
            info.pop("thumbnails", None)
            info["_source"] = "yt_dlp"

            # Normalize comments into a clean list
            raw_comments = info.get("comments") or []
            info["comments"] = self.normalize_comment_list(raw_comments)
            logger.info(
                "YouTube yt-dlp scrape: %d comments collected (reported %s) for %s",
                len(info["comments"]),
                info.get("comment_count", "?"),
                url,
            )
            return info
        except yt_dlp.utils.DownloadError as exc:
            raise ScraperError(f"yt-dlp download error: {exc}") from exc
        except Exception as exc:
            raise ScraperError(f"Unexpected yt-dlp error: {exc}") from exc
