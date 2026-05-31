from __future__ import annotations

from celery import Celery
from app.config import settings

celery_app = Celery(
    "smi_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.workers.tasks"],
)

celery_app.conf.update(
    # Serialisation
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    # Timezone
    timezone="UTC",
    enable_utc=True,
    # Reliability
    task_track_started=True,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1,
    # Result TTL – keep results for 24 hours
    result_expires=86400,
    # Routing: all scraping tasks go to the dedicated queue
    task_routes={"app.workers.tasks.scrape_url_task": {"queue": "scrape_queue"}},
    # Beat schedule – auto-retry stale pending jobs every 5 minutes
    beat_schedule={
        "retry-stale-jobs": {
            "task": "app.workers.tasks.retry_stale_jobs",
            "schedule": 300.0,  # seconds
        }
    },
)

__all__ = ["celery_app"]
