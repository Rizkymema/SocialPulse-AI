from __future__ import annotations

import asyncio
import hashlib
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import APIRouter, HTTPException, status

from app.core.detector import PlatformDetector
from app.core.normalizer import DataNormalizer
from app.database import get_supabase
from app.scrapers import ScraperError, get_scraper
from app.schemas.scrape import ScrapeRequest

router = APIRouter()
logger = logging.getLogger(__name__)

# In-memory duplicate cache (url_hash → post_id str)
_url_cache: dict[str, str] = {}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ── Background scrape task ────────────────────────────────────────────────────

async def _run_scrape(job_id: str, url: str, platform: str) -> None:
    """Run scraping in thread pool, persist to Supabase via REST API."""
    db = get_supabase()

    def _blocking_scrape():
        scraper = get_scraper(platform)
        return scraper.scrape(url)

    # Mark as processing
    db.table("scrape_jobs").update(
        {"status": "processing", "updated_at": _now_iso()}
    ).eq("id", job_id).execute()

    try:
        raw_data: Dict[str, Any] = await asyncio.get_event_loop().run_in_executor(
            None, _blocking_scrape
        )
        normalised = DataNormalizer.normalize(platform, raw_data, url)
        nd = normalised.model_dump(mode="json")

        # Upsert post (update if URL already exists)
        existing = (
            db.table("scraped_posts").select("id").eq("url", url).execute()
        )
        now = _now_iso()

        if existing.data:
            post_id = existing.data[0]["id"]
            db.table("scraped_posts").update(
                {**nd, "updated_at": now}
            ).eq("id", post_id).execute()
        else:
            post_id = str(uuid.uuid4())
            db.table("scraped_posts").insert(
                {"id": post_id, **nd, "created_at": now, "updated_at": now}
            ).execute()

        _url_cache[hashlib.sha256(url.encode()).hexdigest()] = post_id

        db.table("scrape_jobs").update(
            {
                "status": "completed",
                "scraped_post_id": post_id,
                "updated_at": _now_iso(),
            }
        ).eq("id", job_id).execute()

        logger.info("Scrape completed: job=%s post=%s", job_id, post_id)

    except Exception as exc:
        logger.error("Scrape failed: job=%s error=%s", job_id, exc)
        db.table("scrape_jobs").update(
            {
                "status": "failed",
                "error_message": str(exc)[:1024],
                "updated_at": _now_iso(),
            }
        ).eq("id", job_id).execute()


# ── POST /api/scrape ──────────────────────────────────────────────────────────

@router.post(
    "/scrape",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Submit a public social-media URL for scraping",
)
async def submit_scrape(payload: ScrapeRequest):
    url = payload.url

    if not PlatformDetector.is_supported(url):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Unsupported URL. Supported: YouTube, TikTok, Instagram, Facebook.",
        )

    platform = str(PlatformDetector.detect(url))
    url_hash = hashlib.sha256(url.encode()).hexdigest()
    db = get_supabase()

    # Check duplicate via cache
    cached_id = _url_cache.get(url_hash)
    if cached_id:
        jobs = (
            db.table("scrape_jobs")
            .select("*")
            .eq("scraped_post_id", cached_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if jobs.data:
            return _job_response(jobs.data[0])

    # Check existing post in DB
    existing = db.table("scraped_posts").select("id").eq("url", url).execute()
    if existing.data:
        post_id = existing.data[0]["id"]
        _url_cache[url_hash] = post_id
        jobs = (
            db.table("scrape_jobs")
            .select("*")
            .eq("scraped_post_id", post_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if jobs.data:
            return _job_response(jobs.data[0])

    # Create new job
    now = _now_iso()
    job_id = str(uuid.uuid4())
    db.table("scrape_jobs").insert(
        {
            "id": job_id,
            "url": url,
            "platform": platform,
            "status": "pending",
            "created_at": now,
            "updated_at": now,
        }
    ).execute()

    # Fire background scrape
    asyncio.create_task(_run_scrape(job_id, url, platform))

    return {
        "job_id": job_id,
        "url": url,
        "platform": platform,
        "status": "pending",
        "error_message": None,
        "scraped_post_id": None,
        "created_at": now,
        "updated_at": now,
    }


# ── GET /api/scrape/{job_id} ──────────────────────────────────────────────────

@router.get("/scrape/{job_id}", summary="Poll scrape job status / result")
async def get_scrape_job(job_id: str):
    db = get_supabase()
    result = db.table("scrape_jobs").select("*").eq("id", job_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Job not found")

    job = result.data[0]
    response = _job_response(job)

    if job.get("status") == "completed" and job.get("scraped_post_id"):
        post_res = (
            db.table("scraped_posts")
            .select("*")
            .eq("id", job["scraped_post_id"])
            .execute()
        )
        if post_res.data:
            response["result"] = post_res.data[0]

    return response


def _job_response(job: dict) -> dict:
    return {
        "job_id": job.get("id"),
        "url": job.get("url"),
        "platform": job.get("platform"),
        "status": job.get("status"),
        "error_message": job.get("error_message"),
        "scraped_post_id": job.get("scraped_post_id"),
        "created_at": job.get("created_at"),
        "updated_at": job.get("updated_at"),
    }
