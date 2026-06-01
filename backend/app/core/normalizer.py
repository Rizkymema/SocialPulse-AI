from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict

from app.schemas.scrape import NormalisedPost
from app.core.detector import Platform


def _safe_int(value: Any, default: int = 0) -> int:
    """Coerce to int, falling back to default on failure."""
    if value is None:
        return default
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _parse_timestamp(value: Any) -> datetime | None:
    """Parse various timestamp representations into a timezone-aware datetime."""
    if value is None:
        return None
    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value
    if isinstance(value, (int, float)):
        # Unix timestamp
        try:
            return datetime.fromtimestamp(value, tz=timezone.utc)
        except (OSError, OverflowError, ValueError):
            return None
    if isinstance(value, str):
        for fmt in (
            "%Y-%m-%dT%H:%M:%S%z",
            "%Y-%m-%dT%H:%M:%SZ",
            "%Y-%m-%dT%H:%M:%S.%f%z",
            "%Y-%m-%d %H:%M:%S",
            "%Y%m%d",
        ):
            try:
                dt = datetime.strptime(value, fmt)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                return dt
            except ValueError:
                continue
    return None


class DataNormalizer:
    """Translate raw scraper output into a unified NormalisedPost schema."""

    @staticmethod
    def _pick_content(raw: Dict[str, Any], *keys: str) -> str:
        if raw.get("profile_type") == "profile":
            profile_content = raw.get("description") or raw.get("title") or ""
            return str(profile_content)[:2000]

        for key in keys:
            value = raw.get(key)
            if isinstance(value, str) and value:
                return value[:2000]
        return ""

    @staticmethod
    def normalize(platform: str, raw: Dict[str, Any], url: str) -> NormalisedPost:
        method = getattr(DataNormalizer, f"_normalize_{platform}", None)
        if method is None:
            return DataNormalizer._normalize_generic(raw, url, platform)
        return method(raw, url)

    # ── YouTube ───────────────────────────────────────────────────────────────
    @staticmethod
    def _normalize_youtube(raw: Dict[str, Any], url: str) -> NormalisedPost:
        comments_list = raw.get("comments") or []
        platform_count = _safe_int(raw.get("comment_count"))
        return NormalisedPost(
            url=url,
            platform=Platform.YOUTUBE,
            post_id=raw.get("id") or raw.get("display_id"),
            username=raw.get("uploader") or raw.get("channel"),
            content=DataNormalizer._pick_content(raw, "title", "description"),
            thumbnail_url=raw.get("thumbnail"),
            likes=_safe_int(raw.get("like_count")),
            comments=max(platform_count, len(comments_list)),
            scraped_comments_count=len(comments_list),
            shares=0,
            views=_safe_int(raw.get("view_count")),
            posted_at=_parse_timestamp(raw.get("upload_date") or raw.get("timestamp")),
            raw_data=raw,
        )

    # ── TikTok ────────────────────────────────────────────────────────────────
    @staticmethod
    def _normalize_tiktok(raw: Dict[str, Any], url: str) -> NormalisedPost:
        comments_list = raw.get("comments") or []
        platform_count = _safe_int(raw.get("comment_count"))
        return NormalisedPost(
            url=url,
            platform=Platform.TIKTOK,
            post_id=raw.get("id") or raw.get("display_id"),
            username=raw.get("uploader") or raw.get("creator") or raw.get("author_name"),
            content=DataNormalizer._pick_content(raw, "title", "description"),
            thumbnail_url=raw.get("thumbnail") or raw.get("thumbnail_url"),
            likes=_safe_int(raw.get("like_count") or raw.get("digg_count")),
            comments=max(platform_count, len(comments_list)),
            scraped_comments_count=len(comments_list),
            shares=_safe_int(raw.get("repost_count") or raw.get("share_count")),
            views=_safe_int(raw.get("view_count") or raw.get("play_count")),
            posted_at=_parse_timestamp(raw.get("timestamp") or raw.get("upload_date")),
            raw_data=raw,
        )

    # ── Instagram ─────────────────────────────────────────────────────────────
    @staticmethod
    def _normalize_instagram(raw: Dict[str, Any], url: str) -> NormalisedPost:
        comments_list = raw.get("comments") or []
        platform_count = _safe_int(raw.get("comment_count"))
        return NormalisedPost(
            url=url,
            platform=Platform.INSTAGRAM,
            post_id=raw.get("id") or raw.get("shortcode"),
            username=raw.get("uploader") or raw.get("author_name") or raw.get("owner_username"),
            content=DataNormalizer._pick_content(raw, "description", "title", "caption"),
            thumbnail_url=raw.get("thumbnail") or raw.get("thumbnail_url"),
            likes=_safe_int(raw.get("like_count")),
            comments=max(platform_count, len(comments_list)),
            scraped_comments_count=len(comments_list),
            shares=0,
            views=_safe_int(raw.get("view_count")),
            posted_at=_parse_timestamp(raw.get("timestamp") or raw.get("upload_date")),
            raw_data=raw,
        )

    # ── Facebook ──────────────────────────────────────────────────────────────
    @staticmethod
    def _normalize_facebook(raw: Dict[str, Any], url: str) -> NormalisedPost:
        comments_list = raw.get("comments") or []
        platform_count = _safe_int(raw.get("comment_count"))
        return NormalisedPost(
            url=url,
            platform=Platform.FACEBOOK,
            post_id=raw.get("id") or raw.get("display_id"),
            username=raw.get("uploader") or raw.get("author_name") or raw.get("page_name"),
            content=DataNormalizer._pick_content(raw, "description", "title", "message"),
            thumbnail_url=raw.get("thumbnail") or raw.get("thumbnail_url"),
            likes=_safe_int(raw.get("like_count")),
            comments=max(platform_count, len(comments_list)),
            scraped_comments_count=len(comments_list),
            shares=_safe_int(raw.get("repost_count")),
            views=_safe_int(raw.get("view_count")),
            posted_at=_parse_timestamp(raw.get("timestamp") or raw.get("upload_date")),
            raw_data=raw,
        )

    # ── Generic fallback ──────────────────────────────────────────────────────
    @staticmethod
    def _normalize_generic(
        raw: Dict[str, Any], url: str, platform: str
    ) -> NormalisedPost:
        comments_list = raw.get("comments") or []
        platform_count = _safe_int(raw.get("comment_count"))
        return NormalisedPost(
            url=url,
            platform=platform,
            post_id=raw.get("id"),
            username=raw.get("uploader") or raw.get("author_name"),
            content=raw.get("title") or raw.get("description", ""),
            thumbnail_url=raw.get("thumbnail"),
            likes=_safe_int(raw.get("like_count")),
            comments=max(platform_count, len(comments_list)),
            scraped_comments_count=len(comments_list),
            shares=_safe_int(raw.get("repost_count")),
            views=_safe_int(raw.get("view_count")),
            posted_at=_parse_timestamp(raw.get("timestamp")),
            raw_data=raw,
        )
