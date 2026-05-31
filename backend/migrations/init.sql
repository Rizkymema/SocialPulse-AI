-- ─────────────────────────────────────────────────────────────────────────────
-- Social Media Intelligence – PostgreSQL initialisation
-- Runs automatically via docker-entrypoint-initdb.d on first container start
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- for fast ILIKE search

-- ─── scraped_posts ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scraped_posts (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    url             TEXT        NOT NULL UNIQUE,
    platform        VARCHAR(32) NOT NULL,

    -- Post identity
    post_id         VARCHAR(256),
    username        VARCHAR(256),

    -- Content
    content         TEXT,
    thumbnail_url   TEXT,

    -- Engagement metrics
    likes           BIGINT      NOT NULL DEFAULT 0,
    comments        BIGINT      NOT NULL DEFAULT 0,
    shares          BIGINT      NOT NULL DEFAULT 0,
    views           BIGINT      NOT NULL DEFAULT 0,

    -- Original publication time
    posted_at       TIMESTAMPTZ,

    -- Full raw payload
    raw_data        JSONB,

    -- Record timestamps
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_scraped_posts_platform       ON scraped_posts (platform);
CREATE INDEX IF NOT EXISTS ix_scraped_posts_username       ON scraped_posts (username);
CREATE INDEX IF NOT EXISTS ix_scraped_posts_platform_user  ON scraped_posts (platform, username);
CREATE INDEX IF NOT EXISTS ix_scraped_posts_created_at     ON scraped_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS ix_scraped_posts_content_trgm
    ON scraped_posts USING GIN (content gin_trgm_ops);

-- ─── scrape_jobs ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scrape_jobs (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    url             TEXT        NOT NULL,
    platform        VARCHAR(32),

    -- pending | processing | completed | failed
    status          VARCHAR(32) NOT NULL DEFAULT 'pending',
    error_message   TEXT,

    scraped_post_id UUID REFERENCES scraped_posts(id) ON DELETE SET NULL,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_scrape_jobs_status      ON scrape_jobs (status);
CREATE INDEX IF NOT EXISTS ix_scrape_jobs_created_at  ON scrape_jobs (created_at DESC);

-- ─── Auto-update updated_at via trigger ──────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_scraped_posts_updated_at'
    ) THEN
        CREATE TRIGGER trg_scraped_posts_updated_at
            BEFORE UPDATE ON scraped_posts
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_scrape_jobs_updated_at'
    ) THEN
        CREATE TRIGGER trg_scrape_jobs_updated_at
            BEFORE UPDATE ON scrape_jobs
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;
