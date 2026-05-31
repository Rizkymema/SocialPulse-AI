from __future__ import annotations

from functools import lru_cache
from typing import List, Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ──────────────────────────────────────────────────────────
    APP_NAME: str = "Social Media Intelligence API"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = "development"
    DEBUG: bool = False

    # ── Supabase (REST API via HTTPS – no direct PostgreSQL port needed) ─────────
    SUPABASE_URL: str = "https://likpsdlhnieltvlmuojp.supabase.co"
    SUPABASE_ANON_KEY: str = "sb_publishable_HeRRiZfXS-DZkWnlFG6bnQ_1WmNlOkZ"
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None

    @property
    def supabase_key(self) -> str:
        return self.SUPABASE_SERVICE_ROLE_KEY or self.SUPABASE_ANON_KEY

    # ── Optional API keys ─────────────────────────────────────────────────────
    YOUTUBE_API_KEY: Optional[str] = None
    META_APP_ID: Optional[str] = None
    META_APP_SECRET: Optional[str] = None
    META_ACCESS_TOKEN: Optional[str] = None

    # ── CORS ──────────────────────────────────────────────────────────────────
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings: Settings = get_settings()
