/**
 * Backend API client – semua panggilan ke FastAPI backend (port 8000)
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface ScrapeJob {
  job_id: string;
  url: string;
  platform: string;
  status: "pending" | "processing" | "completed" | "failed";
  error_message?: string;
  scraped_post_id?: string;
  created_at: string;
  updated_at: string;
  result?: ScrapedPost;
}

export interface Comment {
  id?: string;
  text: string;
  author?: string;
  author_id?: string;
  timestamp?: number;
  like_count: number;
  is_favorited: boolean;
  author_is_uploader: boolean;
  parent: string; // "root" = top-level, else reply to that comment id
}

export interface ScrapedPostRawData {
  comments?: Array<Partial<Comment> & Record<string, unknown>>;
  [key: string]: unknown;
}

export interface ScrapedPost {
  id: string;
  url: string;
  platform: string;
  post_id?: string;
  username?: string;
  content?: string;
  thumbnail_url?: string;
  likes: number;
  comments: number;
  scraped_comments_count?: number;
  shares: number;
  views: number;
  posted_at?: string;
  raw_data?: ScrapedPostRawData;
  created_at: string;
  updated_at: string;
}

export interface PostsResponse {
  items: ScrapedPost[];
  total: number;
  page: number;
  size: number;
}

export interface AnalyticsSummary {
  total_posts: number;
  platforms: Record<string, {
    posts: number;
    likes: number;
    comments: number;
    shares: number;
    views: number;
  }>;
  engagement?: {
    total_likes: number;
    total_comments: number;
    total_shares: number;
    total_views: number;
  };
  jobs?: {
    total: number;
    by_status: Record<string, number>;
    success_rate_pct: number;
  };
}

export type TopPost = ScrapedPost;

interface AnalyticsSummaryApiResponse {
  total_posts?: number;
  platforms?: Record<string, {
    posts?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    views?: number;
  }>;
  by_platform?: Array<{
    platform?: string;
    count?: number;
    posts?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    views?: number;
  }>;
  engagement?: AnalyticsSummary["engagement"];
  jobs?: AnalyticsSummary["jobs"];
}

export interface CommentsResponse {
  post_id: string;
  platform: string;
  total: number;
  comments: Comment[];
}

export interface GetPostCommentsOptions {
  parent?: string;
  refresh?: boolean;
}

// ── Scrape ────────────────────────────────────────────────────────────────────
export async function submitScrapeJob(url: string): Promise<ScrapeJob> {
  const res = await fetch(`${BASE_URL}/api/scrape`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail ?? `Scrape failed: ${res.status}`);
  }
  return res.json();
}

export async function getScrapeJob(jobId: string): Promise<ScrapeJob> {
  const res = await fetch(`${BASE_URL}/api/scrape/${jobId}`);
  if (!res.ok) throw new Error(`Job not found: ${res.status}`);
  return res.json();
}

/** Poll job hingga completed/failed, timeout 60 detik */
export async function pollScrapeJob(
  jobId: string,
  onProgress?: (status: string) => void,
  maxWaitMs = 60000
): Promise<ScrapeJob> {
  const interval = 2500;
  const deadline = Date.now() + maxWaitMs;

  while (Date.now() < deadline) {
    const job = await getScrapeJob(jobId);
    onProgress?.(job.status);
    if (job.status === "completed" || job.status === "failed") return job;
    await new Promise((r) => setTimeout(r, interval));
  }
  throw new Error("Scrape job timed out after 60s");
}

// ── Posts ─────────────────────────────────────────────────────────────────────
export async function getPosts(params?: {
  platform?: string;
  page?: number;
  size?: number;
}): Promise<PostsResponse> {
  const q = new URLSearchParams();
  if (params?.platform) q.set("platform", params.platform);
  if (params?.page) q.set("page", String(params.page));
  if (params?.size) q.set("size", String(params.size));
  const res = await fetch(`${BASE_URL}/api/posts?${q}`);
  if (!res.ok) throw new Error(`Failed to load posts: ${res.status}`);
  return res.json();
}

export async function deletePost(postId: string): Promise<{ success: boolean; post_id: string }> {
  const res = await fetch(`${BASE_URL}/api/posts/${postId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail ?? `Failed to delete post: ${res.status}`);
  }

  return res.json();
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const res = await fetch(`${BASE_URL}/api/analytics/summary`);
  if (!res.ok) throw new Error(`Analytics failed: ${res.status}`);
  const raw = (await res.json()) as AnalyticsSummaryApiResponse;

  const platforms = raw.platforms
    ? Object.fromEntries(
        Object.entries(raw.platforms).map(([name, value]) => [
          name,
          {
            posts: Number(value?.posts ?? 0),
            likes: Number(value?.likes ?? 0),
            comments: Number(value?.comments ?? 0),
            shares: Number(value?.shares ?? 0),
            views: Number(value?.views ?? 0),
          },
        ])
      )
    : Object.fromEntries(
        (raw.by_platform ?? []).map((item) => [
          item.platform ?? "unknown",
          {
            posts: Number(item.posts ?? item.count ?? 0),
            likes: Number(item.likes ?? 0),
            comments: Number(item.comments ?? 0),
            shares: Number(item.shares ?? 0),
            views: Number(item.views ?? 0),
          },
        ])
      );

  return {
    total_posts: Number(raw.total_posts ?? 0),
    platforms,
    engagement: raw.engagement,
    jobs: raw.jobs,
  };
}

export async function getTopPosts(limit = 10): Promise<TopPost[]> {
  const res = await fetch(`${BASE_URL}/api/analytics/top-posts?limit=${limit}`);
  if (!res.ok) throw new Error(`Top posts failed: ${res.status}`);
  return res.json();
}

// ── Comments ──────────────────────────────────────────────────────────────────
export async function getPostComments(
  postId: string,
  options?: GetPostCommentsOptions
): Promise<CommentsResponse> {
  const query = new URLSearchParams();
  if (options?.parent) query.set("parent", options.parent);
  if (options?.refresh) query.set("refresh", "true");
  const q = query.toString();
  const url = `${BASE_URL}/api/posts/${postId}/comments${q ? `?${q}` : ""}`;

  const attempts = 3;
  let lastError: unknown = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`Failed to load comments: ${res.status}`);
      return await res.json();
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, 2000 * (i + 1))); // backoff delay
      }
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to load comments after retries");
}
