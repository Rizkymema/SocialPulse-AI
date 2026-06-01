from __future__ import annotations

import csv
import io
import json
from typing import Any, List

from app.utils.comments import comments_from_row

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
    "exported_comments_count",
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


def _comment_to_dict(comment: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": comment.get("id") or "",
        "author": comment.get("author") or "",
        "author_id": comment.get("author_id") or "",
        "text": comment.get("text") or "",
        "like_count": int(comment.get("like_count") or 0),
        "timestamp": comment.get("timestamp") or "",
        "parent": comment.get("parent") or "root",
        "is_favorited": bool(comment.get("is_favorited", False)),
        "author_is_uploader": bool(comment.get("author_is_uploader", False)),
    }


def _post_to_dict(post: dict, exported_comments_count: int) -> dict:
    platform_comments_count = max(int(post.get("comments") or 0), exported_comments_count)
    scraped_comments_count = max(
        int(post.get("scraped_comments_count") or 0),
        exported_comments_count,
    )

    return {
        "id": str(post.get("id", "")),
        "platform": post.get("platform", ""),
        "post_id": post.get("post_id") or "",
        "username": post.get("username") or "",
        "content": (post.get("content") or "").replace("\n", " "),
        "likes": post.get("likes") or 0,
        "comments": platform_comments_count,
        "scraped_comments_count": scraped_comments_count,
        "exported_comments_count": exported_comments_count,
        "shares": post.get("shares") or 0,
        "views": post.get("views") or 0,
        "posted_at": post.get("posted_at") or "",
        "url": post.get("url", ""),
        "thumbnail_url": post.get("thumbnail_url") or "",
        "created_at": post.get("created_at") or "",
    }


def _build_export_post(post: dict[str, Any]) -> dict[str, Any]:
    comment_rows = [_comment_to_dict(comment) for comment in comments_from_row(post)]
    post_dict = _post_to_dict(post, len(comment_rows))
    return {
        **post_dict,
        "comment_rows": comment_rows,
    }


def posts_to_csv(posts: List[dict]) -> str:
    """Serialise a list of scraped_posts dicts to a UTF-8 CSV string with comments."""
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=_FIELDS, extrasaction="ignore")
    writer.writeheader()
    for post in posts:
        export_post = _build_export_post(post)
        post_dict = {
            key: value for key, value in export_post.items() if key != "comment_rows"
        }
        raw_comments = export_post["comment_rows"]
        
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
                        "exported_comments_count": "",
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
    data = [_build_export_post(post) for post in posts]
    return json.dumps(data, indent=2, ensure_ascii=False)
