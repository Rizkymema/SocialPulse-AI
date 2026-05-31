from __future__ import annotations

import httpx
from supabase import Client, create_client

from app.config import settings

# ── Supabase client (singleton) ───────────────────────────────────────────────
# Uses HTTPS REST API – no direct PostgreSQL port (5432) required.
_supabase_client: Client | None = None


def _build_client() -> Client:
    """Create a Supabase client and force its PostgREST session to use HTTP/1.1.

    Supabase's PostgREST endpoint negotiates HTTP/2, but the server can silently
    drop idle HTTP/2 connections.  When that happens the singleton client raises
    ``httpx.RemoteProtocolError: Server disconnected`` for every subsequent
    request.  Replacing the session transport with HTTP/1.1-only avoids the
    issue because HTTP/1.1 reconnects transparently on a dropped connection.
    """
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)

    # Patch the PostgREST httpx session to disable HTTP/2.
    old_session: httpx.Client = client.postgrest.session
    client.postgrest.session = httpx.Client(
        base_url=str(old_session.base_url),
        headers=dict(old_session.headers),
        timeout=old_session.timeout,
        http2=False,          # ← force HTTP/1.1, avoids stale-connection crash
    )
    old_session.close()
    return client


def get_supabase() -> Client:
    """Return the shared Supabase client (lazy-init singleton)."""
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = _build_client()
    return _supabase_client
