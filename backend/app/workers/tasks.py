from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict

from celery import shared_task
from celery.exceptions import MaxRetriesExceededError

from app.workers.celery_app import celery_app
from app.core.detector import PlatformDetector
from app.core.normalizer import DataNormalizer
from app.scrapers import ScraperError, get_scraper
from app.database import get_sync_session

logger = logging.getLogger(__name__)


# ── Helper: import models lazily to avoid circular imports ────────────────────
def _get_models():
    from app.models.job import ScrapeJob
    from app.models.post import ScrapedPost

    return ScrapeJob, ScrapedPost


# ── Main scraping task ────────────────────────────────────────────────────────

@celery_app.task(
    bind=True,
    name="app.workers.tasks.scrape_url_task",
    queue="scrape_queue",
    max_retries=3,
    default_retry_delay=5,
    acks_late=True,
)
def scrape_url_task(self, job_id: str, url: str) -> Dict[str, Any]:
    """
    Async Celery task that scrapes a single public social-media URL.

    Lifecycle:
    pending → processing → completed | failed
    """
    ScrapeJob, ScrapedPost = _get_models()
    db = get_sync_session()

    try:
        # ── Mark job as processing ────────────────────────────────────────
        job = db.query(ScrapeJob).filter(ScrapeJob.id == uuid.UUID(job_id)).first()
        if job is None:
            logger.error("Job %s not found in DB", job_id)
            return {"status": "error", "message": "Job not found"}

        job.status = "processing"
        db.commit()

        # ── Detect platform ───────────────────────────────────────────────
        platform = PlatformDetector.detect(url)
        job.platform = str(platform)
        db.commit()

        logger.info("[%s] Detected platform: %s – url: %s", job_id, platform, url)

        # ── Scrape ────────────────────────────────────────────────────────
        scraper = get_scraper(str(platform))
        import inspect
        if "comment_limit" in inspect.signature(scraper.scrape).parameters:
            raw_data = scraper.scrape(url, comment_limit=500)
        else:
            raw_data = scraper.scrape(url)

        # ── Normalise ─────────────────────────────────────────────────────
        normalised = DataNormalizer.normalize(str(platform), raw_data, url)

        # ── Upsert into scraped_posts ─────────────────────────────────────
        existing = (
            db.query(ScrapedPost).filter(ScrapedPost.url == url).first()
        )
        if existing:
            # Update stale record
            for field, value in normalised.model_dump(exclude_none=False).items():
                setattr(existing, field, value)
            db.commit()
            db.refresh(existing)
            post = existing
            logger.info("[%s] Updated existing post %s", job_id, post.id)
        else:
            post = ScrapedPost(**normalised.model_dump())
            db.add(post)
            db.commit()
            db.refresh(post)
            logger.info("[%s] Created new post %s", job_id, post.id)

        # ── Mark job completed ────────────────────────────────────────────
        job.status = "completed"
        job.scraped_post_id = post.id
        db.commit()

        return {"status": "completed", "post_id": str(post.id)}

    except ScraperError as exc:
        logger.error("[%s] Scraper error: %s", job_id, exc)
        _handle_retry_or_fail(self, db, job_id, exc, ScrapeJob)
        raise

    except Exception as exc:
        logger.exception("[%s] Unexpected error: %s", job_id, exc)
        _handle_retry_or_fail(self, db, job_id, exc, ScrapeJob)
        raise

    finally:
        db.close()


def _handle_retry_or_fail(task, db, job_id: str, exc: Exception, ScrapeJob) -> None:
    """Retry the task with exponential backoff; mark as failed after max retries."""
    try:
        countdown = 2 ** task.request.retries  # 1s, 2s, 4s
        raise task.retry(exc=exc, countdown=countdown)
    except MaxRetriesExceededError:
        try:
            job = db.query(ScrapeJob).filter(ScrapeJob.id == uuid.UUID(job_id)).first()
            if job:
                job.status = "failed"
                job.error_message = str(exc)[:1024]
                db.commit()
        except Exception:
            logger.exception("Failed to mark job %s as failed", job_id)


# ── Beat task: retry stale pending jobs ──────────────────────────────────────

@celery_app.task(name="app.workers.tasks.retry_stale_jobs")
def retry_stale_jobs() -> Dict[str, Any]:
    """
    Periodic task: re-queue any jobs stuck in 'pending' or 'processing'
    for more than 10 minutes (worker crash / restart scenarios).
    """
    ScrapeJob, _ = _get_models()
    db = get_sync_session()
    cutoff = datetime.now(tz=timezone.utc) - timedelta(minutes=10)

    try:
        stale = (
            db.query(ScrapeJob)
            .filter(
                ScrapeJob.status.in_(["pending", "processing"]),
                ScrapeJob.updated_at < cutoff,
            )
            .all()
        )

        requeued = 0
        for job in stale:
            logger.info("Re-queuing stale job %s (status=%s)", job.id, job.status)
            job.status = "pending"
            db.commit()
            scrape_url_task.apply_async(
                args=[str(job.id), job.url],
                queue="scrape_queue",
            )
            requeued += 1

        return {"requeued": requeued}

    finally:
        db.close()
