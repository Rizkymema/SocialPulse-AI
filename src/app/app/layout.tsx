"use client";

import React, { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Link2, Menu, Sparkles, TableProperties, UserCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSaaSStore } from "@/store/useSaaSStore";

const menuItems = [
  { name: "Scraper & Hasil", icon: TableProperties, path: "/app/explorer" },
];

const subscribe = () => () => {};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, user, login } = useSaaSStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMounted = useSyncExternalStore(subscribe, () => true, () => false);

  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      login("guest@socialpulse.ai", "Guest Explorer");
    }
  }, [isAuthenticated, isMounted, login]);

  if (!isMounted || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center active-pulse">
            <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
          </div>
          <span className="text-xs text-zinc-500 tracking-wider">
            Menyiapkan halaman scraper...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] text-[#f4f4f5] flex">
      <div className="fixed top-[-20%] right-[-10%] w-[50%] h-[50%] glow-violet pointer-events-none rounded-full" />
      <div className="fixed bottom-[-15%] left-[-10%] w-[40%] h-[40%] glow-indigo pointer-events-none rounded-full" />

      <aside className="hidden lg:flex flex-col w-72 bg-[#09090b]/80 backdrop-blur-md border-r border-white/5 relative z-30 shrink-0">
        <div className="flex h-16 items-center px-6 border-b border-white/5">
          <Link href="/app/explorer" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-indigo-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-md font-bold tracking-tight">
              SocialPulse <span className="text-indigo-400">AI</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;

            return (
              <Link key={item.name} href={item.path}>
                <span
                  className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 font-semibold shadow-sm shadow-indigo-500/5"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900/50 border border-transparent"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 bg-zinc-950/40">
          <div className="rounded-xl border border-white/5 bg-zinc-900/30 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-400 mb-3">
              Fokus Penggunaan
            </p>
            <div className="space-y-2 text-xs text-zinc-400 leading-relaxed">
              <p>1. Tempel URL postingan publik</p>
              <p>2. Tunggu scraping selesai</p>
              <p>3. Lihat isi postingan dan komentar</p>
              <p>4. Unduh hasil ke CSV, Excel, atau PDF</p>
            </div>
          </div>
        </div>
      </aside>

      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-zinc-950 border-r border-zinc-900 flex flex-col"
            >
              <div className="flex h-16 items-center justify-between px-6 border-b border-zinc-900">
                <span className="font-bold flex items-center gap-2">
                  <div className="h-7 w-7 rounded bg-indigo-600 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  SocialPulse AI
                </span>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="px-4 py-6 space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.path;

                  return (
                    <Link key={item.name} href={item.path} onClick={() => setIsSidebarOpen(false)}>
                      <span
                        className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg ${
                          isActive
                            ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 font-semibold"
                            : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.name}
                      </span>
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-auto p-4 border-t border-zinc-900">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-xs text-zinc-400 space-y-2">
                  <p className="font-semibold text-indigo-400 uppercase tracking-[0.18em]">
                    Fokus Penggunaan
                  </p>
                  <p>Tempel URL, cek hasil, buka komentar, lalu unduh data.</p>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 relative z-20">
        <header className="h-16 border-b border-white/5 bg-[#030303]/60 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-zinc-400 hover:text-white"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                Pusat Scraping Data Media Sosial
              </p>
              <p className="text-xs text-zinc-500 truncate">
                Tempel URL, lihat isi postingan dan komentar, lalu unduh hasil scraping.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link href="/app/explorer">
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex border-indigo-500/20 hover:border-indigo-500/40 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-400 text-xs font-semibold gap-1.5"
              >
                <Link2 className="h-3.5 w-3.5" /> Buka Halaman Scraper
              </Button>
            </Link>

            <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 py-2">
              <UserCircle2 className="h-4 w-4 text-zinc-500" />
              <div className="hidden sm:block leading-tight">
                <p className="text-xs font-semibold text-white">{user?.name ?? "Guest Explorer"}</p>
                <p className="text-[11px] text-zinc-500">{user?.email ?? "guest@socialpulse.ai"}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}