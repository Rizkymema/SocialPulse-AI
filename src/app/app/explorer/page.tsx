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
  XCircle,
} from "lucide-react";
import type { ExportPost } from "@/lib/exportTypes";
import {
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
import { useSaaSStore } from "@/store/useSaaSStore";

export default function DataExplorerPage() {
  const { addNotification } = useSaaSStore();

  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");

  const [isScrapeOpen, setIsScrapeOpen] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scrapeStatus, setScrapeStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [scrapeMessage, setScrapeMessage] = useState("");

  const [apiPosts, setApiPosts] = useState<ScrapedPost[]>([]);
  const [apiLoading, setApiLoading] = useState(true);

  const [commentsPost, setCommentsPost] = useState<{
    id: string;
    username: string;
    platform: string;
  } | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState("");

  useEffect(() => {
    getPosts({ size: 100 })
      .then((res) => setApiPosts(res.items))
      .catch(() => setApiPosts([]))
      .finally(() => setApiLoading(false));
  }, []);

  const reloadApiPosts = useCallback(() => {
    getPosts({ size: 100 })
      .then((res) => setApiPosts(res.items))
      .catch(() => setApiPosts([]));
  }, []);

  const handleScrapeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scrapeUrl.trim()) return;

    setScrapeStatus("loading");
    setScrapeMessage("Mengirim URL ke backend...");

    try {
      const job = await submitScrapeJob(scrapeUrl.trim());
      setScrapeMessage(`Job dibuat (${job.platform}). Scraping...`);

      const result = await pollScrapeJob(job.job_id, (status) => {
        setScrapeMessage(`Status: ${status}...`);
      });

      if (result.status === "completed" && result.result) {
        setScrapeStatus("success");
        setScrapeMessage(
          `Berhasil mengambil data dari ${result.result.platform} milik @${result.result.username ?? "unknown"}.`
        );
        addNotification(
          `Scraping selesai: ${result.result.username ?? scrapeUrl} (${result.result.platform})`
        );
        reloadApiPosts();
      } else {
        setScrapeStatus("error");
        setScrapeMessage(result.error_message ?? "Scraping gagal.");
      }
    } catch (err: unknown) {
      setScrapeStatus("error");
      setScrapeMessage(
        err instanceof Error ? err.message : "Terjadi kesalahan saat scraping."
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

  const exportRows: ExportPost[] = sortedPosts.map((post) => ({
    id: post.id,
    platform: post.platform as ExportPost["platform"],
    username: post.username ?? "unknown",
    content: post.content ?? "",
    likes: post.likes,
    comments: post.comments,
    shares: post.shares,
    timestamp: post.posted_at ?? post.created_at,
    sentiment: "neutral",
  }));

  const handleExportCSV = () => {
    if (exportRows.length === 0) {
      alert("Belum ada data scraping untuk diunduh.");
      return;
    }

    exportToCSV(exportRows, "hasil_scraping_socialpulse.csv");
    addNotification(`Berhasil mengunduh ${exportRows.length} data ke CSV.`);
  };

  const handleExportExcel = () => {
    if (exportRows.length === 0) {
      alert("Belum ada data scraping untuk diunduh.");
      return;
    }

    exportToExcel(exportRows, "Hasil Scraping", "hasil_scraping_socialpulse.xlsx");
    addNotification(`Berhasil mengunduh ${exportRows.length} data ke Excel.`);
  };

  const handleExportPDF = () => {
    if (exportRows.length === 0) {
      alert("Belum ada data scraping untuk diunduh.");
      return;
    }

    exportToPDF(
      exportRows,
      "Hasil Scraping",
      `Export ${exportRows.length} data hasil scraping media sosial.`,
      "hasil_scraping_socialpulse.pdf"
    );
    addNotification("Berhasil membuat file PDF hasil scraping.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Scraper & Hasil Data
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            Gunakan halaman ini untuk scraping URL media sosial, melihat isi postingan dan komentar yang berhasil diambil, lalu mengunduh hasilnya.
          </p>
        </div>

        <div className="flex gap-2 w-full xl:w-auto">
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
              <Download className="h-4 w-4" /> Download Hasil
            </Button>
            <div className="absolute right-0 top-10 hidden group-hover:block hover:block bg-[#09090b] border border-zinc-800 rounded-xl p-2 shadow-2xl z-40 w-44">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg w-full text-left"
              >
                <FileDown className="h-4 w-4 text-zinc-500" /> Download CSV
              </button>
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg w-full text-left"
              >
                <Files className="h-4 w-4 text-zinc-500" /> Download Excel
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg w-full text-left"
              >
                <TableProperties className="h-4 w-4 text-zinc-500" /> Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="bg-[#09090b]/80 border-zinc-900 lg:col-span-2">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wider text-indigo-400 font-semibold mb-2">
              Cara Pakai
            </p>
            <div className="grid gap-3 md:grid-cols-3 text-sm">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                <p className="font-semibold text-white mb-1">1. Tempel URL</p>
                <p className="text-zinc-400">Masukkan link Instagram, TikTok, YouTube, atau Facebook yang ingin di-scrape.</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                <p className="font-semibold text-white mb-1">2. Lihat Hasil</p>
                <p className="text-zinc-400">Periksa isi postingan, engagement, tanggal, dan komentar dari hasil scraping.</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                <p className="font-semibold text-white mb-1">3. Download</p>
                <p className="text-zinc-400">Unduh data ke format CSV, Excel, atau PDF untuk analisis lanjutan.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#09090b]/80 border-zinc-900">
          <CardContent className="p-5 space-y-3">
            <p className="text-xs uppercase tracking-wider text-indigo-400 font-semibold">
              Ringkasan Data
            </p>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
              <p className="text-zinc-500 text-xs mb-1">Total hasil scraping</p>
              <p className="text-2xl font-bold text-white">{apiPosts.length}</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
              <p className="text-zinc-500 text-xs mb-1">Data siap diunduh</p>
              <p className="text-2xl font-bold text-white">{sortedPosts.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#09090b]/80 border-zinc-900">
        <CardContent className="p-4 flex flex-col lg:flex-row gap-4 items-center">
          <div className="relative w-full lg:flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari berdasarkan username atau isi postingan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-zinc-950"
            />
          </div>
          <div className="w-full lg:w-44">
            <Select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="bg-zinc-950"
            >
              <option value="all">Semua Platform</option>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="facebook">Facebook</option>
              <option value="youtube">YouTube</option>
            </Select>
          </div>
          <div className="w-full lg:w-52">
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-zinc-950"
            >
              <option value="date-desc">Terbaru</option>
              <option value="date-asc">Terlama</option>
              <option value="engagement-desc">Engagement Tertinggi</option>
              <option value="comments-desc">Komentar Terbanyak</option>
              <option value="likes-desc">Likes Terbanyak</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-950/40 border-zinc-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-900 bg-zinc-950/60 text-zinc-500 font-semibold text-xs uppercase tracking-wider">
                <th className="px-6 py-4">Akun</th>
                <th className="px-6 py-4">Platform</th>
                <th className="px-6 py-4">Isi Postingan</th>
                <th className="px-6 py-4 text-right">Komentar</th>
                <th className="px-6 py-4 text-right">Engagement</th>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {apiLoading && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-zinc-500 text-xs">
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                    Memuat hasil scraping dari backend...
                  </td>
                </tr>
              )}

              {!apiLoading &&
                sortedPosts.map((post) => {
                  const engagement = post.likes + post.comments + post.shares;

                  return (
                    <tr key={post.id} className="hover:bg-zinc-900/30 transition-colors text-zinc-300">
                      <td className="px-6 py-4 align-top">
                        <div className="space-y-1">
                          <p className="font-semibold text-white">@{post.username ?? "unknown"}</p>
                          <a
                            href={post.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-indigo-400 hover:underline break-all"
                          >
                            {post.url}
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-zinc-900 border border-zinc-800 capitalize">
                          {post.platform}
                        </span>
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
                          <span className="text-white font-bold">{engagement.toLocaleString()}</span>
                          <span className="text-[10px] text-zinc-500">
                            {post.likes} likes · {post.shares} shares
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-400 align-top whitespace-nowrap">
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
                            className="p-1 rounded hover:bg-emerald-500/10 text-zinc-500 hover:text-emerald-400 transition-colors"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                          <button
                            onClick={() =>
                              handleViewComments({
                                id: post.id,
                                username: post.username ?? "unknown",
                                platform: post.platform,
                              })
                            }
                            title="Lihat komentar"
                            className="p-1 rounded hover:bg-indigo-500/10 text-zinc-500 hover:text-indigo-400 transition-colors"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

              {!apiLoading && sortedPosts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500 text-xs">
                    Belum ada hasil scraping yang cocok dengan filter. Klik <strong>Scrape URL</strong> untuk mulai mengambil data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog isOpen={isScrapeOpen} onClose={handleCloseScrape}>
        <DialogContent onClose={handleCloseScrape} className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-indigo-400" /> Scrape URL Media Sosial
            </DialogTitle>
            <DialogDescription>
              Tempel URL YouTube, TikTok, Instagram, atau Facebook. Sistem akan mencoba mengambil isi postingan, engagement, dan komentar.
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
                  className="bg-indigo-600 hover:bg-indigo-700"
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

      <Dialog isOpen={!!commentsPost} onClose={handleCloseComments}>
        <DialogContent onClose={handleCloseComments} className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-indigo-400" />
              Komentar - @{commentsPost?.username ?? ""}
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
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Memuat komentar...
              </div>
            )}

            {!commentsLoading && commentsError && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-3">
                <XCircle className="h-4 w-4 shrink-0" /> {commentsError}
              </div>
            )}

            {!commentsLoading && !commentsError && comments.length === 0 && (
              <div className="text-center py-10 text-zinc-500 text-sm">
                Tidak ada komentar yang tersimpan untuk hasil scraping ini.
              </div>
            )}

            {!commentsLoading &&
              comments.map((comment, index) => (
                <div
                  key={comment.id ?? index}
                  className={`rounded-xl border p-3 space-y-1 ${
                    comment.parent !== "root"
                      ? "ml-6 bg-zinc-900/40 border-zinc-800/60"
                      : "bg-zinc-950/60 border-zinc-800"
                  }`}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-white">
                      {comment.author ?? "Anonymous"}
                    </span>
                    {comment.timestamp && (
                      <span className="text-[10px] text-zinc-600 ml-auto">
                        {new Date(comment.timestamp * 1000).toLocaleDateString("id-ID", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed">{comment.text}</p>
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
