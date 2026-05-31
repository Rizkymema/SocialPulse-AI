"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Download,
  ExternalLink,
  FileDown,
  Files,
  Link2,
  Loader2,
  MessageSquare,
  Search,
  TableProperties,
  Trash2,
  XCircle,
} from "lucide-react";
import {
  deletePost,
  getPostComments,
  getPosts,
  pollScrapeJob,
  submitScrapeJob,
  type Comment,
  type ScrapedPost,
} from "@/lib/apiClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { exportToCSV, exportToExcel, exportToPDF } from "@/lib/exportEngine";
import type { ExportComment, ExportDataset, ExportPost } from "@/lib/exportTypes";
import {
  detectPostSentiment,
  detectSentiment,
  getSentimentLabel,
  summarizeSentiments,
} from "@/lib/sentiment";
import { useSaaSStore } from "@/store/useSaaSStore";

type CommentsPostState = {
  id: string;
  username: string;
  platform: string;
};

type ScraperWorkspaceProps = {
  mode?: "app" | "embedded";
  themeMode?: "dark" | "light";
};

export function ScraperWorkspace({ mode = "app", themeMode = "dark" }: ScraperWorkspaceProps) {
  const { addNotification } = useSaaSStore();
  const isEmbedded = mode === "embedded";
  const isEmbeddedLight = isEmbedded && themeMode === "light";

  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");

  const [isScrapeOpen, setIsScrapeOpen] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scrapeStatus, setScrapeStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [scrapeMessage, setScrapeMessage] = useState("");

  const [apiPosts, setApiPosts] = useState<ScrapedPost[]>([]);
  const [apiLoading, setApiLoading] = useState(true);

  const [commentsPost, setCommentsPost] = useState<CommentsPostState | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState("");
  const [sessionComments, setSessionComments] = useState<Record<string, Comment[]>>({});
  const [exportingFormat, setExportingFormat] = useState<"csv" | "excel" | "pdf" | null>(null);
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [deletingPostIds, setDeletingPostIds] = useState<string[]>([]);

  useEffect(() => {
    getPosts({ size: 100 })
      .then((res) => setApiPosts(res.items))
      .catch(() => setApiPosts([]))
      .finally(() => setApiLoading(false));
  }, []);

  const reloadApiPosts = useCallback(() => {
    getPosts({ size: 100 })
      .then((res) =>
        setApiPosts((current) => {
          const ephemeralPosts = current.filter((post) => post.id.startsWith("ephemeral-"));
          const persistedIds = new Set(res.items.map((post) => post.id));
          return [
            ...ephemeralPosts.filter((post) => !persistedIds.has(post.id)),
            ...res.items,
          ];
        })
      )
      .catch(() => {
        setApiPosts((current) => current.filter((post) => post.id.startsWith("ephemeral-")));
      });
  }, []);

  const extractInlineComments = useCallback((post: ScrapedPost): Comment[] => {
    const rawComments = post.raw_data?.comments;
    if (!Array.isArray(rawComments)) {
      return [];
    }

    return rawComments
      .map((comment, index) => ({
        id:
          typeof comment.id === "string"
            ? comment.id
            : `inline-${post.id}-${index}`,
        text: typeof comment.text === "string" ? comment.text : "",
        author: typeof comment.author === "string" ? comment.author : undefined,
        author_id:
          typeof comment.author_id === "string" ? comment.author_id : undefined,
        timestamp:
          typeof comment.timestamp === "number" ? comment.timestamp : undefined,
        like_count:
          typeof comment.like_count === "number" ? comment.like_count : 0,
        is_favorited: Boolean(comment.is_favorited),
        author_is_uploader: Boolean(comment.author_is_uploader),
        parent:
          typeof comment.parent === "string" && comment.parent.length > 0
            ? comment.parent
            : "root",
      }))
      .filter((comment) => comment.text.length > 0);
  }, []);

  const upsertScrapedPost = useCallback((post: ScrapedPost) => {
    setApiPosts((current) => [post, ...current.filter((item) => item.id !== post.id)]);

    const inlineComments = extractInlineComments(post);
    if (inlineComments.length > 0) {
      setSessionComments((current) => ({
        ...current,
        [post.id]: inlineComments,
      }));
    }
  }, [extractInlineComments]);

  const completeScrape = useCallback((post: ScrapedPost) => {
    setScrapeStatus("success");
    setScrapeMessage(
      `Berhasil mengambil data dari ${post.platform} milik @${post.username ?? "unknown"}.`
    );
    addNotification(
      `Scraping selesai: ${post.username ?? scrapeUrl} (${post.platform})`
    );
    upsertScrapedPost(post);

    if (!post.id.startsWith("ephemeral-")) {
      reloadApiPosts();
    }
  }, [addNotification, reloadApiPosts, scrapeUrl, upsertScrapedPost]);

  const handleScrapeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scrapeUrl.trim()) return;

    setScrapeStatus("loading");
    setScrapeMessage("Mengirim URL ke backend...");

    try {
      const job = await submitScrapeJob(scrapeUrl.trim());

      if (job.status === "completed" && job.result) {
        completeScrape(job.result);
        return;
      }

      if (job.status === "failed") {
        setScrapeStatus("error");
        setScrapeMessage(job.error_message ?? "Scraping gagal.");
        return;
      }

      setScrapeMessage(`Job dibuat (${job.platform}). Scraping...`);

      const result = await pollScrapeJob(job.job_id, (status) => {
        setScrapeMessage(`Status: ${status}...`);
      });

      if (result.status === "completed" && result.result) {
        completeScrape(result.result);
      } else {
        setScrapeStatus("error");
        setScrapeMessage(result.error_message ?? "Scraping gagal.");
      }
    } catch (err: unknown) {
      setScrapeStatus("error");
      setScrapeMessage(
        err instanceof Error
          ? err.message === "Failed to fetch"
            ? "Backend scraping tidak bisa dijangkau. Coba lagi beberapa saat atau cek deployment backend."
            : err.message
          : "Terjadi kesalahan saat scraping."
      );
    }
  };

  const handleCloseScrape = () => {
    setIsScrapeOpen(false);
    setScrapeUrl("");
    setScrapeStatus("idle");
    setScrapeMessage("");
  };

  const handleViewComments = async (post: ScrapedPost) => {
    const nextCommentsPost: CommentsPostState = {
      id: post.id,
      username: post.username ?? "unknown",
      platform: post.platform,
    };

    setCommentsPost(nextCommentsPost);
    setComments([]);
    setCommentsError("");
    setCommentsLoading(true);

    try {
      const inlineComments = sessionComments[post.id] ?? extractInlineComments(post);
      if (inlineComments.length > 0) {
        setComments(inlineComments);
        return;
      }

      const res = await getPostComments(post.id);
      setComments(res.comments);
      setSessionComments((current) => ({
        ...current,
        [post.id]: res.comments,
      }));
    } catch {
      setCommentsError(
        "Komentar belum tersedia atau belum ikut tersimpan saat proses scraping."
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

  const removePostsFromState = useCallback((postIds: string[]) => {
    if (postIds.length === 0) {
      return;
    }

    setApiPosts((current) => current.filter((post) => !postIds.includes(post.id)));
    setSelectedPostIds((current) => current.filter((postId) => !postIds.includes(postId)));
    setSessionComments((current) => {
      const next = { ...current };
      postIds.forEach((postId) => {
        delete next[postId];
      });
      return next;
    });

    if (commentsPost && postIds.includes(commentsPost.id)) {
      setCommentsPost(null);
      setComments([]);
      setCommentsError("");
    }
  }, [commentsPost]);

  const filteredPosts = apiPosts.filter((post) => {
    const normalizedSearch = search.toLowerCase();
    const matchesSearch =
      (post.username ?? "").toLowerCase().includes(normalizedSearch) ||
      (post.content ?? "").toLowerCase().includes(normalizedSearch);
    const matchesPlatform =
      platformFilter === "all" || post.platform === platformFilter;

    return matchesSearch && matchesPlatform;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    const aTimestamp = new Date(a.posted_at ?? a.created_at).getTime();
    const bTimestamp = new Date(b.posted_at ?? b.created_at).getTime();
    const aEngagement = a.likes + a.comments + a.shares;
    const bEngagement = b.likes + b.comments + b.shares;

    if (sortBy === "date-desc") return bTimestamp - aTimestamp;
    if (sortBy === "date-asc") return aTimestamp - bTimestamp;
    if (sortBy === "engagement-desc") return bEngagement - aEngagement;
    if (sortBy === "comments-desc") return b.comments - a.comments;
    return b.likes - a.likes;
  });

  const activeSelectedPostIds = selectedPostIds.filter((postId) =>
    apiPosts.some((post) => post.id === postId)
  );
  const selectedPosts = apiPosts.filter((post) => activeSelectedPostIds.includes(post.id));
  const visibleSelectedCount = sortedPosts.filter((post) => activeSelectedPostIds.includes(post.id)).length;
  const allVisibleSelected = sortedPosts.length > 0 && visibleSelectedCount === sortedPosts.length;

  const togglePostSelection = (postId: string) => {
    setSelectedPostIds((current) =>
      current.includes(postId)
        ? current.filter((id) => id !== postId)
        : [...current, postId]
    );
  };

  const toggleVisibleSelection = () => {
    const visibleIds = sortedPosts.map((post) => post.id);
    setSelectedPostIds((current) => {
      if (visibleIds.every((id) => current.includes(id))) {
        return current.filter((id) => !visibleIds.includes(id));
      }

      return Array.from(new Set([...current, ...visibleIds]));
    });
  };

  const loadCommentsForExport = useCallback(async (post: ScrapedPost): Promise<Comment[]> => {
    const cachedComments = sessionComments[post.id] ?? extractInlineComments(post);
    if (cachedComments.length > 0) {
      if (!sessionComments[post.id]) {
        setSessionComments((current) => ({
          ...current,
          [post.id]: cachedComments,
        }));
      }
      return cachedComments;
    }

    const res = await getPostComments(post.id);
    setSessionComments((current) => ({
      ...current,
      [post.id]: res.comments,
    }));
    return res.comments;
  }, [extractInlineComments, sessionComments]);

  const buildExportDataset = useCallback(async (posts: ScrapedPost[]): Promise<ExportDataset> => {
    const payloads = await Promise.all(
      posts.map(async (post) => {
        const loadedComments = await loadCommentsForExport(post);

        const exportComments: ExportComment[] = loadedComments.map((comment, index) => ({
          id: comment.id ?? `${post.id}-comment-${index + 1}`,
          postId: post.id,
          postPlatform: post.platform as ExportPost["platform"],
          postUrl: post.url,
          postUsername: post.username ?? "unknown",
          postTimestamp: post.posted_at ?? post.created_at,
          author: comment.author ?? "Anonymous",
          content: comment.text,
          likes: comment.like_count,
          timestamp:
            typeof comment.timestamp === "number"
              ? new Date(comment.timestamp * 1000).toISOString()
              : post.posted_at ?? post.created_at,
          parent: comment.parent,
          sentiment: detectSentiment(comment.text),
        }));

        const commentSentiments = summarizeSentiments(
          exportComments.map((comment) => comment.sentiment)
        );

        const exportPost: ExportPost = {
          id: post.id,
          platform: post.platform as ExportPost["platform"],
          url: post.url,
          username: post.username ?? "unknown",
          content: post.content ?? "",
          likes: post.likes,
          comments: post.comments,
          shares: post.shares,
          views: post.views,
          timestamp: post.posted_at ?? post.created_at,
          sentiment: detectPostSentiment(
            exportComments.map((comment) => comment.content),
            post.content ?? ""
          ),
          commentSentiments,
        };

        return {
          post: exportPost,
          comments: exportComments,
        };
      })
    );

    return {
      posts: payloads.map((item) => item.post),
      comments: payloads.flatMap((item) => item.comments),
    };
  }, [loadCommentsForExport]);

  const handleDeletePosts = useCallback(async (posts: ScrapedPost[]) => {
    if (posts.length === 0) {
      return;
    }

    const confirmMessage =
      posts.length === 1
        ? `Hapus hasil scraping dari @${posts[0].username ?? "unknown"}?`
        : `Hapus ${posts.length} hasil scraping yang dipilih?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    const targetIds = posts.map((post) => post.id);
    setDeletingPostIds((current) => Array.from(new Set([...current, ...targetIds])));

    const ephemeralIds = posts
      .filter((post) => post.id.startsWith("ephemeral-"))
      .map((post) => post.id);
    const persistedPosts = posts.filter((post) => !post.id.startsWith("ephemeral-"));
    const deleteResults = await Promise.allSettled(
      persistedPosts.map((post) => deletePost(post.id))
    );

    const deletedPersistedIds = persistedPosts
      .filter((_, index) => deleteResults[index]?.status === "fulfilled")
      .map((post) => post.id);
    const failedDeletes = persistedPosts.filter(
      (_, index) => deleteResults[index]?.status === "rejected"
    );
    const deletedIds = [...ephemeralIds, ...deletedPersistedIds];

    removePostsFromState(deletedIds);
    setDeletingPostIds((current) => current.filter((postId) => !targetIds.includes(postId)));

    if (deletedIds.length > 0) {
      addNotification(
        deletedIds.length === 1
          ? "1 hasil scraping berhasil dihapus."
          : `${deletedIds.length} hasil scraping berhasil dihapus.`
      );
    }

    if (failedDeletes.length > 0) {
      alert(
        failedDeletes.length === 1
          ? `Gagal menghapus @${failedDeletes[0].username ?? "unknown"}. Coba lagi.`
          : `${failedDeletes.length} hasil scraping gagal dihapus. Coba lagi.`
      );
    }
  }, [addNotification, removePostsFromState]);

  const runExport = async (format: "csv" | "excel" | "pdf") => {
    const targetPosts = selectedPosts.length > 0 ? selectedPosts : sortedPosts;

    if (targetPosts.length === 0) {
      alert("Belum ada data scraping untuk diunduh.");
      return;
    }

    setExportingFormat(format);
    try {
      const dataset = await buildExportDataset(targetPosts);
      const summaryText = [
        `Export ${dataset.posts.length} postingan dengan ${dataset.comments.length} komentar hasil scraping.`,
        `Komentar positif: ${dataset.comments.filter((comment) => comment.sentiment === "positive").length}.`,
        `Komentar netral: ${dataset.comments.filter((comment) => comment.sentiment === "neutral").length}.`,
        `Komentar negatif: ${dataset.comments.filter((comment) => comment.sentiment === "negative").length}.`,
      ].join(" ");

      if (format === "csv") {
        exportToCSV(dataset, "hasil_scraping_socialpulse.csv");
      } else if (format === "excel") {
        exportToExcel(dataset, "Hasil Scraping", "hasil_scraping_socialpulse.xlsx");
      } else {
        exportToPDF(
          dataset,
          "Hasil Scraping",
          summaryText,
          "hasil_scraping_socialpulse.pdf"
        );
      }

      addNotification(
        `Berhasil mengunduh ${dataset.posts.length} postingan dan ${dataset.comments.length} komentar ke ${format.toUpperCase()}.`
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menyiapkan file download."
      );
    } finally {
      setExportingFormat(null);
    }
  };

  const activeCommentSentiments = summarizeSentiments(
    comments.map((comment) => detectSentiment(comment.text))
  );

  const accentTextClass = isEmbeddedLight
    ? "text-indigo-600"
    : isEmbedded
    ? "text-[#d8ad74]"
    : "text-indigo-400";
  const accentButtonClass = isEmbeddedLight
    ? "bg-slate-950 text-white hover:bg-slate-800 shadow-[0_14px_32px_rgba(15,23,42,0.16)] border border-slate-900/5"
    : isEmbedded
    ? "bg-[#d8ad74] text-[#17120d] hover:bg-[#ebc493]"
    : "bg-indigo-600 hover:bg-indigo-700";
  const accentCheckboxClass = isEmbeddedLight
    ? "text-indigo-600 focus:ring-indigo-500"
    : isEmbedded
    ? "text-[#d8ad74] focus:ring-[#d8ad74]"
    : "text-indigo-500 focus:ring-indigo-500";
  const accentLinkClass = isEmbeddedLight
    ? "text-indigo-600"
    : isEmbedded
    ? "text-[#e7c392]"
    : "text-indigo-400";
  const accentHoverClass = isEmbeddedLight
    ? "hover:bg-indigo-50 hover:text-indigo-600"
    : isEmbedded
    ? "hover:bg-[#d8ad74]/10 hover:text-[#e7c392]"
    : "hover:bg-indigo-500/10 hover:text-indigo-400";
  const embeddedFieldIconClass = isEmbeddedLight ? "text-slate-400" : "text-zinc-500";
  const embeddedUrlInputClass = isEmbeddedLight
    ? "bg-white border-slate-200 text-slate-800 h-12 pl-11 rounded-full text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400 shadow-[0_14px_26px_rgba(148,163,184,0.14)] w-full"
    : "bg-zinc-950/80 border-zinc-800 h-12 pl-11 rounded-full text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-zinc-500 w-full";
  const embeddedSubmitLoadingClass = isEmbeddedLight
    ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
    : "bg-zinc-850 text-zinc-500 cursor-not-allowed border border-zinc-800";
  const embeddedSubmitButtonClass = isEmbeddedLight
    ? "bg-white text-slate-900 border border-indigo-100 hover:bg-slate-50 hover:shadow-[0_12px_28px_rgba(99,102,241,0.16)]"
    : "bg-white text-black hover:bg-zinc-200 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]";
  const embeddedPlatformHintTextClass = isEmbeddedLight ? "text-slate-400" : "text-zinc-500";
  const embeddedPlatformHintClass = isEmbeddedLight
    ? "rounded-full border border-slate-300 bg-slate-100/90 px-3 py-1 text-slate-500"
    : "rounded-full border border-zinc-900 bg-zinc-950/60 px-3 py-1 text-zinc-400";
  const embeddedStatusIdleClass = isEmbeddedLight
    ? "bg-white/90 border-slate-200 text-slate-500 shadow-[0_10px_24px_rgba(148,163,184,0.12)]"
    : "bg-zinc-900 border-zinc-800 text-zinc-400";
  const dashboardCardClass = isEmbeddedLight
    ? "bg-white/92 border-slate-200 shadow-[0_28px_60px_rgba(148,163,184,0.18)] rounded-2xl"
    : "bg-[#09090b]/80 border-zinc-900 shadow-xl rounded-2xl";
  const dashboardFieldIconClass = isEmbeddedLight ? "text-slate-400" : "text-zinc-500";
  const dashboardInputClass = isEmbeddedLight
    ? "pl-9 bg-white border-slate-200 text-slate-800 focus:border-indigo-500 h-10 rounded-xl placeholder:text-slate-400 w-full"
    : "pl-9 bg-zinc-950 border-zinc-800 focus:border-indigo-500 h-10 rounded-xl placeholder-zinc-600 w-full";
  const dashboardSelectClass = isEmbeddedLight
    ? "bg-white border-slate-200 text-slate-800 focus:border-indigo-500 h-10 rounded-xl w-full"
    : "bg-zinc-950 border-zinc-800 focus:border-indigo-500 h-10 rounded-xl w-full";
  const dashboardDividerClass = isEmbeddedLight ? "border-slate-200/90" : "border-zinc-900/60";
  const statsLabelClass = isEmbeddedLight ? "text-slate-400 font-medium" : "text-zinc-500 font-medium";
  const statsBadgeClass = isEmbeddedLight
    ? "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-semibold"
    : "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 font-semibold";
  const statsSelectedBadgeClass = isEmbeddedLight
    ? "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 font-semibold"
    : "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold";
  const statsMetaClass = isEmbeddedLight ? "text-slate-400 font-medium ml-1" : "text-zinc-500 font-medium ml-1";
  const secondaryButtonClass = isEmbeddedLight
    ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:border-slate-300 text-xs font-semibold h-9 rounded-xl"
    : "border-zinc-800 hover:bg-zinc-900 text-xs font-semibold h-9 rounded-xl";
  const dropdownButtonClass = isEmbeddedLight
    ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:border-slate-300 text-xs font-semibold flex items-center gap-1.5 h-9 rounded-xl"
    : "border-zinc-800 hover:bg-zinc-900 text-xs font-semibold flex items-center gap-1.5 h-9 rounded-xl";
  const dropdownMenuClass = isEmbeddedLight
    ? "absolute right-0 top-9 hidden group-hover:block hover:block bg-white border border-slate-200 rounded-xl p-1.5 shadow-[0_24px_45px_rgba(148,163,184,0.22)] z-40 w-44"
    : "absolute right-0 top-9 hidden group-hover:block hover:block bg-zinc-950 border border-zinc-800 rounded-xl p-1.5 shadow-2xl z-40 w-44";
  const dropdownItemClass = isEmbeddedLight
    ? "flex items-center gap-2 px-3 py-2 text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg w-full text-left"
    : "flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg w-full text-left";
  const dropdownIconClass = isEmbeddedLight ? "text-slate-400" : "text-zinc-500";
  const tableCardClass = isEmbeddedLight
    ? "bg-white/88 border-slate-200 overflow-hidden shadow-[0_20px_44px_rgba(148,163,184,0.14)]"
    : "bg-zinc-950/40 border-zinc-900 overflow-hidden";
  const tableHeaderClass = isEmbeddedLight
    ? "border-b border-slate-200 bg-slate-100/95 text-slate-500 font-semibold text-xs uppercase tracking-wider"
    : "border-b border-zinc-900 bg-zinc-950/60 text-zinc-500 font-semibold text-xs uppercase tracking-wider";
  const tableBodyClass = isEmbeddedLight ? "divide-y divide-slate-200" : "divide-y divide-zinc-900";
  const tableCheckboxSurfaceClass = isEmbeddedLight ? "border-slate-300 bg-white" : "border-zinc-700 bg-zinc-950";
  const tableMutedTextClass = isEmbeddedLight ? "text-slate-400" : "text-zinc-500";
  const tableRowClass = isEmbeddedLight
    ? "hover:bg-slate-50 transition-colors text-slate-700"
    : "hover:bg-zinc-900/30 transition-colors text-zinc-300";
  const tablePrimaryTextClass = isEmbeddedLight ? "text-slate-900" : "text-white";
  const tableDateTextClass = isEmbeddedLight ? "text-slate-500" : "text-zinc-400";
  const defaultPlatformBadgeClass = isEmbeddedLight
    ? "bg-slate-100 border border-slate-200 text-slate-600"
    : "bg-zinc-900 border border-zinc-800 text-zinc-400";
  const actionIconBaseClass = isEmbeddedLight ? "text-slate-400" : "text-zinc-500";
  const externalActionClass = isEmbeddedLight
    ? "p-1 rounded hover:bg-emerald-50 text-slate-400 hover:text-emerald-500 transition-colors"
    : "p-1 rounded hover:bg-emerald-500/10 text-zinc-500 hover:text-emerald-400 transition-colors";
  const deleteActionClass = isEmbeddedLight
    ? "p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
    : "p-1 rounded hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-colors disabled:opacity-50";
  const emptyStateClass = isEmbeddedLight ? "text-slate-400" : "text-zinc-500";
  const commentsDialogClass = isEmbeddedLight
    ? "max-w-2xl max-h-[80vh] flex flex-col border-slate-200 bg-white shadow-[0_32px_64px_rgba(148,163,184,0.24)]"
    : "max-w-2xl max-h-[80vh] flex flex-col";
  const commentsDialogTitleClass = isEmbeddedLight ? "text-slate-900" : "";
  const commentsDialogMetaClass = isEmbeddedLight ? "text-slate-400 capitalize ml-1" : "text-zinc-500 capitalize ml-1";
  const commentsLoadingClass = isEmbeddedLight ? "text-slate-400" : "text-zinc-500";
  const commentCardRootClass = isEmbeddedLight
    ? "bg-slate-50/80 border-slate-200"
    : "bg-zinc-950/60 border-zinc-800";
  const commentCardReplyClass = isEmbeddedLight
    ? "ml-6 bg-slate-100/80 border-slate-200"
    : "ml-6 bg-zinc-900/40 border-zinc-800/60";
  const commentAuthorClass = isEmbeddedLight ? "text-slate-900" : "text-white";
  const commentNeutralBadgeClass = isEmbeddedLight
    ? "bg-slate-100 text-slate-600 border border-slate-200"
    : "bg-zinc-800 text-zinc-300 border border-zinc-700";
  const commentTimestampClass = isEmbeddedLight ? "text-slate-400 ml-auto" : "text-zinc-600 ml-auto";
  const commentLikesClass = isEmbeddedLight ? "text-slate-400" : "text-zinc-500";
  const commentTextClass = isEmbeddedLight ? "text-slate-700 leading-relaxed" : "text-zinc-300 leading-relaxed";
  const commentsFooterClass = isEmbeddedLight ? "pt-3 border-t border-slate-200" : "pt-3 border-t border-zinc-800";
  const dialogSecondaryButtonClass = isEmbeddedLight
    ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-100 text-xs"
    : "border-zinc-800 hover:bg-zinc-900 text-xs";

  const workspaceTitle = isEmbedded
    ? "Scraping langsung dari beranda"
    : "Scraper & Hasil Data";

  const workspaceDescription = isEmbedded
    ? "Tempel URL postingan atau profil publik langsung di halaman ini. Hasil scraping, komentar, pemilihan data, dan export akan masuk ke workspace yang sama tanpa pindah ke halaman kerja terpisah."
    : "Gunakan halaman ini untuk scraping URL postingan atau profil media sosial, melihat hasil yang berhasil diambil, lalu mengunduh hanya data yang dipilih.";

  return (
    <div className="space-y-6 text-left">
      {!isEmbedded && (
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {workspaceTitle}
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
              {workspaceDescription}
            </p>
          </div>

          <div className="flex gap-2 w-full xl:w-auto">
            <Button
              onClick={() => setIsScrapeOpen(true)}
              className={`${accentButtonClass} shrink-0 text-xs font-semibold`}
            >
              <Link2 className="h-4 w-4 mr-1" /> Scrape URL
            </Button>

            <div className="relative group shrink-0">
              <Button
                variant="outline"
                className="border-zinc-800 hover:bg-zinc-900 text-xs font-semibold flex items-center gap-1.5"
              >
                <Download className="h-4 w-4" />
                {activeSelectedPostIds.length > 0
                  ? `Download Terpilih (${activeSelectedPostIds.length})`
                  : "Download Hasil"}
              </Button>
              <div className="absolute right-0 top-10 hidden group-hover:block hover:block bg-[#09090b] border border-zinc-800 rounded-xl p-2 shadow-2xl z-40 w-44">
                <button
                  type="button"
                  onClick={() => void runExport("csv")}
                  disabled={exportingFormat !== null}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg w-full text-left"
                >
                  <FileDown className="h-4 w-4 text-zinc-500" />
                  {exportingFormat === "csv" ? "Menyiapkan CSV..." : "Download CSV"}
                </button>
                <button
                  type="button"
                  onClick={() => void runExport("excel")}
                  disabled={exportingFormat !== null}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg w-full text-left"
                >
                  <Files className="h-4 w-4 text-zinc-500" />
                  {exportingFormat === "excel" ? "Menyiapkan Excel..." : "Download Excel"}
                </button>
                <button
                  type="button"
                  onClick={() => void runExport("pdf")}
                  disabled={exportingFormat !== null}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg w-full text-left"
                >
                  <TableProperties className="h-4 w-4 text-zinc-500" />
                  {exportingFormat === "pdf" ? "Menyiapkan PDF..." : "Download PDF"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isEmbedded && (
        <div className="space-y-4 mb-6">
          <form onSubmit={handleScrapeSubmit} className="w-full max-w-2xl mx-auto space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Link2 className={`absolute left-4 top-3.5 h-4 w-4 ${embeddedFieldIconClass}`} />
                <Input
                  type="url"
                  required
                  placeholder="Tempel URL YouTube, TikTok, Instagram, atau Facebook di sini..."
                  value={scrapeUrl}
                  onChange={(e) => setScrapeUrl(e.target.value)}
                  disabled={scrapeStatus === "loading"}
                  className={embeddedUrlInputClass}
                />
              </div>
              <Button
                type="submit"
                className={`h-12 px-6 rounded-full whitespace-nowrap text-sm font-semibold transition-all ${
                  scrapeStatus === "loading"
                    ? embeddedSubmitLoadingClass
                    : embeddedSubmitButtonClass
                }`}
                disabled={scrapeStatus === "loading"}
              >
                {scrapeStatus === "loading" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Scraping...
                  </>
                ) : (
                  <>
                    Mulai Scrape
                  </>
                )}
              </Button>
            </div>

            <div className={`flex flex-wrap justify-center gap-2 text-[10px] ${embeddedPlatformHintTextClass}`}>
              {[
                "YouTube video / channel",
                "TikTok video / profile",
                "Instagram post / profile",
                "Facebook post / page",
              ].map((item) => (
                <span
                  key={item}
                  className={embeddedPlatformHintClass}
                >
                  {item}
                </span>
              ))}
            </div>
          </form>

          {scrapeMessage && (
            <div
              className={`max-w-2xl mx-auto flex items-center gap-2 text-xs rounded-xl px-4 py-3 border ${
                scrapeStatus === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : scrapeStatus === "error"
                  ? "bg-red-500/10 border-red-500/20 text-red-400"
                  : embeddedStatusIdleClass
              }`}
            >
              {scrapeStatus === "loading" && (
                <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
              )}
              {scrapeStatus === "success" && (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              )}
              {scrapeStatus === "error" && (
                <XCircle className="h-3.5 w-3.5 shrink-0" />
              )}
              <span className="flex-1">{scrapeMessage}</span>
            </div>
          )}
        </div>
      )}

      {/* Main Scraper Dashboard Toolbar */}
      <Card className={dashboardCardClass}>
        <CardContent className="p-4 space-y-4">
          {/* Top Row: Search and Filters */}
          <div className="flex flex-col md:flex-row gap-3 items-center">
            <div className="relative w-full md:flex-1">
              <Search className={`absolute left-3 top-3 h-4 w-4 ${dashboardFieldIconClass}`} />
              <Input
                placeholder="Cari berdasarkan username atau isi postingan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={dashboardInputClass}
              />
            </div>
            <div className="w-full md:w-44 shrink-0">
              <Select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className={dashboardSelectClass}
              >
                <option value="all">Semua Platform</option>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="facebook">Facebook</option>
                <option value="youtube">YouTube</option>
              </Select>
            </div>
            <div className="w-full md:w-52 shrink-0">
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={dashboardSelectClass}
              >
                <option value="date-desc">Terbaru</option>
                <option value="date-asc">Terlama</option>
                <option value="engagement-desc">Engagement Tertinggi</option>
                <option value="comments-desc">Komentar Terbanyak</option>
                <option value="likes-desc">Likes Terbanyak</option>
              </Select>
            </div>
          </div>

          {/* Bottom Row: Stats and Actions */}
          <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pt-2 border-t ${dashboardDividerClass}`}>
            {/* Stats Badges */}
            <div className="flex flex-wrap gap-2 items-center text-xs">
              <span className={statsLabelClass}>Stats:</span>
              <span className={statsBadgeClass}>
                Total Scraped: {apiPosts.length}
              </span>
              <span className={statsSelectedBadgeClass}>
                Terpilih: {activeSelectedPostIds.length}
              </span>
              <span className={statsMetaClass}>
                ({sortedPosts.length} data tampil)
              </span>
            </div>

            {/* Actions Group */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto lg:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={toggleVisibleSelection}
                className={secondaryButtonClass}
              >
                {allVisibleSelected ? "Batal Pilih Semua" : "Pilih Semua Tampil"}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedPostIds([])}
                disabled={activeSelectedPostIds.length === 0}
                className={secondaryButtonClass}
              >
                Bersihkan
              </Button>

              {/* Integrated Download Actions Dropdown */}
              <div className="relative group shrink-0">
                <Button
                  variant="outline"
                  className={dropdownButtonClass}
                >
                  <Download className={`h-3.5 w-3.5 ${dropdownIconClass}`} />
                  Unduh Data
                </Button>
                <div className={dropdownMenuClass}>
                  <button
                    type="button"
                    onClick={() => void runExport("csv")}
                    disabled={exportingFormat !== null}
                    className={dropdownItemClass}
                  >
                    <FileDown className={`h-4 w-4 ${dropdownIconClass}`} />
                    {exportingFormat === "csv" ? "Menyiapkan CSV..." : "Unduh CSV"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void runExport("excel")}
                    disabled={exportingFormat !== null}
                    className={dropdownItemClass}
                  >
                    <Files className={`h-4 w-4 ${dropdownIconClass}`} />
                    {exportingFormat === "excel" ? "Menyiapkan Excel..." : "Unduh Excel"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void runExport("pdf")}
                    disabled={exportingFormat !== null}
                    className={dropdownItemClass}
                  >
                    <TableProperties className={`h-4 w-4 ${dropdownIconClass}`} />
                    {exportingFormat === "pdf" ? "Menyiapkan PDF..." : "Unduh PDF"}
                  </button>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => void handleDeletePosts(selectedPosts)}
                disabled={activeSelectedPostIds.length === 0 || deletingPostIds.length > 0}
                className="border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs font-semibold h-9 rounded-xl"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Hapus
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={tableCardClass}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className={tableHeaderClass}>
                <th className="px-4 py-4 text-center w-12">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleVisibleSelection}
                    aria-label="Pilih semua hasil yang tampil"
                    className={`h-4 w-4 rounded ${tableCheckboxSurfaceClass} ${accentCheckboxClass}`}
                  />
                </th>
                <th className="px-6 py-4">Akun</th>
                <th className="px-6 py-4">Platform</th>
                <th className="px-6 py-4">Isi Postingan</th>
                <th className="px-6 py-4 text-right">Komentar</th>
                <th className="px-6 py-4 text-right">Engagement</th>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className={tableBodyClass}>
              {apiLoading && (
                <tr>
                  <td colSpan={8} className={`px-6 py-10 text-center text-xs ${tableMutedTextClass}`}>
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                    Memuat hasil scraping dari backend...
                  </td>
                </tr>
              )}

              {!apiLoading &&
                sortedPosts.map((post) => {
                  const engagement = post.likes + post.comments + post.shares;

                  return (
                    <tr key={post.id} className={tableRowClass}>
                      <td className="px-4 py-4 text-center align-top">
                        <input
                          type="checkbox"
                          checked={activeSelectedPostIds.includes(post.id)}
                          onChange={() => togglePostSelection(post.id)}
                          aria-label={`Pilih hasil scraping ${post.username ?? "unknown"}`}
                          className={`mt-1 h-4 w-4 rounded ${tableCheckboxSurfaceClass} ${accentCheckboxClass}`}
                        />
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="space-y-1">
                          <p className={`font-semibold ${tablePrimaryTextClass}`}>@{post.username ?? "unknown"}</p>
                          <a
                            href={post.url}
                            target="_blank"
                            rel="noreferrer"
                            className={`text-[11px] hover:underline break-all ${accentLinkClass}`}
                          >
                            {post.url}
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        {(() => {
                          const platform = (post.platform ?? "").toLowerCase();
                          let badgeStyle = defaultPlatformBadgeClass;
                          if (platform === "youtube") {
                            badgeStyle = "bg-red-500/10 border border-red-500/20 text-red-400";
                          } else if (platform === "tiktok") {
                            badgeStyle = "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400";
                          } else if (platform === "instagram") {
                            badgeStyle = "bg-pink-500/10 border border-pink-500/20 text-pink-400";
                          } else if (platform === "facebook") {
                            badgeStyle = "bg-blue-500/10 border border-blue-500/20 text-blue-400";
                          }

                          return (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${badgeStyle}`}>
                              {post.platform}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 max-w-md align-top">
                        <p className="line-clamp-3 leading-relaxed" title={post.content ?? ""}>
                          {post.content || "Konten postingan tidak tersedia."}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right font-medium align-top">
                        {post.comments.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right font-medium align-top">
                        <div className="flex flex-col items-end">
                          <span className={`font-bold ${tablePrimaryTextClass}`}>{engagement.toLocaleString()}</span>
                          <span className={`text-[10px] ${tableMutedTextClass}`}>
                            {post.likes} likes · {post.shares} shares
                          </span>
                        </div>
                      </td>
                      <td className={`px-6 py-4 text-xs align-top whitespace-nowrap ${tableDateTextClass}`}>
                        {new Date(post.posted_at ?? post.created_at).toLocaleDateString("id-ID", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 text-center align-top">
                        <div className="flex items-center justify-center gap-1">
                          <a
                            href={post.url}
                            target="_blank"
                            rel="noreferrer"
                            title="Buka postingan asli"
                            className={externalActionClass}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                          <button
                            onClick={() => handleViewComments(post)}
                            title="Lihat komentar"
                            className={`p-1 rounded ${actionIconBaseClass} transition-colors ${accentHoverClass}`}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => void handleDeletePosts([post])}
                            title="Hapus hasil scraping"
                            disabled={deletingPostIds.includes(post.id)}
                            className={deleteActionClass}
                          >
                            {deletingPostIds.includes(post.id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

              {!apiLoading && sortedPosts.length === 0 && (
                <tr>
                  <td colSpan={8} className={`px-6 py-12 text-center text-xs ${emptyStateClass}`}>
                    {isEmbedded
                      ? "Belum ada hasil scraping yang cocok dengan filter. Tempel URL di panel atas untuk mulai mengambil data pertama."
                      : <><span>Belum ada hasil scraping yang cocok dengan filter. Klik </span><strong>Scrape URL</strong><span> untuk mulai mengambil data.</span></>}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {!isEmbedded && (
        <Dialog isOpen={isScrapeOpen} onClose={handleCloseScrape}>
          <DialogContent onClose={handleCloseScrape} className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Link2 className={`h-4 w-4 ${accentTextClass}`} /> Scrape URL Media Sosial
              </DialogTitle>
              <DialogDescription>
                Tempel URL YouTube, TikTok, Instagram, atau Facebook. Link postingan maupun link profil akun publik sama-sama didukung.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleScrapeSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">
                  URL Media Sosial
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
                  {scrapeStatus === "success" ? "Tutup" : "Batal"}
                </Button>
                {scrapeStatus !== "success" && (
                  <Button
                    type="submit"
                    className={accentButtonClass}
                    disabled={scrapeStatus === "loading"}
                  >
                    {scrapeStatus === "loading" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-1" /> Scraping...
                      </>
                    ) : (
                      <>
                        <Link2 className="h-4 w-4 mr-1" /> Mulai Scrape
                      </>
                    )}
                  </Button>
                )}
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      <Dialog isOpen={!!commentsPost} onClose={handleCloseComments}>
        <DialogContent onClose={handleCloseComments} className={commentsDialogClass}>
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${commentsDialogTitleClass}`}>
              <MessageSquare className={`h-4 w-4 ${accentTextClass}`} />
              Komentar - @{commentsPost?.username ?? ""}
              <span className={`text-xs font-normal ${commentsDialogMetaClass}`}>
                {commentsPost?.platform}
              </span>
            </DialogTitle>
            <DialogDescription>
              {commentsLoading
                ? "Memuat komentar dari database..."
                : commentsError
                ? commentsError
                : `${comments.length} komentar ditemukan • Positif ${activeCommentSentiments.positive} • Netral ${activeCommentSentiments.neutral} • Negatif ${activeCommentSentiments.negative}`}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0 max-h-[55vh]">
            {commentsLoading && (
              <div className={`flex items-center justify-center py-10 text-sm ${commentsLoadingClass}`}>
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Memuat komentar...
              </div>
            )}

            {!commentsLoading && commentsError && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-3">
                <XCircle className="h-4 w-4 shrink-0" /> {commentsError}
              </div>
            )}

            {!commentsLoading && !commentsError && comments.length === 0 && (
              <div className={`text-center py-10 text-sm ${commentsLoadingClass}`}>
                Tidak ada komentar yang tersimpan untuk hasil scraping ini.
              </div>
            )}

            {!commentsLoading &&
              comments.map((comment, index) => (
                <div
                  key={comment.id ?? index}
                  className={`rounded-xl border p-3 space-y-1 ${
                    comment.parent !== "root"
                      ? commentCardReplyClass
                      : commentCardRootClass
                  }`}
                >
                  {(() => {
                    const sentiment = detectSentiment(comment.text);
                    return (
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-semibold ${commentAuthorClass}`}>
                            {comment.author ?? "Anonymous"}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              sentiment === "positive"
                                ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                                : sentiment === "negative"
                                ? "bg-red-500/10 text-red-300 border border-red-500/20"
                                : commentNeutralBadgeClass
                            }`}
                          >
                            {getSentimentLabel(sentiment)}
                          </span>
                        </div>
                        {comment.timestamp && (
                          <span className={`text-[10px] ${commentTimestampClass}`}>
                            {new Date(comment.timestamp * 1000).toLocaleDateString("id-ID", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                  <div className="flex items-center gap-2 flex-wrap">
                    {typeof comment.like_count === "number" && comment.like_count > 0 && (
                      <span className={`text-[10px] ${commentLikesClass}`}>
                        {comment.like_count.toLocaleString()} likes komentar
                      </span>
                    )}
                  </div>
                  <p className={`text-sm ${commentTextClass}`}>{comment.text}</p>
                </div>
              ))}
          </div>

          <DialogFooter className={commentsFooterClass}>
            <Button
              variant="outline"
              onClick={handleCloseComments}
              className={dialogSecondaryButtonClass}
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}