from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, Index, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ScrapedPost(Base):
    """Normalised social-media post extracted from a public URL."""

    __tablename__ = "scraped_posts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    url: Mapped[str] = mapped_column(Text, unique=True, nullable=False, index=True)
    platform: Mapped[str] = mapped_column(String(32), nullable=False, index=True)

    # Post identity
    post_id: Mapped[str | None] = mapped_column(String(256))
    username: Mapped[str | None] = mapped_column(String(256), index=True)

    # Content
    content: Mapped[str | None] = mapped_column(Text)
    thumbnail_url: Mapped[str | None] = mapped_column(Text)

    # Engagement metrics
    likes: Mapped[int] = mapped_column(BigInteger, default=0)
    comments: Mapped[int] = mapped_column(BigInteger, default=0)
    shares: Mapped[int] = mapped_column(BigInteger, default=0)
    views: Mapped[int] = mapped_column(BigInteger, default=0)

    # Original post time
    posted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Raw payload for debugging / future enrichment
    raw_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Record timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    __table_args__ = (
        Index("ix_scraped_posts_platform_username", "platform", "username"),
        Index("ix_scraped_posts_created_at", "created_at"),
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<ScrapedPost id={self.id} platform={self.platform} url={self.url!r}>"
