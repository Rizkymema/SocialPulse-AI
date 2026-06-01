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
    "scraped_comments_count",
    "shares",
    "views",
    "posted_at",
    "url",
    "thumbnail_url",
    "created_at",
    "comment_id",
    "comment_author",
    "comment_text",
    "comment_likes",
    "comment_timestamp",
    "comment_parent",
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
        "scraped_comments_count": post.get("scraped_comments_count") or 0,
        "shares": post.get("shares") or 0,
        "views": post.get("views") or 0,
        "posted_at": post.get("posted_at") or "",
        "url": post.get("url", ""),
        "thumbnail_url": post.get("thumbnail_url") or "",
        "created_at": post.get("created_at") or "",
    }


def posts_to_csv(posts: List[dict]) -> str:
    """Serialise a list of scraped_posts dicts to a UTF-8 CSV string with comments."""
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=_FIELDS, extrasaction="ignore")
    writer.writeheader()
    for post in posts:
        post_dict = _post_to_dict(post)
        raw_comments = (post.get("raw_data") or {}).get("comments") or []
        
        if not raw_comments:
            writer.writerow({
                **post_dict,
                "comment_id": "",
                "comment_author": "",
                "comment_text": "",
                "comment_likes": "",
                "comment_timestamp": "",
                "comment_parent": "",
            })
        else:
            for idx, c in enumerate(raw_comments):
                if idx == 0:
                    row_data = {
                        **post_dict,
                        "comment_id": c.get("id") or "",
                        "comment_author": c.get("author") or "",
                        "comment_text": (c.get("text") or "").replace("\n", " "),
                        "comment_likes": c.get("like_count") or 0,
                        "comment_timestamp": c.get("timestamp") or "",
                        "comment_parent": c.get("parent") or "root",
                    }
                else:
                    row_data = {
                        "id": post_dict["id"],
                        "platform": post_dict["platform"],
                        "post_id": post_dict["post_id"],
                        "username": post_dict["username"],
                        "content": "",
                        "likes": "",
                        "comments": "",
                        "scraped_comments_count": "",
                        "shares": "",
                        "views": "",
                        "posted_at": "",
                        "url": post_dict["url"],
                        "thumbnail_url": "",
                        "created_at": "",
                        "comment_id": c.get("id") or "",
                        "comment_author": c.get("author") or "",
                        "comment_text": (c.get("text") or "").replace("\n", " "),
                        "comment_likes": c.get("like_count") or 0,
                        "comment_timestamp": c.get("timestamp") or "",
                        "comment_parent": c.get("parent") or "root",
                    }
                writer.writerow(row_data)
                
    return output.getvalue()


def posts_to_json(posts: List[dict]) -> str:
    """Serialise a list of scraped_posts dicts to a pretty-printed JSON string."""
    data = [_post_to_dict(p) for p in posts]
    return json.dumps(data, indent=2, ensure_ascii=False)
