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
    def normalize(platform: str, raw: Dict[str, Any], url: str) -> NormalisedPost:
        method = getattr(DataNormalizer, f"_normalize_{platform}", None)
        if method is None:
            return DataNormalizer._normalize_generic(raw, url, platform)
        return method(raw, url)

    # ── YouTube ───────────────────────────────────────────────────────────────
    @staticmethod
    def _normalize_youtube(raw: Dict[str, Any], url: str) -> NormalisedPost:
        return NormalisedPost(
            url=url,
            platform=Platform.YOUTUBE,
            post_id=raw.get("id") or raw.get("display_id"),
            username=raw.get("uploader") or raw.get("channel"),
            content=raw.get("title") or raw.get("description", "")[:2000],
            thumbnail_url=raw.get("thumbnail"),
            likes=_safe_int(raw.get("like_count")),
            comments=_safe_int(raw.get("comment_count")),
            shares=0,
            views=_safe_int(raw.get("view_count")),
            posted_at=_parse_timestamp(raw.get("upload_date") or raw.get("timestamp")),
            raw_data=raw,
        )

    # ── TikTok ────────────────────────────────────────────────────────────────
    @staticmethod
    def _normalize_tiktok(raw: Dict[str, Any], url: str) -> NormalisedPost:
        return NormalisedPost(
            url=url,
            platform=Platform.TIKTOK,
            post_id=raw.get("id") or raw.get("display_id"),
            username=raw.get("uploader") or raw.get("creator") or raw.get("author_name"),
            content=raw.get("title") or raw.get("description", "")[:2000],
            thumbnail_url=raw.get("thumbnail") or raw.get("thumbnail_url"),
            likes=_safe_int(raw.get("like_count") or raw.get("digg_count")),
            comments=_safe_int(raw.get("comment_count")),
            shares=_safe_int(raw.get("repost_count") or raw.get("share_count")),
            views=_safe_int(raw.get("view_count") or raw.get("play_count")),
            posted_at=_parse_timestamp(raw.get("timestamp") or raw.get("upload_date")),
            raw_data=raw,
        )

    # ── Instagram ─────────────────────────────────────────────────────────────
    @staticmethod
    def _normalize_instagram(raw: Dict[str, Any], url: str) -> NormalisedPost:
        return NormalisedPost(
            url=url,
            platform=Platform.INSTAGRAM,
            post_id=raw.get("id") or raw.get("shortcode"),
            username=raw.get("uploader") or raw.get("author_name") or raw.get("owner_username"),
            content=raw.get("description") or raw.get("title") or raw.get("caption", ""),
            thumbnail_url=raw.get("thumbnail") or raw.get("thumbnail_url"),
            likes=_safe_int(raw.get("like_count")),
            comments=_safe_int(raw.get("comment_count")),
            shares=0,
            views=_safe_int(raw.get("view_count")),
            posted_at=_parse_timestamp(raw.get("timestamp") or raw.get("upload_date")),
            raw_data=raw,
        )

    # ── Facebook ──────────────────────────────────────────────────────────────
    @staticmethod
    def _normalize_facebook(raw: Dict[str, Any], url: str) -> NormalisedPost:
        return NormalisedPost(
            url=url,
            platform=Platform.FACEBOOK,
            post_id=raw.get("id") or raw.get("display_id"),
            username=raw.get("uploader") or raw.get("author_name") or raw.get("page_name"),
            content=raw.get("description") or raw.get("title") or raw.get("message", ""),
            thumbnail_url=raw.get("thumbnail") or raw.get("thumbnail_url"),
            likes=_safe_int(raw.get("like_count")),
            comments=_safe_int(raw.get("comment_count")),
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
        return NormalisedPost(
            url=url,
            platform=platform,
            post_id=raw.get("id"),
            username=raw.get("uploader") or raw.get("author_name"),
            content=raw.get("title") or raw.get("description", ""),
            thumbnail_url=raw.get("thumbnail"),
            likes=_safe_int(raw.get("like_count")),
            comments=_safe_int(raw.get("comment_count")),
            shares=_safe_int(raw.get("repost_count")),
            views=_safe_int(raw.get("view_count")),
            posted_at=_parse_timestamp(raw.get("timestamp")),
            raw_data=raw,
        )
