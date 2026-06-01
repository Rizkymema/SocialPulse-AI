ALTER TABLE scraped_posts
    ADD COLUMN IF NOT EXISTS scraped_comments_count BIGINT NOT NULL DEFAULT 0;

UPDATE scraped_posts
SET scraped_comments_count = jsonb_array_length(
    COALESCE(raw_data->'comments', '[]'::jsonb)
)
WHERE COALESCE(scraped_comments_count, 0) <> jsonb_array_length(
    COALESCE(raw_data->'comments', '[]'::jsonb)
);

UPDATE scraped_posts
SET comments = GREATEST(comments, scraped_comments_count)
WHERE comments < scraped_comments_count;

-- Disable RLS on scraped_posts and scrape_jobs to allow public read/write via the anon key in local/Vercel environments.
ALTER TABLE scraped_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_jobs DISABLE ROW LEVEL SECURITY;