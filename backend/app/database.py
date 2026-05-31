from __future__ import annotations

from supabase import Client, create_client

from app.config import settings

# ── Supabase client (singleton) ───────────────────────────────────────────────
# Uses HTTPS REST API – no direct PostgreSQL port (5432) required.
_supabase_client: Client | None = None


def get_supabase() -> Client:
    """Return the shared Supabase client (lazy-init singleton)."""
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_ANON_KEY,
        )
    return _supabase_client
