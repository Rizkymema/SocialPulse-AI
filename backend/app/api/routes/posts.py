from __future__ import annotations

import inspect
import logging
from datetime import datetime, timezone
from typing import Any, List, Optional

from fastapi import APIRouter, HTTPException, Query, Response
from pydantic import BaseModel

from app.core.normalizer import DataNormalizer
from app.database import get_supabase
from app.scrapers import get_scraper
from app.utils.comments import (
    comments_from_row,
    hydrate_scraped_comments_count,
    is_missing_scraped_comments_count_error,
    merge_post_comment_state,
    strip_scraped_comments_count,
)

router = APIRouter()
logger = logging.getLogger(__name__)


def _load_post_comment_row(post_id: str) -> dict[str, Any] | None:
    db = get_supabase()
    try:
        result = (
            db.table("scraped_posts")
            .select("platform, raw_data, url, comments, scraped_comments_count")
            .eq("id", post_id)
            .execute()
        )
    except Exception as exc:
        if not is_missing_scraped_comments_count_error(exc):
            raise

        logger.warning(
            "scraped_comments_count column is unavailable while loading post %s; falling back to derived counts from raw_data.comments",
            post_id,
        )
        result = (
            db.table("scraped_posts")
            .select("platform, raw_data, url, comments")
            .eq("id", post_id)
            .execute()
        )

    if not result.data:
        return None

    return hydrate_scraped_comments_count(result.data[0])


def _update_post_snapshot(post_id: str, payload: dict[str, Any]) -> None:
    db = get_supabase()
    try:
        db.table("scraped_posts").update(payload).eq("id", post_id).execute()
    except Exception as exc:
        if not is_missing_scraped_comments_count_error(exc):
            raise

        logger.warning(
            "scraped_comments_count column is unavailable while updating post %s; writing fallback payload without that column",
            post_id,
        )
        db.table("scraped_posts").update(
            strip_scraped_comments_count(payload)
        ).eq("id", post_id).execute()


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


def _serialize_comments(row: dict[str, Any], parent: Optional[str] = None) -> list[CommentItem]:
    raw_comments = comments_from_row(row)

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
    if "comment_limit" in inspect.signature(scraper.scrape_with_retry).parameters:
        raw_data = scraper.scrape_with_retry(str(url), comment_limit=500)
    else:
        raw_data = scraper.scrape_with_retry(str(url))

    normalised = DataNormalizer.normalize(str(platform), raw_data, str(url)).model_dump(mode="json")
    normalised = merge_post_comment_state(row, normalised)
    updated_at = datetime.now(timezone.utc).isoformat()

    _update_post_snapshot(post_id, {**normalised, "updated_at": updated_at})

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
    response: Response,
    parent: Optional[str] = Query(None),
    refresh: bool = Query(False),
):
    row = _load_post_comment_row(post_id)

    if row is None:
        raise HTTPException(status_code=404, detail="Post not found")

    if refresh:
        try:
            refreshed_row = _refresh_post_snapshot(post_id, row)
            row = refreshed_row
        except Exception as exc:
            logger.warning("Comment refresh failed for post %s: %s", post_id, exc)

    comment_items = _serialize_comments(row, parent)
    scraped_comments_count = max(
        int(row.get("scraped_comments_count") or 0),
        len(comment_items),
    )
    platform_comments_count = max(
        int(row.get("comments") or 0),
        scraped_comments_count,
    )

    response.headers["X-Scraped-Comments-Count"] = str(scraped_comments_count)
    response.headers["X-Platform-Comments-Count"] = str(platform_comments_count)

    return CommentsResponse(
        post_id=post_id,
        platform=row.get("platform", ""),
        total=len(comment_items),
        comments=comment_items,
    )
