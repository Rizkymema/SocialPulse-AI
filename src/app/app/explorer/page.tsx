"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  TableProperties,
  Search,
  Download,
  FileDown,
  Files,
  Trash2,
  Plus,
  Link2,
  Loader2,
  CheckCircle2,
  XCircle,
  MessageSquare,
  ThumbsUp,
  Crown,
  CornerDownRight,
} from "lucide-react";
import {
  submitScrapeJob,
  pollScrapeJob,
  getPosts,
  getPostComments,
  type ScrapedPost as ApiPost,
  type Comment,
} from "@/lib/apiClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useSaaSStore } from "@/store/useSaaSStore";
import { exportToCSV, exportToExcel, exportToPDF } from "@/lib/exportEngine";

export default function DataExplorerPage() {
  const { workspaces, activeWorkspaceId, posts, deletePost, addNotification } =
    useSaaSStore();

  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");

  // Scrape URL dialog state
  const [isScrapeOpen, setIsScrapeOpen] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scrapeStatus, setScrapeStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [scrapeMessage, setScrapeMessage] = useState("");
  const [apiPosts, setApiPosts] = useState<ApiPost[]>([]);
  const [apiLoading, setApiLoading] = useState(true);

  // Comments dialog state
  const [commentsPost, setCommentsPost] = useState<{
    id: string;
    username: string;
    platform: string;
  } | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState("");

  const activeWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  // Load posts from backend on mount
  useEffect(() => {
    getPosts({ size: 100 })
      .then((res) => setApiPosts(res.items))
      .catch(() => setApiPosts([]))
      .finally(() => setApiLoading(false));
  }, []);

  const reloadApiPosts = useCallback(() => {
    getPosts({ size: 100 })
      .then((res) => setApiPosts(res.items))
      .catch(() => {});
  }, []);

  const handleScrapeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scrapeUrl.trim()) return;
    setScrapeStatus("loading");
    setScrapeMessage("Mengirim URL ke backend...");
    try {
      const job = await submitScrapeJob(scrapeUrl.trim());
      setScrapeMessage(`Job dibuat (${job.platform}). Scraping...`);
      const result = await pollScrapeJob(job.job_id, (s) => {
        setScrapeMessage(`Status: ${s}...`);
      });
      if (result.status === "completed" && result.result) {
        setScrapeStatus("success");
        setScrapeMessage(
          `Berhasil! @${result.result.username ?? "unknown"} - ${result.result.platform}`
        );
        addNotification(
          `Scraped: ${result.result.username ?? scrapeUrl} (${result.result.platform})`
        );
        reloadApiPosts();
      } else {
        setScrapeStatus("error");
        setScrapeMessage(result.error_message ?? "Scraping gagal.");
      }
    } catch (err: unknown) {
      setScrapeStatus("error");
      setScrapeMessage(
        err instanceof Error ? err.message : "Terjadi kesalahan."
      );
    }
  };

  const handleCloseScrape = () => {
    setIsScrapeOpen(false);
    setScrapeUrl("");
    setScrapeStatus("idle");
    setScrapeMessage("");
  };

  const handleViewComments = async (post: {
    id: string;
    username: string;
    platform: string;
  }) => {
    setCommentsPost(post);
    setComments([]);
    setCommentsError("");
    setCommentsLoading(true);
    try {
      const res = await getPostComments(post.id);
      setComments(res.comments);
    } catch {
      setCommentsError(
        "Gagal memuat komentar. Mungkin belum di-scrape atau tidak tersedia."
      );
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleCloseComments = () => {
    setCommentsPost(null);
    setComments([]);
    setCommentsError("");
  };

  // Combine API posts + local store posts for display
  const combinedPosts = [
    ...apiPosts.map((p) => ({
      id: p.id,
      username: p.username ?? "unknown",
      platform: p.platform as "instagram" | "facebook" | "tiktok" | "youtube",
      content: p.content ?? "",
      likes: p.likes,
      comments: p.comments,
      shares: p.shares,
      views: p.views ?? 0,
      timestamp: p.posted_at ?? p.created_at,
      sentiment: "neutral" as const,
      _source: "api" as const,
    })),
    ...posts
      .filter((p) => p.workspace_id === activeWorkspaceId)
      .filter((lp) => !apiPosts.find((ap) => ap.id === lp.id))
      .map((p) => ({ ...p, views: 0, _source: "local" as const })),
  ];

  const filteredPosts = combinedPosts.filter((post) => {
    const matchesSearch =
      post.username.toLowerCase().includes(search.toLowerCase()) ||
      post.content.toLowerCase().includes(search.toLowerCase());
    const matchesPlatform =
      platformFilter === "all" || post.platform === platformFilter;
    const matchesSentiment =
      sentimentFilter === "all" || post.sentiment === sentimentFilter;
    return matchesSearch && matchesPlatform && matchesSentiment;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === "date-desc")
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    if (sortBy === "date-asc")
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    if (sortBy === "engagement-desc")
      return b.likes + b.comments + b.shares - (a.likes + a.comments + a.shares);
    if (sortBy === "likes-desc") return b.likes - a.likes;
    return 0;
  });

  const handleExportCSV = () => {
    if (sortedPosts.length === 0) {
      alert("No data to export.");
      return;
    }
    exportToCSV(
      sortedPosts as Parameters<typeof exportToCSV>[0],
      "socialpulse_explorer.csv"
    );
    addNotification(`Exported ${sortedPosts.length} posts to CSV.`);
  };
  const handleExportExcel = () => {
    if (sortedPosts.length === 0) {
      alert("No data to export.");
      return;
    }
    exportToExcel(
      sortedPosts as Parameters<typeof exportToExcel>[0],
      activeWorkspace.name,
      "socialpulse_explorer.xlsx"
    );
    addNotification(`Exported ${sortedPosts.length} posts to Excel.`);
  };
  const handleExportPDF = () => {
    if (sortedPosts.length === 0) {
      alert("No data to export.");
      return;
    }
    exportToPDF(
      sortedPosts as Parameters<typeof exportToPDF>[0],
      activeWorkspace.name,
      `Export of ${sortedPosts.length} records.`,
      "socialpulse_report.pdf"
    );
    addNotification("Compiled PDF Report.");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Data Explorer
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Scrape social media URLs, filter, and export collected data.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            onClick={() => setIsScrapeOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 shrink-0 text-xs font-semibold"
          >
            <Link2 className="h-4 w-4 mr-1" /> Scrape URL
          </Button>

          <div className="relative group shrink-0">
            <Button
              variant="outline"
              className="border-zinc-800 hover:bg-zinc-900 text-xs font-semibold flex items-center gap-1.5"
            >
              <Download className="h-4 w-4" /> Export
            </Button>
            <div className="absolute right-0 top-10 hidden group-hover:block hover:block bg-[#09090b] border border-zinc-800 rounded-xl p-2 shadow-2xl z-40 w-44">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg w-full text-left"
              >
                <FileDown className="h-4 w-4 text-zinc-500" /> Export CSV
              </button>
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg w-full text-left"
              >
                <Files className="h-4 w-4 text-zinc-500" /> Export Excel
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg w-full text-left"
              >
                <TableProperties className="h-4 w-4 text-zinc-500" /> Compile
                PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="bg-[#09090b]/80 border-zinc-900">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by username or content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-zinc-950"
            />
          </div>
          <div className="w-full md:w-44">
            <Select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="bg-zinc-950"
            >
              <option value="all">All Platforms</option>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="facebook">Facebook</option>
              <option value="youtube">YouTube</option>
            </Select>
          </div>
          <div className="w-full md:w-44">
            <Select
              value={sentimentFilter}
              onChange={(e) => setSentimentFilter(e.target.value)}
              className="bg-zinc-950"
            >
              <option value="all">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </Select>
          </div>
          <div className="w-full md:w-44">
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-zinc-950"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="engagement-desc">Highest Engagement</option>
              <option value="likes-desc">Most Likes</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="bg-zinc-950/40 border-zinc-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-900 bg-zinc-950/60 text-zinc-500 font-semibold text-xs uppercase tracking-wider">
                <th className="px-6 py-4">Username</th>
                <th className="px-6 py-4">Platform</th>
                <th className="px-6 py-4">Content</th>
                <th className="px-6 py-4 text-right">Engagement</th>
                <th className="px-6 py-4 text-right">Views</th>
                <th className="px-6 py-4 text-center">Source</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {apiLoading && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-zinc-500 text-xs"
                  >
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                    Loading posts from backend...
                  </td>
                </tr>
              )}
              {!apiLoading &&
                sortedPosts.map((post) => {
                  const engagement =
                    post.likes + post.comments + post.shares;
                  return (
                    <tr
                      key={post.id}
                      className="hover:bg-zinc-900/30 transition-colors text-zinc-300"
                    >
                      <td className="px-6 py-4 font-semibold text-white">
                        @{post.username}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-zinc-900 border border-zinc-800 capitalize">
                          {post.platform}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-sm">
                        <p
                          className="line-clamp-2 leading-relaxed"
                          title={post.content}
                        >
                          {post.content}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        <div className="flex flex-col items-end">
                          <span className="text-white font-bold">
                            {engagement.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            {post.likes} likes &middot; {post.comments} comments
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-zinc-400 text-xs">
                        {post.views > 0
                          ? post.views.toLocaleString()
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            post._source === "api"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-zinc-800 text-zinc-400 border-zinc-700"
                          }`}
                        >
                          {post._source === "api" ? "scraped" : "local"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {post._source === "api" && (
                            <button
                              onClick={() =>
                                handleViewComments({
                                  id: post.id,
                                  username: post.username,
                                  platform: post.platform,
                                })
                              }
                              title="Lihat semua komentar"
                              className="p-1 rounded hover:bg-indigo-500/10 text-zinc-500 hover:text-indigo-400 transition-colors"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </button>
                          )}
                          {post._source === "local" && (
                            <button
                              onClick={() => {
                                deletePost(post.id);
                                addNotification("Deleted post.");
                              }}
                              className="p-1 rounded hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              {!apiLoading && sortedPosts.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-zinc-500 text-xs"
                  >
                    No posts found. Click{" "}
                    <strong>Scrape URL</strong> to collect data from social
                    media.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Scrape URL Dialog */}
      <Dialog isOpen={isScrapeOpen} onClose={handleCloseScrape}>
        <DialogContent onClose={handleCloseScrape} className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-indigo-400" /> Scrape Social Media
              URL
            </DialogTitle>
            <DialogDescription>
              Paste a YouTube, TikTok, Instagram, or Facebook URL. The system
              will automatically collect metadata, engagement data, and
              comments.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleScrapeSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400">
                Social Media URL
              </label>
              <Input
                type="url"
                required
                placeholder="https://www.youtube.com/watch?v=..."
                value={scrapeUrl}
                onChange={(e) => setScrapeUrl(e.target.value)}
                disabled={scrapeStatus === "loading"}
              />
            </div>

            {scrapeMessage && (
              <div
                className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 border ${
                  scrapeStatus === "success"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : scrapeStatus === "error"
                    ? "bg-red-500/10 border-red-500/20 text-red-400"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400"
                }`}
              >
                {scrapeStatus === "loading" && (
                  <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                )}
                {scrapeStatus === "success" && (
                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                )}
                {scrapeStatus === "error" && (
                  <XCircle className="h-3 w-3 shrink-0" />
                )}
                {scrapeMessage}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseScrape}
                className="border-zinc-800 hover:bg-zinc-900"
              >
                {scrapeStatus === "success" ? "Close" : "Cancel"}
              </Button>
              {scrapeStatus !== "success" && (
                <Button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700"
                  disabled={scrapeStatus === "loading"}
                >
                  {scrapeStatus === "loading" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />{" "}
                      Scraping...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-1" /> Start Scrape
                    </>
                  )}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Comments Dialog */}
      <Dialog isOpen={!!commentsPost} onClose={handleCloseComments}>
        <DialogContent
          onClose={handleCloseComments}
          className="max-w-2xl max-h-[80vh] flex flex-col"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-indigo-400" />
              Komentar &mdash; @{commentsPost?.username ?? ""}
              <span className="text-xs font-normal text-zinc-500 capitalize ml-1">
                {commentsPost?.platform}
              </span>
            </DialogTitle>
            <DialogDescription>
              {commentsLoading
                ? "Memuat komentar dari database..."
                : commentsError
                ? commentsError
                : `${comments.length} komentar ditemukan`}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0 max-h-[55vh]">
            {commentsLoading && (
              <div className="flex items-center justify-center py-10 text-zinc-500 text-sm">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Memuat
                komentar...
              </div>
            )}
            {!commentsLoading && commentsError && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-3">
                <XCircle className="h-4 w-4 shrink-0" /> {commentsError}
              </div>
            )}
            {!commentsLoading && !commentsError && comments.length === 0 && (
              <div className="text-center py-10 text-zinc-500 text-sm">
                Tidak ada komentar. Komentar tersedia setelah scraping ulang
                dengan versi terbaru.
              </div>
            )}
            {!commentsLoading &&
              comments.map((c, i) => (
                <div
                  key={c.id ?? i}
                  className={`rounded-xl border p-3 space-y-1 ${
                    c.parent !== "root"
                      ? "ml-6 bg-zinc-900/40 border-zinc-800/60"
                      : "bg-zinc-950/60 border-zinc-800"
                  }`}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    {c.parent !== "root" && (
                      <CornerDownRight className="h-3 w-3 text-zinc-600 shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-white">
                      {c.author ?? "Anonymous"}
                    </span>
                    {c.author_is_uploader && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                        <Crown className="h-2.5 w-2.5" /> Creator
                      </span>
                    )}
                    {c.is_favorited && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                        Favorited
                      </span>
                    )}
                    {c.timestamp && (
                      <span className="text-[10px] text-zinc-600 ml-auto">
                        {new Date(c.timestamp * 1000).toLocaleDateString(
                          "id-ID",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {c.text}
                  </p>
                  {c.like_count > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500 mt-1">
                      <ThumbsUp className="h-2.5 w-2.5" />{" "}
                      {c.like_count.toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
          </div>

          <DialogFooter className="pt-3 border-t border-zinc-800">
            <Button
              variant="outline"
              onClick={handleCloseComments}
              className="border-zinc-800 hover:bg-zinc-900 text-xs"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
