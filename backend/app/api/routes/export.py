from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse

from app.database import get_supabase
from app.utils.export import posts_to_csv, posts_to_json

router = APIRouter()


@router.get(
    "/export/csv",
    summary="Export scraped posts as CSV",
    response_class=StreamingResponse,
)
async def export_csv(platform: Optional[str] = Query(None)):
    db = get_supabase()
    query = db.table("scraped_posts").select("*")
    if platform:
        query = query.eq("platform", platform.lower())
    result = query.order("created_at", desc=True).execute()
    posts = result.data or []

    csv_data = posts_to_csv(posts)
    return StreamingResponse(
        iter([csv_data]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=scraped_posts.csv"},
    )


@router.get(
    "/export/json",
    summary="Export scraped posts as JSON",
    response_class=StreamingResponse,
)
async def export_json(platform: Optional[str] = Query(None)):
    db = get_supabase()
    query = db.table("scraped_posts").select("*")
    if platform:
        query = query.eq("platform", platform.lower())
    result = query.order("created_at", desc=True).execute()
    posts = result.data or []

    json_data = posts_to_json(posts)
    return StreamingResponse(
        iter([json_data]),
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=scraped_posts.json"},
    )
