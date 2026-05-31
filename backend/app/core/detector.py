from __future__ import annotations

import re
from enum import StrEnum
from urllib.parse import urlparse


class Platform(StrEnum):
    YOUTUBE = "youtube"
    TIKTOK = "tiktok"
    INSTAGRAM = "instagram"
    FACEBOOK = "facebook"
    UNKNOWN = "unknown"


# ── URL patterns ──────────────────────────────────────────────────────────────

_PATTERNS: list[tuple[re.Pattern[str], Platform]] = [
    # YouTube
    (
        re.compile(
            r"(?:https?://)?(?:www\.|m\.)?(?:youtube\.com/(?:watch\?.*v=|shorts/|embed/|v/)|youtu\.be/)"
            r"[\w\-]{11}",
            re.IGNORECASE,
        ),
        Platform.YOUTUBE,
    ),
    # TikTok
    (
        re.compile(
            r"(?:https?://)?(?:www\.|vm\.|m\.)?tiktok\.com/(?:@[\w.]+/video/\d+|t/[\w]+|v/\d+\.html)",
            re.IGNORECASE,
        ),
        Platform.TIKTOK,
    ),
    # Instagram
    (
        re.compile(
            r"(?:https?://)?(?:www\.)?instagram\.com/(?:p|reel|reels|tv)/[\w\-]+",
            re.IGNORECASE,
        ),
        Platform.INSTAGRAM,
    ),
    # Facebook post / video / reel
    (
        re.compile(
            r"(?:https?://)?(?:www\.|m\.|web\.)?(?:facebook\.com|fb\.com|fb\.watch)/",
            re.IGNORECASE,
        ),
        Platform.FACEBOOK,
    ),
]


class PlatformDetector:
    """Detect social-media platform from a raw URL string."""

    @staticmethod
    def detect(url: str) -> Platform:
        url = url.strip()
        for pattern, platform in _PATTERNS:
            if pattern.search(url):
                return platform
        return Platform.UNKNOWN

    @staticmethod
    def extract_video_id(url: str, platform: Platform) -> str | None:
        """Best-effort extraction of the native content ID from the URL."""
        try:
            if platform == Platform.YOUTUBE:
                # watch?v=ID | youtu.be/ID | shorts/ID
                m = re.search(
                    r"(?:v=|youtu\.be/|shorts/|embed/|v/)([A-Za-z0-9_\-]{11})", url
                )
                return m.group(1) if m else None

            if platform == Platform.TIKTOK:
                m = re.search(r"/video/(\d+)", url)
                return m.group(1) if m else None

            if platform == Platform.INSTAGRAM:
                m = re.search(r"/(?:p|reel|reels|tv)/([\w\-]+)", url)
                return m.group(1) if m else None

            if platform == Platform.FACEBOOK:
                # posts/ID, videos/ID, or ?v=ID
                m = re.search(r"(?:posts|videos|video|reel)/(\d+)", url)
                if m:
                    return m.group(1)
                m = re.search(r"[?&]v=(\d+)", url)
                return m.group(1) if m else None

        except Exception:
            return None

        return None

    @staticmethod
    def is_supported(url: str) -> bool:
        return PlatformDetector.detect(url) != Platform.UNKNOWN
