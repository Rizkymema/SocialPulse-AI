from __future__ import annotations

from typing import Any, Mapping


def normalize_comment_text(value: Any) -> str:
    return " ".join(str(value or "").split()).strip()


def comment_identity(comment: Mapping[str, Any]) -> tuple[str, str, str, str, str]:
    return (
        str(comment.get("id") or ""),
        str(comment.get("parent") or "root"),
        str(comment.get("author_id") or comment.get("author") or ""),
        str(comment.get("timestamp") or ""),
        normalize_comment_text(comment.get("text")).casefold(),
    )


def canonicalize_comment(raw_comment: Any) -> dict[str, Any] | None:
    if not isinstance(raw_comment, Mapping):
        return None

    text = normalize_comment_text(raw_comment.get("text"))
    if not text:
        return None

    timestamp = raw_comment.get("timestamp")
    if timestamp in (None, ""):
        timestamp_value = None
    else:
        try:
            timestamp_value = int(timestamp)
        except (TypeError, ValueError):
            timestamp_value = None

    try:
        like_count = int(raw_comment.get("like_count") or 0)
    except (TypeError, ValueError):
        like_count = 0

    parent = raw_comment.get("parent") or "root"

    return {
        **dict(raw_comment),
        "text": text,
        "parent": str(parent),
        "timestamp": timestamp_value,
        "like_count": like_count,
    }


def merge_raw_comments(*comment_groups: list[Any]) -> list[dict[str, Any]]:
    merged: list[dict[str, Any]] = []
    seen: set[tuple[str, str, str, str, str]] = set()

    for group in comment_groups:
        for raw_comment in group or []:
            comment = canonicalize_comment(raw_comment)
            if comment is None:
                continue

            identity = comment_identity(comment)
            if identity in seen:
                continue

            seen.add(identity)
            merged.append(comment)

    merged.sort(
        key=lambda comment: (
            0 if (comment.get("parent") or "root") == "root" else 1,
            str(comment.get("parent") or "root"),
            int(comment.get("timestamp") or 0),
            comment_identity(comment),
        )
    )
    return merged


def comments_from_row(row: Mapping[str, Any]) -> list[dict[str, Any]]:
    raw_data = row.get("raw_data")
    if not isinstance(raw_data, Mapping):
        return []
    return merge_raw_comments(raw_data.get("comments") or [])


def derive_scraped_comments_count(row: Mapping[str, Any]) -> int:
    return max(
        int(row.get("scraped_comments_count") or 0),
        len(comments_from_row(row)),
    )


def hydrate_scraped_comments_count(row: Mapping[str, Any]) -> dict[str, Any]:
    hydrated = dict(row)
    hydrated["scraped_comments_count"] = derive_scraped_comments_count(row)
    hydrated["comments"] = max(
        int(row.get("comments") or 0),
        hydrated["scraped_comments_count"],
    )
    return hydrated


def strip_scraped_comments_count(payload: Mapping[str, Any]) -> dict[str, Any]:
    return {
        key: value
        for key, value in payload.items()
        if key != "scraped_comments_count"
    }


def is_missing_scraped_comments_count_error(exc: Exception) -> bool:
    message = str(exc).lower()
    return (
        "scraped_comments_count" in message
        and (
            "could not find the 'scraped_comments_count' column" in message
            or "column scraped_comments_count does not exist" in message
            or "schema cache" in message
            or "pgrst" in message
            or "42703" in message
        )
    )


def merge_post_comment_state(
    existing_row: Mapping[str, Any], latest_normalised: Mapping[str, Any]
) -> dict[str, Any]:
    existing_raw_data_value = existing_row.get("raw_data")
    latest_raw_data_value = latest_normalised.get("raw_data")

    existing_raw_data = (
        dict(existing_raw_data_value) if isinstance(existing_raw_data_value, Mapping) else {}
    )
    latest_raw_data = (
        dict(latest_raw_data_value) if isinstance(latest_raw_data_value, Mapping) else {}
    )

    merged_comments = merge_raw_comments(
        latest_raw_data.get("comments") or [],
        existing_raw_data.get("comments") or [],
    )

    merged = dict(latest_normalised)
    merged["raw_data"] = {
        **existing_raw_data,
        **latest_raw_data,
        "comments": merged_comments,
    }
    merged["comments"] = max(
        int(existing_row.get("comments") or 0),
        int(latest_normalised.get("comments") or 0),
        len(merged_comments),
    )
    merged["scraped_comments_count"] = len(merged_comments)
    return merged
