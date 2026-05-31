"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Link2,
  CheckCircle2,
  MessageSquare,
  Heart,
  Share2,
  FileDown,
  ChevronDown,
  HelpCircle,
  Cpu,
  Zap,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";

type DemoPlatform = "instagram" | "tiktok" | "youtube" | "facebook" | "all";

// Custom SVG icons for platform logos to avoid lucide-react version compatibility issues
const Instagram = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const Youtube = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17z" />
    <polygon points="10 15 15 12 10 9 10 15" />
  </svg>
);

const Facebook = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

// Mock URLs for the interactive demo
const SAMPLE_URLS: Array<{ url: string; platform: Exclude<DemoPlatform, "all">; user: string }> = [
  { url: "https://www.instagram.com/p/C7xYz9-O1xP/", platform: "instagram", user: "tech_visionary" },
  { url: "https://www.tiktok.com/@creator/video/73123456789", platform: "tiktok", user: "creative_mind" },
  { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", platform: "youtube", user: "music_world" }
];

export default function LandingPage() {
  const [urlInput, setUrlInput] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [detectedPlatform, setDetectedPlatform] = useState<DemoPlatform>("all");
  const [showMockCard, setShowMockCard] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Scraper logs simulating a terminal response
  const [logs, setLogs] = useState<string[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleSelectSample = (sample: typeof SAMPLE_URLS[0]) => {
    setUrlInput(sample.url);
    setDetectedPlatform(sample.platform);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUrlInput(val);
    if (val.toLowerCase().includes("instagram.com")) {
      setDetectedPlatform("instagram");
    } else if (val.toLowerCase().includes("tiktok.com")) {
      setDetectedPlatform("tiktok");
    } else if (val.toLowerCase().includes("youtube.com") || val.toLowerCase().includes("youtu.be")) {
      setDetectedPlatform("youtube");
    } else if (val.toLowerCase().includes("facebook.com")) {
      setDetectedPlatform("facebook");
    } else {
      setDetectedPlatform("all");
    }
  };

  const runSimulation = () => {
    if (!urlInput.trim()) return;

    setIsScraping(true);
    setShowMockCard(false);
    setLogs([]);

    const steps = [
      { text: "⚡ Menginisialisasi headless browser & engine scraper...", delay: 800 },
      { text: `🔗 Menghubungkan ke URL target (${detectedPlatform !== "all" ? detectedPlatform.toUpperCase() : "Platform Terdeteksi"})...`, delay: 1000 },
      { text: "📥 Mengunduh konten utama postingan & metadata engagement...", delay: 1200 },
      { text: "💬 Menarik data komentar publik (termasuk reply thread)...", delay: 1000 },
      { text: "🤖 Menganalisis kata kunci, sentimen, dan statistik komentar...", delay: 900 },
      { text: "✨ Sukses! 1,842 baris komentar berhasil di-scrape dan disinkronkan.", delay: 600 }
    ];

    let currentStep = 0;
    const executeStep = () => {
      if (currentStep < steps.length) {
        setLogs((prev) => [...prev, steps[currentStep].text]);
        
        setTimeout(() => {
          currentStep++;
          executeStep();
        }, steps[currentStep].delay);
      } else {
        setIsScraping(false);
        setShowMockCard(true);
      }
    };

    executeStep();
  };

  const faqs = [
    {
      q: "Apakah SocialPulse AI gratis untuk digunakan?",
      a: "Ya! SocialPulse AI saat ini sepenuhnya gratis dan semua fitur scraping, filter, serta pengunduhan data (CSV, Excel, PDF) terbuka penuh tanpa batasan kuota."
    },
    {
      q: "Platform media sosial apa saja yang didukung oleh scraper ini?",
      a: "Saat ini SocialPulse AI mendukung penarikan data dari tautan publik Instagram, TikTok, YouTube, dan Facebook. Cukup tempel URL postingan, reels, atau video untuk memulai."
    },
    {
      q: "Apakah saya harus membuat akun atau melakukan login?",
      a: "Sama sekali tidak! Sesuai komitmen kemudahan kami, Anda bisa langsung mengakses dashboard scraper dan mulai mengolah data media sosial secara instan tanpa proses pendaftaran atau login."
    },
    {
      q: "Bagaimana cara mengekspor hasil data yang sudah di-scrape?",
      a: "Di dalam Dashboard Explorer, kami menyediakan tombol 'Download Hasil' yang memungkinkan Anda mengunduh data postingan beserta komentarnya ke dalam file Microsoft Excel (.xlsx), dokumen CSV koma-terpisah (.csv), atau dokumen Laporan PDF (.pdf)."
    },
    {
      q: "Apakah data yang ditarik aman dan legal?",
      a: "SocialPulse AI hanya mengumpulkan data publik yang tersedia secara bebas di platform media sosial tanpa menembus dinding keamanan atau akun privat. Kami tidak mengumpulkan data pribadi sensitif milik pengguna."
    }
  ];

  return (
    <div className="min-h-screen bg-[#030303] text-[#f4f4f5] relative overflow-hidden grid-bg">
      {/* Glow Effects */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] glow-violet pointer-events-none rounded-full" />
      <div className="absolute top-[40%] left-[-20%] w-[60%] h-[60%] glow-indigo pointer-events-none rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] glow-violet pointer-events-none rounded-full" />

      {/* Floating Navbar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#030303]/60 backdrop-blur-md border-b border-white/5 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-indigo-600 shadow-md shadow-indigo-500/20">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-md font-bold tracking-tight text-white">
              SocialPulse <span className="text-indigo-400">AI</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8 text-sm text-zinc-400">
            <a href="#fitur" className="hover:text-white transition-colors duration-200">Fitur Utama</a>
            <a href="#demo" className="hover:text-white transition-colors duration-200">Demo Interaktif</a>
            <a href="#workflow" className="hover:text-white transition-colors duration-200">Cara Kerja</a>
            <a href="#faq" className="hover:text-white transition-colors duration-200">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/app/explorer">
              <Button
                variant="primary"
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 font-semibold shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/30"
              >
                Buka Dashboard <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 text-xs font-semibold uppercase tracking-wider"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Scraper Media Sosial Tanpa Batas & Instan
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.1]"
          >
            Ekstrak Data Postingan & Komentar{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              Media Sosial
            </span>{" "}
            Secara Instan
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed"
          >
            Tempel URL postingan Instagram, TikTok, YouTube, atau Facebook. Tarik isi konten, metrik keterlibatan, dan komentar publik lengkap, lalu unduh ke Excel, CSV, atau PDF.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4"
          >
            <Link href="/app/explorer">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 font-semibold shadow-lg shadow-indigo-600/30">
                Mulai Scraping Gratis <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
            <a href="#demo">
              <Button variant="outline" size="lg" className="border-zinc-800 hover:bg-zinc-900 font-medium">
                Coba Demo Dulu
              </Button>
            </a>
          </motion.div>
        </div>

        {/* Dashboard Visual Teaser */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-16 rounded-2xl border border-white/5 bg-[#09090b]/70 backdrop-blur-md p-2 shadow-2xl relative"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent rounded-2xl pointer-events-none" />
          <div className="rounded-xl border border-white/5 overflow-hidden bg-zinc-950/40 relative">
            <div className="flex h-10 items-center justify-between px-4 border-b border-white/5 bg-zinc-900/30 text-xs text-zinc-500">
              <div className="flex space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/50" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <span className="w-3 h-3 rounded-full bg-green-500/50" />
              </div>
              <span className="font-mono">socialpulse-dashboard-preview</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live System
              </span>
            </div>
            
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-white">Scraper & Hasil Data</h3>
                  <p className="text-xs text-zinc-500">Dashboard UI tempat Anda mengelola URL scraping dan mengekspor data.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                    Semua Fitur Terbuka
                  </span>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    Ekspor Excel/PDF
                  </span>
                </div>
              </div>

              {/* Minimalist Graphic Dashboard Element */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="border border-white/5 rounded-xl p-4 bg-zinc-900/20">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Total Post Scraped</p>
                  <p className="text-3xl font-extrabold text-white mt-1">1,248</p>
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-indigo-500 w-[78%]" />
                  </div>
                </div>
                <div className="border border-white/5 rounded-xl p-4 bg-zinc-900/20">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Komentar Diproses</p>
                  <p className="text-3xl font-extrabold text-white mt-1">84,912</p>
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-purple-500 w-[64%]" />
                  </div>
                </div>
                <div className="border border-white/5 rounded-xl p-4 bg-zinc-900/20">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Rasio Keberhasilan</p>
                  <p className="text-3xl font-extrabold text-white mt-1">99.8%</p>
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[99.8%]" />
                  </div>
                </div>
              </div>

              <div className="border border-white/5 rounded-xl overflow-hidden bg-zinc-950/60 text-xs">
                <div className="grid grid-cols-4 p-3 border-b border-white/5 bg-zinc-900/40 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                  <div>Platform</div>
                  <div>Akun & Link</div>
                  <div className="text-right">Likes / Keterlibatan</div>
                  <div className="text-center">Status</div>
                </div>
                <div className="grid grid-cols-4 p-3.5 border-b border-white/5 text-zinc-300">
                  <div className="flex items-center gap-1.5 font-semibold text-white">
                    <span className="w-2 h-2 rounded-full bg-pink-500" /> Instagram
                  </div>
                  <div>@brand_agency_id</div>
                  <div className="text-right font-semibold text-white">12,482 Likes</div>
                  <div className="text-center text-emerald-400 font-semibold bg-emerald-500/10 rounded py-0.5 max-w-[80px] mx-auto">Selesai</div>
                </div>
                <div className="grid grid-cols-4 p-3.5 text-zinc-300">
                  <div className="flex items-center gap-1.5 font-semibold text-white">
                    <span className="w-2 h-2 rounded-full bg-red-500" /> YouTube
                  </div>
                  <div>@indonesia_tech</div>
                  <div className="text-right font-semibold text-white">45,190 Likes</div>
                  <div className="text-center text-emerald-400 font-semibold bg-emerald-500/10 rounded py-0.5 max-w-[80px] mx-auto">Selesai</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Trust & Platforms Section */}
      <section className="py-12 border-y border-white/5 bg-zinc-950/30 relative z-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-6">Platform Media Sosial yang Didukung</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 justify-items-center items-center opacity-70">
            <div className="flex items-center space-x-2 text-zinc-400 hover:text-white transition-colors duration-200">
              <Instagram className="h-5 w-5 text-pink-500" />
              <span className="font-semibold text-sm">Instagram Post & Reels</span>
            </div>
            <div className="flex items-center space-x-2 text-zinc-400 hover:text-white transition-colors duration-200">
              <Youtube className="h-5 w-5 text-red-500" />
              <span className="font-semibold text-sm">YouTube Videos & Shorts</span>
            </div>
            <div className="flex items-center space-x-2 text-zinc-400 hover:text-white transition-colors duration-200">
              <Facebook className="h-5 w-5 text-blue-500" />
              <span className="font-semibold text-sm">Facebook Posts</span>
            </div>
            <div className="flex items-center space-x-2 text-zinc-400 hover:text-white transition-colors duration-200">
              <Zap className="h-5 w-5 text-yellow-500" />
              <span className="font-semibold text-sm">TikTok Videos (Instant)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Fitur Utama Section */}
      <section id="fitur" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">Semua Fitur Pro Tanpa Biaya Berlangganan</h2>
          <p className="text-zinc-400 text-sm sm:text-base">Kami membekali Anda dengan alat analisis terbaik untuk melakukan ekstraksi data media sosial secara efisien.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-white/5 bg-[#09090b]/80 p-6 space-y-4 hover:border-indigo-500/20 transition-all duration-300 group">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <Cpu className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">Scraper Handal & Cepat</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">Masukkan tautan apa pun dan engine kami akan memproses penarikan data secara asynchronous, meminimalkan error dan memaksimalkan kecepatan transfer.</p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#09090b]/80 p-6 space-y-4 hover:border-purple-500/20 transition-all duration-300 group">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <MessageSquare className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">Ekstraksi Komentar Detail</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">Tarik semua komentar publik beserta dengan detail nama pengguna pengirim, pesan lengkap, tanggal pengiriman, dan struktur balasan komentarnya.</p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#09090b]/80 p-6 space-y-4 hover:border-pink-500/20 transition-all duration-300 group">
            <div className="h-10 w-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
              <FileDown className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">Ekspor Multi-Format</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">Unduh hasil scraping ke file Excel untuk pivot, CSV untuk kebutuhan database, atau format PDF resmi yang rapi untuk langsung dibagikan ke tim Anda.</p>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="demo" className="py-20 bg-zinc-950/40 border-y border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12 items-center">
            {/* Demo Description */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 text-xs font-semibold">
                <Zap className="h-3 w-3" /> Uji Coba Simulasi
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">Rasakan Kecepatannya Secara Langsung</h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Pilih salah satu contoh URL di bawah ini atau ketikkan sendiri, lalu tekan tombol scrape. Lihat bagaimana sistem kami merayapi data target dan menganalisis metrik interaksi secara real-time.
              </p>
              
              <div className="space-y-2">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Gunakan Contoh Cepat:</p>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_URLS.map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectSample(sample)}
                      disabled={isScraping}
                      className="px-3 py-1.5 text-xs rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all capitalize flex items-center gap-1.5"
                    >
                      {sample.platform === "instagram" && <Instagram className="h-3 w-3 text-pink-400" />}
                      {sample.platform === "tiktok" && <Zap className="h-3 w-3 text-yellow-400" />}
                      {sample.platform === "youtube" && <Youtube className="h-3 w-3 text-red-400" />}
                      Demo {sample.platform}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Interactive Widget */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-white/5 bg-[#09090b]/80 p-5 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                    Simulasi Penarikan URL
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">socialpulse_interactive_preview</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Link2 className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                    <input
                      type="url"
                      placeholder="Masukkan URL postingan media sosial..."
                      value={urlInput}
                      onChange={handleUrlChange}
                      disabled={isScraping}
                      className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-850 rounded-lg text-sm text-[#f4f4f5] focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
                    />
                  </div>
                  <Button
                    onClick={runSimulation}
                    disabled={isScraping || !urlInput.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 font-semibold px-6"
                  >
                    {isScraping ? "Memproses..." : "Scrape"}
                  </Button>
                </div>

                {/* Scraper Logs Terminal */}
                {(isScraping || logs.length > 0) && (
                  <div className="rounded-lg border border-zinc-900 bg-zinc-950 p-4 font-mono text-[11px] leading-relaxed text-zinc-400">
                    <p className="text-zinc-500 border-b border-zinc-900 pb-2 mb-2 flex justify-between items-center">
                      <span>🖥️ LOGS TRANSMISI API</span>
                      {isScraping && <span className="animate-pulse text-indigo-400">CONNECTING...</span>}
                    </p>
                    <div ref={logContainerRef} className="max-h-[140px] overflow-y-auto space-y-1.5 scrollbar-thin">
                      {logs.map((log, index) => (
                        <div key={index} className="flex gap-2">
                          <span className="text-zinc-600">[{index + 1}]</span>
                          <span className={index === logs.length - 1 && isScraping ? "text-white font-medium" : ""}>{log}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Scraped Mock Post Card */}
                <AnimatePresence>
                  {showMockCard && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="rounded-xl border border-white/10 bg-zinc-900/50 p-5 space-y-4 hover-glow transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center font-bold text-white text-xs">
                            SP
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white flex items-center gap-1.5">
                              @{detectedPlatform === "instagram" ? "tech_visionary" : detectedPlatform === "tiktok" ? "creative_mind" : detectedPlatform === "youtube" ? "music_world" : "unknown_creator"}
                              <span className="text-[9px] font-normal uppercase bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/10 capitalize">
                                {detectedPlatform}
                              </span>
                            </p>
                            <p className="text-[10px] text-zinc-500">Hasil Simulasi Scrape · Baru Saja</p>
                          </div>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          Selesai
                        </span>
                      </div>

                      <p className="text-xs text-zinc-300 leading-relaxed">
                        Teknologi AI saat ini berkembang sangat cepat! SocialPulse AI membantu saya memetakan opini publik dari ribuan komentar postingan dalam sekejap. Platform ini luar biasa efisien dan mudah digunakan! 🚀 #AI #Analytics
                      </p>

                      <div className="flex items-center gap-4 text-[11px] text-zinc-400 border-t border-zinc-850 pt-3">
                        <span className="flex items-center gap-1 text-pink-400 font-semibold">
                          <Heart className="h-3.5 w-3.5 fill-pink-500/10" /> 12,482 Likes
                        </span>
                        <span className="flex items-center gap-1 text-indigo-400 font-semibold">
                          <MessageSquare className="h-3.5 w-3.5" /> 1,842 Komentar
                        </span>
                        <span className="flex items-center gap-1 text-zinc-400">
                          <Share2 className="h-3.5 w-3.5" /> 4,120 Shares
                        </span>
                      </div>

                      {/* Mock Comments Preview */}
                      <div className="space-y-2 border-t border-zinc-850 pt-3">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Preview Komentar Teratas:</p>
                        <div className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-2.5 space-y-2">
                          <div className="text-xs">
                            <span className="font-bold text-white mr-1">@budi_santoso:</span>
                            <span className="text-zinc-300">Ini sangat membantu untuk riset kompetitor bisnis saya. Keren banget!</span>
                          </div>
                          <div className="text-xs">
                            <span className="font-bold text-white mr-1">@siti_ramlah:</span>
                            <span className="text-zinc-300">Sistem analisis sentimennya berjalan secara realtime. Sangat direkomendasikan.</span>
                          </div>
                        </div>
                      </div>

                      {/* Action to Dashboard */}
                      <div className="pt-2">
                        <Link href="/app/explorer">
                          <Button className="w-full bg-indigo-600/15 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/20 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2">
                            Buka Dashboard Explorer untuk Mengunduh Hasil Lengkap (Excel/CSV/PDF) <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cara Kerja Section */}
      <section id="workflow" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">3 Langkah Mudah Ekstraksi Data</h2>
          <p className="text-zinc-400 text-sm sm:text-base">Mulai dapatkan insight media sosial Anda dalam hitungan detik tanpa hambatan teknis.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 relative">
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-1/2 left-12 right-12 h-px border-t border-dashed border-zinc-800 -z-10" />

          <div className="rounded-2xl border border-white/5 bg-[#09090b]/80 p-6 space-y-4 text-center relative hover:border-zinc-800 transition-colors">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-md mx-auto shadow-lg shadow-indigo-600/20">
              1
            </div>
            <h3 className="text-lg font-semibold text-white">Salin & Tempel URL</h3>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">Buka platform media sosial, salin tautan postingan publik, lalu tempelkan di kotak input scraper di dashboard kami.</p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#09090b]/80 p-6 space-y-4 text-center relative hover:border-zinc-800 transition-colors">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-md mx-auto shadow-lg shadow-indigo-600/20">
              2
            </div>
            <h3 className="text-lg font-semibold text-white">Scrape Otomatis</h3>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">Sistem engine kami akan memproses URL, mengambil data keterlibatan utama, dan menarik daftar komentar lengkap.</p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#09090b]/80 p-6 space-y-4 text-center relative hover:border-zinc-800 transition-colors">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-md mx-auto shadow-lg shadow-indigo-600/20">
              3
            </div>
            <h3 className="text-lg font-semibold text-white">Unduh Hasil Laporan</h3>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">Unduh data hasil scraping yang rapi ke format CSV untuk diolah, Excel untuk rekapitulasi, atau dokumen PDF resmi.</p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            <HelpCircle className="h-6 w-6 text-indigo-400" /> Tanya Jawab Umum
          </h2>
          <p className="text-zinc-400 text-sm">Semua yang perlu Anda ketahui mengenai fungsionalitas dan penggunaan SocialPulse AI.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div
                key={index}
                className="rounded-xl border border-white/5 bg-[#09090b]/80 overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left font-medium text-sm sm:text-base text-white hover:bg-zinc-900/40 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`h-4 w-4 text-zinc-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 text-xs sm:text-sm text-zinc-400 border-t border-white/5 pt-3 leading-relaxed">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pricing / Final CTA Section */}
      <section className="py-20 relative z-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-indigo-950/20 to-zinc-950/80 p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[30%] h-[30%] bg-indigo-500/10 blur-3xl pointer-events-none rounded-full" />
          <div className="absolute bottom-0 left-0 w-[30%] h-[30%] bg-purple-500/10 blur-3xl pointer-events-none rounded-full" />

          <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Mulai Eksplorasi Data Sekarang</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Dapatkan akses langsung ke dashboard penarikan data media sosial kami. Tidak perlu kartu kredit, tidak perlu pendaftaran, langsung siap pakai.
            </p>
            <div className="pt-4">
              <Link href="/app/explorer">
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 font-semibold px-8 shadow-lg shadow-indigo-600/30">
                  Akses Dashboard Gratis <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </Link>
            </div>
            <div className="flex justify-center gap-6 pt-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" /> Tanpa Registrasi</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" /> 100% Gratis</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" /> Akses Instan</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="py-12 border-t border-white/5 bg-zinc-950/60 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-indigo-600">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight text-white">
              SocialPulse <span className="text-indigo-400">AI</span>
            </span>
          </div>

          <p className="text-xs text-zinc-500">
            &copy; {new Date().getFullYear()} SocialPulse AI. Dibuat secara profesional untuk memetakan sentimen dan data publik media sosial.
          </p>

          <div className="flex space-x-4 text-xs text-zinc-500">
            <a href="#fitur" className="hover:text-white transition-colors">Fitur</a>
            <a href="#demo" className="hover:text-white transition-colors">Demo</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <Link href="/app/explorer" className="hover:text-white transition-colors font-semibold text-indigo-400">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}