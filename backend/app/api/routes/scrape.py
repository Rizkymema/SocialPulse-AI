from __future__ import annotations

import asyncio
import logging
import os
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

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _is_write_access_error(exc: Exception) -> bool:
    message = str(exc).lower()
    return (
        "row-level security" in message
        or "401 unauthorized" in message
        or "42501" in message
    )


import json

def _trim_large_raw_data(raw: Dict[str, Any]) -> Dict[str, Any]:
    try:
        raw_str = json.dumps(raw)
    except Exception:
        return raw

    if len(raw_str) <= 5 * 1024 * 1024:
        return raw

    logger.warning("raw_data size exceeds 5MB (%d bytes), trimming non-essential fields...", len(raw_str))
    trimmed = dict(raw)
    discard_keys = ["formats", "thumbnails", "requested_formats", "automatic_captions", "subtitles", "http_headers"]
    for k in discard_keys:
        trimmed.pop(k, None)

    try:
        raw_str = json.dumps(trimmed)
    except Exception:
        return trimmed

    if len(raw_str) > 5 * 1024 * 1024:
        for k, v in list(trimmed.items()):
            if k in ("comments", "id", "url", "webpage_url", "shortcode"):
                continue
            if isinstance(v, str) and len(v) > 5000:
                trimmed[k] = v[:5000] + "... [trimmed due to size]"
    return trimmed


async def _scrape_and_normalize(url: str, platform: str) -> Dict[str, Any]:
    def _blocking_scrape() -> Dict[str, Any]:
        scraper = get_scraper(platform)
        import inspect
        if "comment_limit" in inspect.signature(scraper.scrape_with_retry).parameters:
            return scraper.scrape_with_retry(url, comment_limit=500)
        return scraper.scrape_with_retry(url)

    raw_data = await asyncio.get_event_loop().run_in_executor(None, _blocking_scrape)
    trimmed_raw_data = _trim_large_raw_data(raw_data)
    normalised = DataNormalizer.normalize(platform, trimmed_raw_data, url)
    return normalised.model_dump(mode="json")


def _inline_result(post_id: str, normalised: Dict[str, Any]) -> Dict[str, Any]:
    now = _now_iso()
    return {
        "id": post_id,
        **normalised,
        "created_at": now,
        "updated_at": now,
    }


def _job_response(job: dict, result: dict | None = None) -> dict:
    response = {
        "job_id": job.get("id"),
        "url": job.get("url"),
        "platform": job.get("platform"),
        "status": job.get("status"),
        "error_message": job.get("error_message"),
        "scraped_post_id": job.get("scraped_post_id"),
        "created_at": job.get("created_at"),
        "updated_at": job.get("updated_at"),
    }
    if result is not None:
        response["result"] = result
    return response


def _load_post_result(db: Any, post_id: str | None) -> dict | None:
    if not post_id or str(post_id).startswith("ephemeral-"):
        return None

    post_res = db.table("scraped_posts").select("*").eq("id", post_id).execute()
    if post_res.data:
        return post_res.data[0]
    return None


def _load_active_job_for_url(db: Any, url: str) -> dict | None:
    jobs = (
        db.table("scrape_jobs")
        .select("*")
        .eq("url", url)
        .in_("status", ["pending", "processing"])
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if jobs.data:
        return jobs.data[0]
    return None


async def _inline_scrape_response(url: str, platform: str) -> dict:
    job_id = str(uuid.uuid4())
    now = _now_iso()

    try:
        normalised = await _scrape_and_normalize(url, platform)
        post_id = f"ephemeral-{uuid.uuid4()}"
        result = _inline_result(post_id, normalised)
        return _job_response(
            {
                "id": job_id,
                "url": url,
                "platform": platform,
                "status": "completed",
                "error_message": None,
                "scraped_post_id": post_id,
                "created_at": now,
                "updated_at": now,
            },
            result,
        )
    except Exception as exc:
        logger.error("Inline scrape fallback failed: url=%s error=%s", url, exc)
        return _job_response(
            {
                "id": job_id,
                "url": url,
                "platform": platform,
                "status": "failed",
                "error_message": str(exc)[:1024],
                "scraped_post_id": None,
                "created_at": now,
                "updated_at": _now_iso(),
            }
        )


# ── Background scrape task ────────────────────────────────────────────────────

async def _run_scrape(job_id: str, url: str, platform: str) -> None:
    """Run scraping in thread pool, persist to Supabase via REST API."""
    db = get_supabase()

    # Mark as processing
    db.table("scrape_jobs").update(
        {"status": "processing", "updated_at": _now_iso()}
    ).eq("id", job_id).execute()

    try:
        nd = await _scrape_and_normalize(url, platform)

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
    db = get_supabase()

    # Reuse only active in-flight jobs; completed jobs should be refreshed so the data stays real-time.
    active_job = _load_active_job_for_url(db, url)
    if active_job:
        return _job_response(
            active_job,
            _load_post_result(db, active_job.get("scraped_post_id")),
        )

    # Create new job
    now = _now_iso()
    job_id = str(uuid.uuid4())
    try:
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
    except Exception as exc:
        if _is_write_access_error(exc):
            logger.warning(
                "Falling back to inline scrape because scrape_jobs write is blocked: %s",
                exc,
            )
            return await _inline_scrape_response(url, platform)
        raise

    # Vercel Functions do not guarantee background work after the response ends.
    if os.getenv("VERCEL"):
        await _run_scrape(job_id, url, platform)

        latest = db.table("scrape_jobs").select("*").eq("id", job_id).execute()
        if latest.data:
            job = latest.data[0]
            return _job_response(job, _load_post_result(db, job.get("scraped_post_id")))
    else:
        asyncio.create_task(_run_scrape(job_id, url, platform))

    return _job_response(
        {
            "id": job_id,
            "url": url,
            "platform": platform,
            "status": "pending",
            "error_message": None,
            "scraped_post_id": None,
            "created_at": now,
            "updated_at": now,
        }
    )


# ── GET /api/scrape/{job_id} ──────────────────────────────────────────────────

@router.get("/scrape/{job_id}", summary="Poll scrape job status / result")
async def get_scrape_job(job_id: str):
    db = get_supabase()
    result = db.table("scrape_jobs").select("*").eq("id", job_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Job not found")

    job = result.data[0]
    return _job_response(job, _load_post_result(db, job.get("scraped_post_id")))
