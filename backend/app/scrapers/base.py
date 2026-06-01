from __future__ import annotations

import functools
import logging
import time
from abc import ABC, abstractmethod
from typing import Any, Dict

logger = logging.getLogger(__name__)

# Default retry / timeout configuration
MAX_RETRIES = 3
RETRY_BASE_DELAY = 2  # seconds – exponential: 2, 4, 8
SCRAPE_TIMEOUT = 120  # seconds – global per-scrape ceiling


class ScraperError(Exception):
    """Raised when a scraper cannot extract data from the provided URL."""


class BaseScraper(ABC):
    """Abstract scraper – all platform scrapers must implement `scrape()`."""

    @abstractmethod
    def scrape(self, url: str, comment_limit: int | str | None = 200) -> Dict[str, Any]:
        """
        Scrape a public URL and return a raw dictionary of extracted data.
        Raises ScraperError on failure.
        """
        ...

    # ── Retry wrapper ─────────────────────────────────────────────────────
    def scrape_with_retry(
        self,
        url: str,
        *,
        comment_limit: int | str | None = 200,
        max_retries: int = MAX_RETRIES,
        base_delay: float = RETRY_BASE_DELAY,
    ) -> Dict[str, Any]:
        """Call ``self.scrape()`` with exponential-backoff retries.

        Returns the first successful result.  Only retries on transient
        errors (timeout, connection, rate-limit).  Permanent errors
        (e.g. "URL not found") are raised immediately.
        """
        last_exc: Exception | None = None
        platform = type(self).__name__

        for attempt in range(1, max_retries + 1):
            try:
                t0 = time.monotonic()
                result = self.scrape(url, comment_limit=comment_limit)
                elapsed = time.monotonic() - t0

                comments_count = len(result.get("comments") or [])
                logger.info(
                    "[%s] Scrape OK in %.1fs — url=%s comments=%d (attempt %d/%d)",
                    platform, elapsed, url, comments_count, attempt, max_retries,
                )
                return result

            except ScraperError as exc:
                last_exc = exc
                err_msg = str(exc).lower()

                # Non-retryable (permanent) errors → bail immediately
                permanent_markers = (
                    "not found", "404", "private", "unavailable",
                    "unsupported", "no scraper registered",
                )
                if any(marker in err_msg for marker in permanent_markers):
                    logger.error(
                        "[%s] Permanent error on attempt %d/%d — %s",
                        platform, attempt, max_retries, exc,
                    )
                    raise

                # Retryable → sleep with exponential backoff
                delay = base_delay * (2 ** (attempt - 1))
                logger.warning(
                    "[%s] Transient error on attempt %d/%d — %s — retrying in %.0fs",
                    platform, attempt, max_retries, exc, delay,
                )
                if attempt < max_retries:
                    time.sleep(delay)

            except Exception as exc:
                last_exc = exc
                delay = base_delay * (2 ** (attempt - 1))
                logger.warning(
                    "[%s] Unexpected error on attempt %d/%d — %s — retrying in %.0fs",
                    platform, attempt, max_retries, exc, delay,
                )
                if attempt < max_retries:
                    time.sleep(delay)

        # All retries exhausted
        raise ScraperError(
            f"[{platform}] All {max_retries} attempts failed for {url}: {last_exc}"
        ) from last_exc

    # ── Comment normalisation helpers ─────────────────────────────────────
    @staticmethod
    def clean_comment_text(text: Any) -> str:
        """Normalise comment text — returns empty string for truly empty."""
        if text is None:
            return ""
        s = str(text).strip()
        # Keep emoji-only comments, only reject truly blank strings
        return s

    @staticmethod
    def normalize_comment_list(raw_comments: list) -> list[Dict[str, Any]]:
        """Deduplicate and normalise a list of raw comment dicts."""
        seen: set[str] = set()
        result: list[Dict[str, Any]] = []

        for c in raw_comments:
            if not isinstance(c, dict):
                continue

            text = BaseScraper.clean_comment_text(c.get("text"))
            if not text:
                continue

            # Build dedup key
            key_parts = (
                str(c.get("id") or ""),
                str(c.get("author_id") or c.get("author") or ""),
                text.lower()[:200],
            )
            key = "::".join(key_parts)
            if key in seen:
                continue
            seen.add(key)

            result.append({
                "id": c.get("id"),
                "text": text,
                "author": c.get("author"),
                "author_id": c.get("author_id"),
                "timestamp": c.get("timestamp"),
                "like_count": int(c.get("like_count") or 0),
                "is_favorited": bool(c.get("is_favorited", False)),
                "author_is_uploader": bool(c.get("author_is_uploader", False)),
                "parent": c.get("parent") or "root",
            })

        return result
