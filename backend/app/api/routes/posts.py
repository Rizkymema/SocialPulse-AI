from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.database import get_supabase

router = APIRouter()


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
):
    db = get_supabase()
    result = db.table("scraped_posts").select("platform, raw_data").eq("id", post_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Post not found")

    row = result.data[0]
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

    return CommentsResponse(
        post_id=post_id,
        platform=row.get("platform", ""),
        total=len(comment_items),
        comments=comment_items,
    )
