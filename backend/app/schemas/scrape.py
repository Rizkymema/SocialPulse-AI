from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, HttpUrl, field_validator


# ── Request ───────────────────────────────────────────────────────────────────

class ScrapeRequest(BaseModel):
    url: str

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        v = v.strip()
        if not v.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")
        return v


# ── Job status response ───────────────────────────────────────────────────────

class JobResponse(BaseModel):
    job_id: uuid.UUID
    url: str
    platform: Optional[str]
    status: str
    error_message: Optional[str] = None
    scraped_post_id: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Scraped post (full) ───────────────────────────────────────────────────────

class PostResponse(BaseModel):
    id: uuid.UUID
    url: str
    platform: str
    post_id: Optional[str] = None
    username: Optional[str] = None
    content: Optional[str] = None
    thumbnail_url: Optional[str] = None
    likes: int = 0
    comments: int = 0
    scraped_comments_count: int = 0
    shares: int = 0
    views: int = 0
    posted_at: Optional[datetime] = None
    raw_data: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Paginated list ────────────────────────────────────────────────────────────

class PostListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[PostResponse]


# ── Normalised data (internal, passed from scraper → DB) ─────────────────────

class NormalisedPost(BaseModel):
    url: str
    platform: str
    post_id: Optional[str] = None
    username: Optional[str] = None
    content: Optional[str] = None
    thumbnail_url: Optional[str] = None
    likes: int = 0
    comments: int = 0
    scraped_comments_count: int = 0
    shares: int = 0
    views: int = 0
    posted_at: Optional[datetime] = None
    raw_data: Optional[Dict[str, Any]] = None
