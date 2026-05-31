from __future__ import annotations

from fastapi import APIRouter, Query

from app.database import get_supabase

router = APIRouter()


@router.get("/analytics/summary", summary="Overall scraping statistics")
def get_analytics_summary():
    db = get_supabase()

    # Total posts
    posts_res = db.table("scraped_posts").select("*", count="exact").execute()
    total_posts = posts_res.count or 0
    posts = posts_res.data or []

    # Per-platform breakdown + engagement
    by_platform: dict = {}
    for p in posts:
        plat = p.get("platform", "unknown")
        if plat not in by_platform:
            by_platform[plat] = {
                "platform": plat,
                "count": 0,
                "likes": 0,
                "comments": 0,
                "shares": 0,
                "views": 0,
            }
        by_platform[plat]["count"] += 1
        by_platform[plat]["likes"] += p.get("likes") or 0
        by_platform[plat]["comments"] += p.get("comments") or 0
        by_platform[plat]["shares"] += p.get("shares") or 0
        by_platform[plat]["views"] += p.get("views") or 0

    total_likes = sum(p.get("likes") or 0 for p in posts)
    total_comments = sum(p.get("comments") or 0 for p in posts)
    total_shares = sum(p.get("shares") or 0 for p in posts)
    total_views = sum(p.get("views") or 0 for p in posts)

    # Job stats
    jobs_res = db.table("scrape_jobs").select("status").execute()
    jobs_by_status: dict = {}
    for j in (jobs_res.data or []):
        s = j.get("status", "unknown")
        jobs_by_status[s] = jobs_by_status.get(s, 0) + 1

    total_jobs = sum(jobs_by_status.values())
    success_rate = (
        round(jobs_by_status.get("completed", 0) / total_jobs * 100, 1)
        if total_jobs > 0
        else 0.0
    )

    return {
        "total_posts": total_posts,
        "by_platform": list(by_platform.values()),
        "engagement": {
            "total_likes": total_likes,
            "total_comments": total_comments,
            "total_shares": total_shares,
            "total_views": total_views,
        },
        "jobs": {
            "total": total_jobs,
            "by_status": jobs_by_status,
            "success_rate_pct": success_rate,
        },
    }


@router.get("/analytics/top-posts", summary="Top posts by engagement")
def get_top_posts(limit: int = Query(10, ge=1, le=50)):
    db = get_supabase()
    result = db.table("scraped_posts").select("*").execute()
    posts = result.data or []

    posts.sort(
        key=lambda p: (p.get("likes") or 0) + (p.get("comments") or 0) + (p.get("shares") or 0),
        reverse=True,
    )
    return posts[:limit]
