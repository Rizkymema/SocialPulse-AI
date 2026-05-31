from __future__ import annotations

from html import unescape
import re

import httpx

from app.scrapers.base import ScraperError

_DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}


def fetch_open_graph_metadata(url: str) -> dict[str, str | None]:
    try:
        response = httpx.get(
            url,
            headers=_DEFAULT_HEADERS,
            follow_redirects=True,
            timeout=30,
        )
        response.raise_for_status()
    except Exception as exc:
        raise ScraperError(f"Could not fetch profile page metadata: {exc}") from exc

    html = response.text
    return {
        "title": _extract_meta(html, property_name="og:title"),
        "description": _extract_meta(html, property_name="og:description")
        or _extract_meta(html, name="description"),
        "image": _extract_meta(html, property_name="og:image"),
    }


def parse_compact_number(value: str | None) -> int | None:
    if not value:
        return None

    normalized = _clean_text(value).replace(" ", "")
    match = re.fullmatch(r"(?i)(\d+(?:[.,]\d+)?)([kmb])?", normalized)
    if not match:
        digits_only = re.sub(r"[^\d]", "", normalized)
        return int(digits_only) if digits_only else None

    number_part = match.group(1)
    suffix = (match.group(2) or "").lower()

    if suffix:
        number = float(number_part.replace(",", "."))
        multiplier = {
            "k": 1_000,
            "m": 1_000_000,
            "b": 1_000_000_000,
        }[suffix]
        return int(number * multiplier)

    digits_only = re.sub(r"[^\d]", "", number_part)
    return int(digits_only) if digits_only else None


def _extract_meta(
    html: str,
    *,
    property_name: str | None = None,
    name: str | None = None,
) -> str | None:
    attribute_name: str
    attribute_value: str

    if property_name is not None:
        attribute_name = "property"
        attribute_value = property_name
    elif name is not None:
        attribute_name = "name"
        attribute_value = name
    else:
        return None

    pattern = re.compile(
        rf'<meta[^>]+{attribute_name}=["\']{re.escape(attribute_value)}["\'][^>]+content=["\']([^"\']+)["\']',
        re.IGNORECASE,
    )
    match = pattern.search(html)
    if not match:
        return None
    return _clean_text(match.group(1))


def _clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", unescape(value)).strip()