from __future__ import annotations

import inspect
import logging
from datetime import datetime, timezone
from typing import Any, List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.core.normalizer import DataNormalizer
from app.database import get_supabase
from app.scrapers import get_scraper

router = APIRouter()
logger = logging.getLogger(__name__)


class CommentItem(BaseModel):
    id: Optional[str] = None
    text: str
    author: Optional[str] = None
    author_id: Optional[str] = None
    timestamp: Optional[int] = None
    like_count: int = 0
    is_favorited: bool = False
    author_is_uploader: bool = False
    parent: str = "root"


class CommentsResponse(BaseModel):
    post_id: str
    platform: str
    total: int
    comments: List[CommentItem]


def _normalize_comment_text(value: Any) -> str:
    return " ".join(str(value or "").split()).strip()


def _comment_identity(comment: dict[str, Any]) -> tuple[str, str, str, str, str]:
    return (
        str(comment.get("id") or ""),
        str(comment.get("parent") or "root"),
        str(comment.get("author_id") or comment.get("author") or ""),
        str(comment.get("timestamp") or ""),
        _normalize_comment_text(comment.get("text")).casefold(),
    )


def _merge_raw_comments(*comment_groups: list[Any]) -> list[dict[str, Any]]:
    merged: list[dict[str, Any]] = []
    seen: set[tuple[str, str, str, str, str]] = set()

    for group in comment_groups:
        for raw_comment in group or []:
            if not isinstance(raw_comment, dict):
                continue

            text = _normalize_comment_text(raw_comment.get("text"))
            if not text:
                continue

            comment = {
                **raw_comment,
                "text": text,
                "parent": raw_comment.get("parent") or "root",
                "like_count": int(raw_comment.get("like_count") or 0),
            }
            identity = _comment_identity(comment)
            if identity in seen:
                continue

            seen.add(identity)
            merged.append(comment)

    merged.sort(
        key=lambda comment: (
            0 if (comment.get("parent") or "root") == "root" else 1,
            str(comment.get("parent") or "root"),
            int(comment.get("timestamp") or 0),
            _comment_identity(comment),
        )
    )
    return merged


def _serialize_comments(row: dict[str, Any], parent: Optional[str] = None) -> list[CommentItem]:
    raw_comments: list = (row.get("raw_data") or {}).get("comments") or []

    comment_items = [
        CommentItem(
            id=c.get("id"),
            text=c.get("text", ""),
            author=c.get("author"),
            author_id=c.get("author_id"),
            timestamp=c.get("timestamp"),
            like_count=int(c.get("like_count") or 0),
            is_favorited=bool(c.get("is_favorited", False)),
            author_is_uploader=bool(c.get("author_is_uploader", False)),
            parent=c.get("parent") or "root",
        )
        for c in raw_comments
        if c.get("text")
    ]

    if parent is not None:
        comment_items = [c for c in comment_items if c.parent == parent]

    return comment_items


def _refresh_post_snapshot(post_id: str, row: dict[str, Any]) -> dict[str, Any]:
    url = row.get("url")
    platform = row.get("platform")
    if not url or not platform:
        return row

    scraper = get_scraper(str(platform))
    if "comment_limit" in inspect.signature(scraper.scrape).parameters:
        raw_data = scraper.scrape(str(url), comment_limit=500)
    else:
        raw_data = scraper.scrape(str(url))

    normalised = DataNormalizer.normalize(str(platform), raw_data, str(url)).model_dump(mode="json")
    existing_raw_data = row.get("raw_data") or {}
    latest_raw_data = normalised.get("raw_data") or {}
    merged_comments = _merge_raw_comments(
        latest_raw_data.get("comments") or [],
        existing_raw_data.get("comments") or [],
    )
    normalised["raw_data"] = {
        **existing_raw_data,
        **latest_raw_data,
        "comments": merged_comments,
    }
    normalised["comments"] = max(
        int(row.get("comments") or 0),
        int(normalised.get("comments") or 0),
        len(merged_comments),
    )
    updated_at = datetime.now(timezone.utc).isoformat()

    db = get_supabase()
    db.table("scraped_posts").update(
        {**normalised, "updated_at": updated_at}
    ).eq("id", post_id).execute()

    return {
        **row,
        **normalised,
        "updated_at": updated_at,
    }


@router.get("/posts", summary="List all scraped posts")
def list_posts(
    platform: Optional[str] = Query(None),
    username: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    size: int = Query(None, ge=1, le=200),  # alias used by frontend apiClient
):
    db = get_supabase()
    limit = size if size is not None else page_size
    offset = (page - 1) * limit

    query = db.table("scraped_posts").select("*", count="exact")

    if platform:
        query = query.eq("platform", platform.lower())
    if username:
        query = query.ilike("username", f"%{username}%")

    result = (
        query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
    )

    return {
        "total": result.count or 0,
        "page": page,
        "page_size": limit,
        "size": limit,
        "items": result.data or [],
    }


@router.get("/posts/{post_id}", summary="Get a single scraped post by ID")
def get_post(post_id: str):
    db = get_supabase()
    result = db.table("scraped_posts").select("*").eq("id", post_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Post not found")

    return result.data[0]


@router.delete("/posts/{post_id}", summary="Delete a scraped post by ID")
def delete_post(post_id: str):
    db = get_supabase()
    existing = db.table("scraped_posts").select("id").eq("id", post_id).execute()

    if not existing.data:
        raise HTTPException(status_code=404, detail="Post not found")

    db.table("scraped_posts").delete().eq("id", post_id).execute()
    return {"success": True, "post_id": post_id}


@router.get(
    "/posts/{post_id}/comments",
    response_model=CommentsResponse,
    summary="Get all scraped comments for a post",
)
def get_post_comments(
    post_id: str,
    parent: Optional[str] = Query(None),
    refresh: bool = Query(False),
):
    db = get_supabase()
    result = (
        db.table("scraped_posts")
        .select("platform, raw_data, url, comments")
        .eq("id", post_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Post not found")

    row = result.data[0]
    if refresh:
        try:
            refreshed_row = _refresh_post_snapshot(post_id, row)
            row = refreshed_row
        except Exception as exc:
            logger.warning("Comment refresh failed for post %s: %s", post_id, exc)

    comment_items = _serialize_comments(row, parent)

    return CommentsResponse(
        post_id=post_id,
        platform=row.get("platform", ""),
        total=len(comment_items),
        comments=comment_items,
    )
