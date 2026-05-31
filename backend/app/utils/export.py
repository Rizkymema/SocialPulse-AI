from __future__ import annotations

import csv
import io
import json
from typing import List

# Columns included in CSV / JSON exports
_FIELDS = [
    "id",
    "platform",
    "post_id",
    "username",
    "content",
    "likes",
    "comments",
    "shares",
    "views",
    "posted_at",
    "url",
    "thumbnail_url",
    "created_at",
]


def _post_to_dict(post: dict) -> dict:
    return {
        "id": str(post.get("id", "")),
        "platform": post.get("platform", ""),
        "post_id": post.get("post_id") or "",
        "username": post.get("username") or "",
        "content": (post.get("content") or "").replace("\n", " "),
        "likes": post.get("likes") or 0,
        "comments": post.get("comments") or 0,
        "shares": post.get("shares") or 0,
        "views": post.get("views") or 0,
        "posted_at": post.get("posted_at") or "",
        "url": post.get("url", ""),
        "thumbnail_url": post.get("thumbnail_url") or "",
        "created_at": post.get("created_at") or "",
    }


def posts_to_csv(posts: List[dict]) -> str:
    """Serialise a list of scraped_posts dicts to a UTF-8 CSV string."""
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=_FIELDS, extrasaction="ignore")
    writer.writeheader()
    for post in posts:
        writer.writerow(_post_to_dict(post))
    return output.getvalue()


def posts_to_json(posts: List[dict]) -> str:
    """Serialise a list of scraped_posts dicts to a pretty-printed JSON string."""
    data = [_post_to_dict(p) for p in posts]
    return json.dumps(data, indent=2, ensure_ascii=False)
