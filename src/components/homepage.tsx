"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ComponentType } from "react";
import { motion, AnimatePresence, useScroll, useSpring, useTransform } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BarChart3,
  FileSpreadsheet,
  Search,
  Sparkles,
  HelpCircle,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LightRays } from "@/components/ui/light-rays";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { ShinyText } from "@/components/ui/shiny-text";
import { ScraperWorkspace } from "@/components/scraper-workspace";

type ContentCard = {
  title: string;
  description: string;
  icon: LucideIcon;
};

type ThemeMode = "dark" | "light";

type SocialIconProps = {
  className?: string;
};

type SocialLink = {
  label: string;
  href: string;
  icon: ComponentType<SocialIconProps>;
};

const LinkedInIcon = ({ className }: SocialIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M6.94 8.5a1.56 1.56 0 1 1 0-3.12 1.56 1.56 0 0 1 0 3.12ZM5.5 9.75h2.88V18H5.5V9.75Zm4.69 0h2.76v1.13h.04c.38-.73 1.33-1.5 2.73-1.5 2.92 0 3.46 1.92 3.46 4.42V18H16.3v-3.69c0-.88-.02-2.02-1.23-2.02-1.24 0-1.43.97-1.43 1.96V18h-2.87V9.75Z" />
  </svg>
);

const InstagramIcon = ({ className }: SocialIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect x="3.25" y="3.25" width="17.5" height="17.5" rx="5.25" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" stroke="none" />
  </svg>
);

const GitHubIcon = ({ className }: SocialIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 .75a11.25 11.25 0 0 0-3.56 21.92c.56.1.76-.24.76-.54v-2.1c-3.1.68-3.76-1.49-3.76-1.49-.5-1.3-1.25-1.64-1.25-1.64-1.03-.7.08-.68.08-.68 1.13.08 1.73 1.16 1.73 1.16 1.02 1.72 2.66 1.22 3.3.94.1-.74.4-1.22.72-1.5-2.47-.28-5.07-1.24-5.07-5.5 0-1.22.44-2.22 1.15-3-.12-.28-.5-1.42.1-2.96 0 0 .95-.3 3.1 1.14a10.62 10.62 0 0 1 5.65 0c2.14-1.44 3.08-1.14 3.08-1.14.62 1.54.24 2.68.12 2.96.72.78 1.15 1.78 1.15 3 0 4.27-2.6 5.21-5.08 5.5.41.35.77 1.03.77 2.08v3.08c0 .3.2.65.77.54A11.25 11.25 0 0 0 12 .75Z" />
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.12v12.18a2.6 2.6 0 1 1-2.6-2.6c.24 0 .47.03.69.09V8.5a5.74 5.74 0 1 0 5.03 5.68V8.07a7.9 7.9 0 0 0 4.58 1.46V6.69h-.81Z" />
  </svg>
);

const ThemeSunIcon = ({ className }: SocialIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.75v2.1" />
    <path d="M12 19.15v2.1" />
    <path d="m4.76 4.76 1.49 1.49" />
    <path d="m17.75 17.75 1.49 1.49" />
    <path d="M2.75 12h2.1" />
    <path d="M19.15 12h2.1" />
    <path d="m4.76 19.24 1.49-1.49" />
    <path d="m17.75 6.25 1.49-1.49" />
  </svg>
);

const ThemeMoonIcon = ({ className }: SocialIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M20.92 14.08A8.75 8.75 0 0 1 9.92 3.08a.65.65 0 0 0-.8-.8A9.74 9.74 0 1 0 21.72 14.88a.65.65 0 0 0-.8-.8Z" />
  </svg>
);

const heroMetrics = [
  {
    value: "4+",
    label: "Platform Publik",
    caption: "YouTube, TikTok, Instagram, dan Facebook didukung dalam satu alur scraping.",
  },
  {
    value: "Live",
    label: "Komentar + Sentimen",
    caption: "Analisis sentimen instan dan peninjauan komentar langsung di permukaan utama.",
  },
  {
    value: "3",
    label: "Format Ekspor",
    caption: "Unduh dataset hasil scrape yang bersih ke format CSV, Excel, atau PDF.",
  },
];

const socialLinks: SocialLink[] = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/rizky-oktavian-teddy-mema-947336370?utm_source=share_via&utm_content=profile&utm_medium=member_android",
    icon: LinkedInIcon,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/rizkymema?igsh=cGJ5NjBuZm41NXc2",
    icon: InstagramIcon,
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@rizkymema?_r=1&_t=ZS-96lBF3ty06i",
    icon: TikTokIcon,
  },
  {
    label: "GitHub",
    href: "https://github.com/Rizkymema",
    icon: GitHubIcon,
  },
];

// Removed unused content card declarations to clean up the codebase.

const processSteps: ContentCard[] = [
  {
    title: "Paste URL Publik",
    description:
      "Masukkan link postingan atau profil publik. Deteksi platform berjalan otomatis dari backend secara instan.",
    icon: Search,
  },
  {
    title: "Tinjau Hasil & Sentimen",
    description:
      "Begitu scraping selesai, konten, jumlah engagement, daftar komentar, dan metadata analisis sentimen langsung terisi.",
    icon: BarChart3,
  },
  {
    title: "Kurasi Lalu Ekspor",
    description:
      "Pilih item yang ingin Anda simpan, hapus data sampah, lalu unduh dataset bersih ke format file yang Anda butuhkan.",
    icon: FileSpreadsheet,
  },
];

const faqs = [
  {
    question: "Apakah saya masih bisa memakai explorer lama?",
    answer:
      "Bisa. Explorer lama tetap ada sebagai route arsip hasil, tetapi alur utama scraping sekarang dipusatkan secara seamless dari beranda.",
  },
  {
    question: "Apakah fitur export lama berubah?",
    answer:
      "Tidak berubah. CSV, Excel, dan PDF tetap tersedia, hanya sekarang Anda bisa memulai scrape dan memilih hasil yang ingin diekspor langsung dari beranda.",
  },
  {
    question: "Apakah URL profil ikut didukung di beranda baru ini?",
    answer:
      "Ya. Untuk saat ini beranda memakai backend yang sama dengan dukungan profil publik YouTube, TikTok, Instagram, dan Facebook yang sudah ditambahkan sebelumnya.",
  },
  {
    question: "Apakah beranda baru ini hanya tampilan mock atau memanggil backend nyata?",
    answer:
      "Ini memakai komponen workspace yang sama dengan explorer, jadi scraping, hapus hasil, pemilihan data, komentar, dan export berjalan pada flow nyata dengan API backend Anda.",
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 35 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.7, ease: [0.21, 1, 0.36, 1] as const },
};

const revealWithDelay = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { delay, duration: 0.6, ease: [0.21, 1, 0.36, 1] as const },
});

export default function Homepage() {
  const heroRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const quoteRef = useRef<HTMLElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>("dark");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("socialpulse-home-theme");

    const preferredTheme =
      savedTheme === "light" || savedTheme === "dark"
        ? savedTheme
        : window.matchMedia("(prefers-color-scheme: light)").matches
          ? "light"
          : "dark";

    if (preferredTheme === "dark") {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setTheme("light");
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem("socialpulse-home-theme", theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const { scrollYProgress: heroScrollProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const { scrollYProgress: quoteScrollProgress } = useScroll({
    target: quoteRef,
    offset: ["start 0.92", "end 0.3"],
  });

  const smoothHeroProgress = useSpring(heroScrollProgress, {
    stiffness: 120,
    damping: 26,
    mass: 0.32,
  });

  const smoothQuoteProgress = useSpring(quoteScrollProgress, {
    stiffness: 110,
    damping: 24,
    mass: 0.34,
  });

  // Parallax translations for background glows
  const yBg = useTransform(scrollYProgress, [0, 1], [-80, 80]);
  const yBgSecond = useTransform(scrollYProgress, [0, 1], [50, -50]);

  const heroBadgeY = useTransform(smoothHeroProgress, [0, 1], [0, -12]);
  const heroTitleY = useTransform(smoothHeroProgress, [0, 1], [0, -48]);
  const heroTitleOpacity = useTransform(smoothHeroProgress, [0, 0.85], [1, 0.58]);
  const heroCopyY = useTransform(smoothHeroProgress, [0, 1], [0, -24]);
  const heroCopyOpacity = useTransform(smoothHeroProgress, [0, 0.85], [1, 0.68]);

  const quoteY = useTransform(smoothQuoteProgress, [0, 0.5, 1], [44, 0, -8]);
  const quoteOpacity = useTransform(smoothQuoteProgress, [0, 0.28, 1], [0.45, 1, 1]);

  const isLightTheme = theme === "light";
  const pageBackground = isLightTheme
    ? "radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.10), transparent 38%), radial-gradient(circle at 0% 28%, rgba(56, 189, 248, 0.12), transparent 30%), linear-gradient(180deg, #ffffff 0%, #f7faff 44%, #eef4ff 100%)"
    : "radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.15), transparent 45%), radial-gradient(circle at 100% 30%, rgba(139, 92, 246, 0.08), transparent 40%), linear-gradient(180deg, #05070f 0%, #020306 100%)";
  const pageTextClass = isLightTheme
    ? "text-slate-900 selection:bg-indigo-100 selection:text-slate-950"
    : "text-slate-100 selection:bg-indigo-500/30 selection:text-white";
  const headerShellClass = isLightTheme
    ? "border-slate-200/80 bg-white/88 shadow-[0_20px_50px_rgba(148,163,184,0.18)]"
    : "border-zinc-800/80 bg-zinc-950/70 shadow-[0_20px_50px_rgba(0,0,0,0.6)]";
  const navTextClass = isLightTheme ? "text-slate-500" : "text-slate-400";
  const brandTextClass = isLightTheme
    ? "text-slate-900 group-hover:text-indigo-700"
    : "text-white group-hover:text-indigo-200";
  const headerActionClass = isLightTheme
    ? "from-slate-950 to-slate-800 hover:from-slate-900 hover:to-slate-700 shadow-[0_4px_12px_rgba(15,23,42,0.18)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.24)]"
    : "from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-[0_4px_12px_rgba(99,102,241,0.25)] hover:shadow-[0_4px_16px_rgba(99,102,241,0.35)]";
  const iconButtonClass = isLightTheme
    ? "border-slate-200 bg-white/78 text-slate-600 hover:border-slate-300 hover:text-slate-900"
    : "border-zinc-800 bg-zinc-900/50 text-slate-300 hover:border-zinc-700 hover:text-white";
  const heroBadgeClass = isLightTheme
    ? "border-slate-200 bg-white/92 text-indigo-600"
    : "border-zinc-800 bg-zinc-900/60 text-indigo-400";
  const heroTitleClass = isLightTheme ? "text-slate-950" : "text-white";
  const heroAccentClass = isLightTheme ? "text-indigo-600" : "text-indigo-400";
  const bodyCopyClass = isLightTheme ? "text-slate-600" : "text-slate-400";
  const primaryButtonClass = isLightTheme
    ? "bg-slate-950 text-white shadow-[0_20px_50px_rgba(15,23,42,0.12)] hover:bg-slate-800"
    : "bg-white text-black shadow-[0_20px_50px_rgba(99,102,241,0.15)] hover:bg-zinc-200";
  const outlineButtonClass = isLightTheme
    ? "border-slate-300 bg-white/80 text-slate-700 hover:border-slate-400 hover:bg-white"
    : "border-zinc-800 bg-zinc-900/20 text-slate-300 hover:border-zinc-700 hover:bg-zinc-900";
  const heroSocialClass = isLightTheme
    ? "text-slate-500 hover:text-indigo-600"
    : "text-slate-500 hover:text-indigo-300";
  const workspaceShellClass = isLightTheme
    ? "border-slate-200/90 bg-white/88 shadow-[0_40px_90px_-20px_rgba(148,163,184,0.28)]"
    : "border-zinc-800/80 bg-zinc-950/50 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)]";
  const workspaceGlowClass = isLightTheme
    ? "from-indigo-500/8 via-sky-400/8 to-transparent opacity-35"
    : "from-indigo-500/10 via-purple-500/10 to-pink-500/10 opacity-40";
  const workspaceDotClass = isLightTheme ? "bg-slate-300" : "bg-zinc-800";
  const metricCardClass = isLightTheme
    ? "border-slate-200 bg-white/78 hover:border-slate-300"
    : "border-zinc-900 bg-zinc-950/40 hover:border-zinc-800";
  const metricValueClass = isLightTheme ? "text-slate-950" : "text-white";
  const metricLabelClass = isLightTheme ? "text-indigo-600" : "text-indigo-400";
  const quoteSectionClass = isLightTheme
    ? "border-y border-slate-200 bg-slate-50/78"
    : "border-y border-zinc-900 bg-zinc-950/20";
  const quoteBadgeClass = isLightTheme
    ? "border-slate-200 bg-white/92 text-slate-700"
    : "border-zinc-800 bg-zinc-950/70 text-slate-200";
  const quoteTextClass = isLightTheme ? "text-slate-800" : "text-slate-200";
  const profileFrameClass = isLightTheme
    ? "border-slate-200 bg-white shadow-[0_16px_40px_rgba(148,163,184,0.22)]"
    : "border-white/12 bg-zinc-900 shadow-[0_16px_40px_rgba(0,0,0,0.35)]";
  const processSectionClass = isLightTheme
    ? "border-b border-slate-200 bg-white/62"
    : "border-b border-zinc-900 bg-zinc-950/10";
  const processCardClass = isLightTheme
    ? "border-slate-200 bg-white/82 hover:border-slate-300"
    : "border-zinc-900 bg-zinc-950/40 hover:border-zinc-800";
  const processNumberClass = isLightTheme
    ? "text-slate-200 group-hover:text-indigo-200"
    : "text-zinc-800 group-hover:text-indigo-500/40";
  const processIconWrapClass = isLightTheme
    ? "border-indigo-200 bg-indigo-50 text-indigo-600"
    : "border-indigo-500/20 bg-zinc-900 text-indigo-400";
  const ctaCardClass = isLightTheme
    ? "border-slate-200 bg-[linear-gradient(135deg,#ffffff,#f6f9ff,#eef4ff)] shadow-[0_28px_80px_rgba(148,163,184,0.18)]"
    : "border-zinc-900 bg-gradient-to-br from-zinc-950 via-zinc-900/60 to-zinc-950 shadow-2xl";
  const ctaTitleClass = isLightTheme ? "text-slate-950" : "text-white";
  const ctaCopyClass = isLightTheme ? "text-slate-600" : "text-slate-400";
  const faqSectionClass = isLightTheme ? "border-t border-slate-200" : "border-t border-zinc-900";
  const helpCardClass = isLightTheme
    ? "border-slate-200 bg-white/76"
    : "border-zinc-900 bg-zinc-950/40";
  const faqDetailsClass = isLightTheme
    ? "border-slate-200 bg-white/78 open:border-slate-300 open:bg-white"
    : "border-zinc-900 bg-zinc-950/30 open:border-zinc-800 open:bg-zinc-900/10";
  const faqSummaryClass = isLightTheme ? "text-slate-800" : "text-slate-200";
  const footerClass = isLightTheme ? "border-t border-slate-200 bg-white/92" : "border-t border-zinc-900 bg-[#020306]";
  const footerCopyClass = isLightTheme ? "text-slate-500" : "text-slate-500";
  const footerNavClass = isLightTheme ? "text-slate-500 hover:text-slate-900" : "text-slate-400 hover:text-white";
  const brandLogoShellClass = isLightTheme
    ? "shadow-[0_10px_26px_rgba(148,163,184,0.2)]"
    : "shadow-[0_10px_28px_rgba(0,0,0,0.28)]";
  const heroNeutralColor = isLightTheme ? "#020617" : "#f8fafc";
  const heroNeutralShineColor = isLightTheme ? "#818cf8" : "#ffffff";
  const heroAccentColor = isLightTheme ? "#4f46e5" : "#818cf8";
  const heroAccentShineColor = isLightTheme ? "#ffffff" : "#eef2ff";
  const raysColor = isLightTheme ? "#4f46e5" : "#a78bfa";

  // 3D Tilt perspective transform for the dashboard mockup
  // Rotates flat as it scrolls into center focus
  const rotateX = useTransform(scrollYProgress, [0, 0.45], [10, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.45], [0.94, 1]);
  const opacityVal = useTransform(scrollYProgress, [0, 0.35], [0.75, 1]);

  return (
    <div
      className={`relative min-h-screen overflow-hidden transition-colors duration-500 ${pageTextClass}`}
      style={{ background: pageBackground }}
    >
      {/* Background Grids & Ambient Glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={`absolute inset-x-0 top-0 h-[76vh] ${isLightTheme ? "opacity-55" : "opacity-75"}`}
          style={{
            maskImage:
              "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 56%, rgba(0,0,0,0) 100%)",
          }}
        >
          <LightRays
            raysOrigin="top-center"
            raysColor={raysColor}
            raysSpeed={0.75}
            lightSpread={0.9}
            rayLength={1.75}
            pulsating
            fadeDistance={1.08}
            saturation={1.15}
            mouseInfluence={0.1}
            noiseAmount={0.035}
            distortion={0.08}
          />
        </div>
        <div className={`home-grid absolute inset-0 ${isLightTheme ? "opacity-12" : "opacity-40"}`} />
        <div className={`home-noise absolute inset-0 ${isLightTheme ? "opacity-6" : "opacity-15"}`} />
        <motion.div style={{ y: yBg }} className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 bg-gradient-to-b from-indigo-500/10 to-transparent blur-[140px]" />
        <motion.div style={{ y: yBgSecond }} className="absolute right-[-10%] top-[20%] h-[400px] w-[400px] bg-gradient-to-b from-violet-600/8 to-transparent blur-[120px]" />
        <div className="absolute left-[-10%] top-[40%] h-[400px] w-[400px] bg-gradient-to-b from-blue-500/8 to-transparent blur-[120px]" />
      </div>

      {/* Floating Pill Navbar / Header */}
      <header className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-4xl rounded-[24px] border backdrop-blur-xl px-6 py-3 transition-all duration-300 ${headerShellClass}`}>
        <div className="mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className={`relative h-10 w-10 overflow-hidden rounded-xl transition-transform duration-300 group-hover:scale-[1.03] ${brandLogoShellClass}`}>
              <Image
                src="/images/logo.png"
                alt="Logo SocialPulse AI"
                fill
                sizes="40px"
                className="object-cover"
                priority
              />
            </div>
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-[0.25em] transition-colors duration-300 ${brandTextClass}`}>SocialPulse AI</p>
            </div>
          </Link>

          <nav className={`hidden items-center gap-8 text-[11px] font-bold uppercase tracking-wider md:flex ${navTextClass}`}>
            <a href="#workspace" className={`relative py-1.5 transition-colors group ${isLightTheme ? "hover:text-slate-950" : "hover:text-white"}`}>
              Workspace
              <span className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${heroAccentClass.replace("text", "bg")}`} />
            </a>
            <a href="#alur" className={`relative py-1.5 transition-colors group ${isLightTheme ? "hover:text-slate-950" : "hover:text-white"}`}>
              Proses
              <span className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${heroAccentClass.replace("text", "bg")}`} />
            </a>
            <a href="#faq" className={`relative py-1.5 transition-colors group ${isLightTheme ? "hover:text-slate-950" : "hover:text-white"}`}>
              FAQ
              <span className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${heroAccentClass.replace("text", "bg")}`} />
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
              className={`hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors duration-300 ${iconButtonClass}`}
              aria-label={isLightTheme ? "Aktifkan mode gelap" : "Aktifkan mode terang"}
              title={isLightTheme ? "Mode gelap" : "Mode terang"}
            >
              {isLightTheme ? <ThemeMoonIcon className="h-4.5 w-4.5" /> : <ThemeSunIcon className="h-4.5 w-4.5" />}
            </button>
            <Link 
              href="/app/explorer" 
              className={`hidden sm:inline-flex items-center justify-center rounded-full bg-gradient-to-r text-white font-semibold text-[11px] uppercase tracking-wider py-1.5 px-4 transition-all duration-300 ${headerActionClass}`}
            >
              Go to App →
            </Link>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
              className={`flex md:hidden h-8 w-8 items-center justify-center rounded-lg border transition-colors duration-200 ${iconButtonClass}`}
              aria-label={isLightTheme ? "Aktifkan mode gelap" : "Aktifkan mode terang"}
              title={isLightTheme ? "Mode gelap" : "Mode terang"}
            >
              {isLightTheme ? <ThemeMoonIcon className="h-4 w-4" /> : <ThemeSunIcon className="h-4 w-4" />}
            </button>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`flex md:hidden h-8 w-8 items-center justify-center rounded-lg border transition-colors duration-200 ${iconButtonClass}`}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className={`md:hidden mt-4 pt-4 border-t flex flex-col gap-4 text-[11px] font-bold uppercase tracking-wider overflow-hidden ${isLightTheme ? "border-slate-200 text-slate-500" : "border-zinc-900 text-slate-400"}`}
            >
              <a 
                href="#workspace" 
                onClick={() => setMobileMenuOpen(false)}
                className={`transition-colors py-1 ${isLightTheme ? "hover:text-slate-950" : "hover:text-white"}`}
              >
                Workspace
              </a>
              <a 
                href="#alur" 
                onClick={() => setMobileMenuOpen(false)}
                className={`transition-colors py-1 ${isLightTheme ? "hover:text-slate-950" : "hover:text-white"}`}
              >
                Proses
              </a>
              <a 
                href="#faq" 
                onClick={() => setMobileMenuOpen(false)}
                className={`transition-colors py-1 ${isLightTheme ? "hover:text-slate-950" : "hover:text-white"}`}
              >
                FAQ
              </a>
              <Link 
                href="/app/explorer" 
                onClick={() => setMobileMenuOpen(false)}
                className={`inline-flex items-center justify-center rounded-full bg-gradient-to-r text-white font-semibold py-2.5 px-4 transition-all duration-300 text-center ${headerActionClass}`}
              >
                Go to App →
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="relative z-10">
        {/* Centered Hero Section */}
        <section ref={heroRef} id="hero" className="mx-auto max-w-7xl px-6 pb-16 pt-28 sm:px-8 sm:pt-32 lg:pt-40">
          <div className="text-center space-y-6 sm:space-y-8">
            <motion.div
              {...revealWithDelay(0.05)}
              style={{ y: heroBadgeY }}
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] backdrop-blur-md sm:px-4 sm:text-[11px] sm:tracking-[0.22em] ${heroBadgeClass}`}
            >
              <Sparkles className={`h-3.5 w-3.5 ${isLightTheme ? "fill-indigo-600/15 text-indigo-600" : "fill-indigo-400/20 text-indigo-400"}`} />
              Social Media Intelligence Workspace
            </motion.div>

            <motion.h1
              {...revealWithDelay(0.12)}
              style={{ y: heroTitleY, opacity: heroTitleOpacity }}
              className={`mx-auto max-w-[11ch] px-1 text-[3.15rem] font-bold leading-[0.98] tracking-[-0.045em] sm:max-w-4xl sm:px-0 sm:text-6xl sm:leading-[1.02] lg:text-8xl ${heroTitleClass}`}
            >
              <ShinyText
                className="align-baseline"
                color={heroNeutralColor}
                shineColor={heroNeutralShineColor}
                speed={3.2}
                spread={106}
              >
                Tempel
              </ShinyText>{" "}
              <ShinyText
                className="align-baseline font-display italic font-normal"
                color={heroAccentColor}
                shineColor={heroAccentShineColor}
                speed={2.6}
                spread={100}
                delay={0.14}
              >
                URL.
              </ShinyText>
              <ShinyText
                className="align-baseline"
                color={heroNeutralColor}
                shineColor={heroNeutralShineColor}
                speed={3.2}
                spread={106}
                delay={0.22}
              >
                Tarik
              </ShinyText>{" "}
              <ShinyText
                className="align-baseline font-display italic font-normal"
                color={heroAccentColor}
                shineColor={heroAccentShineColor}
                speed={2.6}
                spread={100}
                delay={0.3}
              >
                data.
              </ShinyText>
              <ShinyText
                className="align-baseline"
                color={heroNeutralColor}
                shineColor={heroNeutralShineColor}
                speed={3.2}
                spread={106}
                delay={0.38}
              >
                Petakan
              </ShinyText>{" "}
              <ShinyText
                className="align-baseline font-display italic font-normal"
                color={heroAccentColor}
                shineColor={heroAccentShineColor}
                speed={2.6}
                spread={100}
                delay={0.46}
              >
                insight.
              </ShinyText>
            </motion.h1>

            <motion.p
              {...revealWithDelay(0.18)}
              style={{ y: heroCopyY, opacity: heroCopyOpacity }}
              className={`mx-auto max-w-xl px-2 text-sm leading-7 sm:px-0 sm:text-base md:text-lg ${bodyCopyClass}`}
            >
              Scrape postingan atau profil publik, kumpulkan engagement dan komentar, lalu ubah hasilnya menjadi dataset yang siap dianalisis, dibersihkan, dan diekspor langsung dari satu workspace.
            </motion.p>

            <motion.div
              {...revealWithDelay(0.21)}
              style={{ y: heroCopyY, opacity: heroCopyOpacity }}
              className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-4 px-2 sm:px-0"
            >
              {socialLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={item.label}
                    title={item.label}
                    className={`group inline-flex h-10 w-10 items-center justify-center transition-all duration-300 hover:-translate-y-0.5 ${heroSocialClass}`}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </motion.div>

            <motion.div
              {...revealWithDelay(0.24)}
              className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
            >
              <a href="#workspace">
                <Button
                  size="lg"
                  className={`min-w-[220px] rounded-full px-8 py-6 text-sm font-semibold transition-all duration-300 sm:min-w-0 ${primaryButtonClass}`}
                >
                  Buka Workspace <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </a>
              <Link href="/app/explorer">
                <Button
                  variant="outline"
                  size="lg"
                  className={`min-w-[220px] rounded-full px-8 py-6 text-sm font-semibold sm:min-w-0 ${outlineButtonClass}`}
                >
                  Arsip & Riwayat
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Embedded Scraper Mockup Dashboard with Parallax Entrance */}
          <div ref={containerRef} className="relative mt-20 max-w-5xl mx-auto" style={{ perspective: 1200 }}>
            <motion.div
              id="workspace"
              style={{
                rotateX,
                scale,
                opacity: opacityVal,
                transformPerspective: 1200,
              }}
              className={`relative rounded-3xl border p-4 sm:p-6 backdrop-blur-xl ${workspaceShellClass}`}
            >
              {/* Soft Ambient Background Glow under the Workspace */}
              <div className={`absolute -inset-10 -z-10 bg-gradient-to-tr rounded-3xl blur-3xl pointer-events-none ${workspaceGlowClass}`} />
              
              {/* Header style top border dots */}
              <div className="absolute top-4 left-6 flex gap-1.5 pointer-events-none">
                <span className={`w-2.5 h-2.5 rounded-full ${workspaceDotClass}`} />
                <span className={`w-2.5 h-2.5 rounded-full ${workspaceDotClass}`} />
                <span className={`w-2.5 h-2.5 rounded-full ${workspaceDotClass}`} />
              </div>

              <div className="pt-4">
                <ScraperWorkspace mode="embedded" themeMode={theme} />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Hero Metrics section */}
        <section className="mx-auto max-w-7xl px-6 py-12 sm:px-8">
          <div className="grid gap-6 sm:grid-cols-3">
            {heroMetrics.map((item, index) => (
              <motion.div
                key={item.label}
                {...revealWithDelay(index * 0.08)}
                className={`rounded-2xl border p-6 backdrop-blur-sm transition duration-300 ${metricCardClass}`}
              >
                <p className={`text-4xl font-bold tracking-tight ${metricValueClass}`}>{item.value}</p>
                <p className={`mt-2 text-xs font-semibold uppercase tracking-[0.18em] ${metricLabelClass}`}>
                  {item.label}
                </p>
                <p className={`mt-3 text-sm leading-relaxed ${bodyCopyClass}`}>{item.caption}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Brand Quote strip */}
        <section ref={quoteRef} className={`py-16 ${quoteSectionClass}`}>
          <div className="mx-auto max-w-6xl px-6 sm:px-8">
            <motion.div {...fadeUp} className="flex flex-col items-center text-center">
              <div className={`inline-flex items-center gap-2 rounded-full border px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] backdrop-blur-md ${quoteBadgeClass}`}>
                <Sparkles className={`h-3.5 w-3.5 ${isLightTheme ? "text-indigo-600" : "text-slate-100"}`} />
                Kami menganalisis data Anda
              </div>

              <blockquote className="mt-8 max-w-5xl">
                <ScrollReveal
                  enableBlur
                  baseOpacity={0.12}
                  baseRotation={2.5}
                  blurStrength={6}
                  containerClassName="m-0"
                  textClassName={`text-balance text-3xl leading-[1.18] tracking-[-0.04em] sm:text-4xl lg:text-[3.9rem] lg:leading-[1.12] ${quoteTextClass}`}
                  rotationEnd="bottom center"
                  wordAnimationEnd="bottom center"
                >
                  “Kami merancang interface agar data dan utilitas utama langsung dapat diakses secara instan, dipasangkan dengan layout visual yang tenang, sinematik, dan terkurasi.”
                </ScrollReveal>
              </blockquote>

              <motion.div
                style={{ y: quoteY, opacity: quoteOpacity }}
                className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:gap-5"
              >
                <div className={`relative h-16 w-16 overflow-hidden rounded-full border ${profileFrameClass}`}>
                  <Image
                    src="/images/foto profil.png"
                    alt="Rizky Mema"
                    fill
                    sizes="64px"
                    className="object-cover object-top scale-[1.15]"
                  />
                </div>

                <div className="text-center sm:text-left">
                  <p className={`text-xl font-semibold tracking-tight ${heroTitleClass}`}>Rizky Mema</p>
                  <p className={`text-sm ${bodyCopyClass}`}>Software Engineer</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Process Steps */}
        <section id="alur" className={`py-24 ${processSectionClass}`}>
          <div className="mx-auto max-w-7xl px-6 sm:px-8">
            <motion.div {...fadeUp} className="mb-16 max-w-3xl">
              <p className={`text-xs font-semibold uppercase tracking-[0.25em] ${metricLabelClass}`}>Alur Kerja</p>
              <h2 className={`mt-4 text-4xl font-bold tracking-tight sm:text-5xl leading-tight ${heroTitleClass}`}>
                Alur scraping 3 langkah yang deliberatif.
              </h2>
            </motion.div>

            <div className="grid gap-6 lg:grid-cols-3">
              {processSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.title}
                    {...revealWithDelay(index * 0.08)}
                    className={`rounded-3xl border p-6 transition duration-300 relative group ${processCardClass}`}
                  >
                    <div className="flex items-center justify-between">
                        <span className={`font-display text-5xl font-normal leading-none tracking-tight transition duration-300 ${processNumberClass}`}>0{index + 1}</span>
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${processIconWrapClass}`}>
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                    </div>
                      <h3 className={`mt-6 text-lg font-bold tracking-tight ${heroTitleClass}`}>{step.title}</h3>
                      <p className={`mt-2 text-xs leading-relaxed ${bodyCopyClass}`}>{step.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Call to Action Banner (CTA) */}
        <section className="mx-auto max-w-5xl px-6 py-20">
          <motion.div
            {...fadeUp}
              className={`relative rounded-[2.5rem] border p-12 md:p-20 text-center overflow-hidden ${ctaCardClass}`}
          >
            {/* Background Glows inside CTA card */}
              <div className={`absolute -right-20 -bottom-20 w-80 h-80 rounded-full blur-3xl pointer-events-none ${isLightTheme ? "bg-indigo-500/8" : "bg-indigo-500/5"}`} />
              <div className={`absolute -left-20 -top-20 w-80 h-80 rounded-full blur-3xl pointer-events-none ${isLightTheme ? "bg-sky-400/8" : "bg-violet-600/5"}`} />

            <div className="relative z-10 space-y-6">
                <p className={`text-xs font-bold uppercase tracking-[0.25em] ${metricLabelClass}`}>Get Started</p>
                <h2 className={`mx-auto max-w-2xl font-display text-4xl leading-[1.08] tracking-tight sm:text-6xl ${ctaTitleClass}`}>
                  Mulai kumpulkan <span className={`italic ${metricLabelClass}`}>insight</span> berharga sekarang.
              </h2>
                <p className={`mx-auto max-w-lg text-sm ${ctaCopyClass}`}>
                Gunakan workspace scraping kami langsung dari beranda secara instan, atau buka arsip data lama Anda.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <a href="#workspace">
                  <Button
                    size="lg"
                      className={`rounded-full px-8 py-6 text-sm font-semibold transition-all duration-300 w-full sm:w-auto ${primaryButtonClass}`}
                  >
                    Buka Workspace <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </a>
                <Link href="/app/explorer">
                  <Button
                    variant="outline"
                    size="lg"
                    className={`rounded-full px-8 text-sm font-semibold w-full sm:w-auto ${outlineButtonClass}`}
                  >
                    Buka Arsip & Explorer
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Split FAQ Section */}
        <section id="faq" className={`mx-auto max-w-7xl px-6 py-24 sm:px-8 ${faqSectionClass}`}>
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
            <motion.div {...fadeUp} className="space-y-6">
              <div className={`inline-flex items-center gap-2 rounded-xl border p-4 w-full ${helpCardClass}`}>
                <HelpCircle className={`h-6 w-6 shrink-0 ${metricLabelClass}`} />
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wider ${heroTitleClass}`}>Bantuan Cepat</p>
                  <p className={`text-xs ${bodyCopyClass}`}>Pertanyaan umum seputar pembaruan platform</p>
                </div>
              </div>
              
              <h2 className={`font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl ${heroTitleClass}`}>
                Pertanyaan yang sering <span className={`italic ${isLightTheme ? "text-indigo-600" : "text-indigo-300"}`}>ditanyakan</span>.
              </h2>
              <p className={`text-sm leading-relaxed ${bodyCopyClass}`}>
                Pembaruan beranda ini diarahkan agar alur scraping media sosial Anda terasa jauh lebih seamless, terpadu, dan modern. Pelajari selengkapnya melalui daftar pertanyaan di samping.
              </p>
            </motion.div>

            <motion.div {...fadeUp} className="space-y-4">
              {faqs.map((item) => (
                <details
                  key={item.question}
                  className={`group rounded-2xl border px-6 py-4 transition-all duration-300 cursor-pointer ${faqDetailsClass}`}
                >
                  <summary className={`flex items-center justify-between list-none font-bold text-sm select-none ${faqSummaryClass}`}>
                    {item.question}
                    <span className={`ml-2 group-open:rotate-180 transition-transform duration-300 text-xs ${isLightTheme ? "text-slate-400" : "text-slate-500"}`}>▼</span>
                  </summary>
                  <p className={`mt-3 text-xs leading-relaxed transition-opacity duration-300 ${bodyCopyClass}`}>
                    {item.answer}
                  </p>
                </details>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className={`py-12 ${footerClass}`}>
          <div className="mx-auto max-w-7xl px-6 sm:px-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`relative h-10 w-10 overflow-hidden rounded-xl ${brandLogoShellClass}`}>
                  <Image
                    src="/images/logo.png"
                    alt="Logo SocialPulse AI"
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
                <span className={`text-sm font-bold uppercase tracking-wider ${heroTitleClass}`}>SocialPulse AI</span>
              </div>
              <p className={`text-xs max-w-md ${footerCopyClass}`}>
                Platform intelijen media sosial terpadu dengan workflow scraping langsung di pusat beranda.
              </p>
              <p className={`text-[11px] ${isLightTheme ? "text-slate-500" : "text-slate-600"}`}>© 2026 Rizky Mema</p>
            </div>
            
            <div className="flex flex-wrap gap-x-8 gap-y-4 text-xs">
              <a href="#workspace" className={`transition-colors ${footerNavClass}`}>Workspace</a>
              <a href="#alur" className={`transition-colors ${footerNavClass}`}>Proses</a>
              <a href="#faq" className={`transition-colors ${footerNavClass}`}>FAQ</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}