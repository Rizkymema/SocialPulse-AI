"use client";

import React, { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  LayoutDashboard, 
  FolderLock, 
  TableProperties, 
  BarChart4, 
  FileText, 
  Settings, 
  LogOut, 
  Bell, 
  Menu, 
  X,
  ChevronDown,
  User as UserIcon,
  Shield,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSaaSStore } from "@/store/useSaaSStore";

const subscribe = () => () => {};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { 
    isAuthenticated, 
    user, 
    login,
    logout, 
    workspaces, 
    activeWorkspaceId, 
    switchWorkspace, 
    createWorkspace,
    notifications,
    markNotificationsAsRead,
    clearNotifications
  } = useSaaSStore();

  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      login("guest@socialpulse.ai", "Guest Explorer");
    }
  }, [isAuthenticated, login]);

  if (!mounted || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center active-pulse">
            <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
          </div>
          <span className="text-xs text-zinc-500 tracking-wider">Verifying session...</span>
        </div>
      </div>
    );
  }

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  const menuItems = [
    { name: "Overview", icon: LayoutDashboard, path: "/app/overview" },
    { name: "Workspaces", icon: FolderLock, path: "/app/workspaces" },
    { name: "Data Explorer", icon: TableProperties, path: "/app/explorer" },
    { name: "Analytics", icon: BarChart4, path: "/app/analytics" },
    { name: "Reports", icon: FileText, path: "/app/reports" },
    { name: "Settings", icon: Settings, path: "/app/settings" },
  ];

  const handleCreateWorkspaceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    createWorkspace(newWorkspaceName.trim());
    setNewWorkspaceName("");
    setIsCreateModalOpen(false);
    router.push("/app/overview");
  };

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-[#030303] text-[#f4f4f5] flex">
      {/* Background accents */}
      <div className="fixed top-[-20%] right-[-10%] w-[50%] h-[50%] glow-violet pointer-events-none rounded-full" />
      <div className="fixed bottom-[-15%] left-[-10%] w-[40%] h-[40%] glow-indigo pointer-events-none rounded-full" />

      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#09090b]/80 backdrop-blur-md border-r border-white/5 relative z-30 shrink-0">
        {/* Brand logo */}
        <div className="flex h-16 items-center px-6 border-b border-white/5">
          <Link href="/app/overview" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-indigo-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-md font-bold tracking-tight">
              SocialPulse <span className="text-indigo-400">AI</span>
            </span>
          </Link>
        </div>

        {/* Sidebar Nav */}
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

        {/* Workspace Quick Details */}
        <div className="p-4 border-t border-white/5 bg-zinc-950/40">
          <div className="rounded-lg border border-white/5 bg-zinc-900/20 p-3 text-xs">
            <div className="flex justify-between text-zinc-500 mb-1 font-semibold uppercase tracking-wider">
              <span>Active Tenant</span>
            </div>
            <div className="font-semibold text-zinc-300 truncate mb-1.5">
              {activeWorkspace?.name}
            </div>
            <div className="text-[10px] text-indigo-400 flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Role: {user?.role.toUpperCase()}
            </div>
          </div>
        </div>
      </aside>

      {/* --- MOBILE SIDEBAR --- */}
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
              className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-zinc-950 border-r border-zinc-900 flex flex-col"
            >
              <div className="flex h-16 items-center justify-between px-6 border-b border-zinc-900">
                <span className="font-bold flex items-center gap-2">
                  <div className="h-7 w-7 rounded bg-indigo-600 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  SocialPulse AI
                </span>
                <button onClick={() => setIsSidebarOpen(false)} className="text-zinc-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 px-4 py-6 space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.path;
                  return (
                    <Link 
                      key={item.name} 
                      href={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                    >
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

              <div className="p-4 border-t border-zinc-900">
                <button
                  onClick={() => {
                    setIsSidebarOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* --- MAIN PAGE WRAPPER --- */}
      <div className="flex-1 flex flex-col min-w-0 relative z-25">
        {/* --- TOPBAR --- */}
        <header className="h-16 border-b border-white/5 bg-[#030303]/60 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button 
                variant="outline" 
                size="sm" 
                className="hidden md:flex border-indigo-500/20 hover:border-indigo-500/40 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-400 text-xs font-semibold gap-1.5 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" /> Analyze New Link
              </Button>
            </Link>
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="lg:hidden text-zinc-400 hover:text-white"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Workspace Switcher */}
            <div className="relative">
              <div className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-zinc-900/30 px-3 py-1.5 text-sm hover:bg-zinc-900/60 cursor-pointer select-none transition-colors">
                <span className="font-semibold text-zinc-200 truncate max-w-[120px] sm:max-w-[200px]">
                  {activeWorkspace?.name}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
                
                {/* Select wrapper to make switcher fully interactive natively */}
                <select
                  value={activeWorkspaceId}
                  onChange={(e) => {
                    if (e.target.value === "__create__") {
                      setIsCreateModalOpen(true);
                    } else {
                      switchWorkspace(e.target.value);
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full"
                >
                  <optgroup label="Choose Workspace" className="bg-[#09090b] text-[#f4f4f5]">
                    {workspaces.map((w) => (
                      <option key={w.id} value={w.id} className="bg-[#09090b]">
                        {w.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Actions" className="bg-[#09090b] text-[#f4f4f5]">
                    <option value="__create__" className="text-indigo-400 font-bold bg-[#09090b]">
                      + Create Workspace...
                    </option>
                  </optgroup>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notifications Popover */}
            <div className="relative">
              <button 
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  setIsProfileOpen(false);
                }}
                className="relative h-9 w-9 flex items-center justify-center rounded-lg hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-all"
              >
                <Bell className="h-4 w-4 text-zinc-400 hover:text-white" />
                {unreadNotifCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                )}
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsNotificationsOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-80 rounded-xl border border-zinc-800 bg-[#09090b] p-4 shadow-xl z-40"
                    >
                      <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-3">
                        <span className="text-xs font-bold text-white">Notifications ({unreadNotifCount})</span>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => markNotificationsAsRead()} 
                            className="text-[10px] text-indigo-400 hover:underline"
                          >
                            Mark Read
                          </button>
                          <button 
                            onClick={() => clearNotifications()} 
                            className="text-[10px] text-zinc-500 hover:underline"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="text-center py-6 text-xs text-zinc-500">No new notifications</div>
                        ) : (
                          notifications.map((n) => (
                            <div key={n.id} className="text-xs space-y-1">
                              <p className={`leading-normal ${n.read ? "text-zinc-400" : "text-white font-medium"}`}>
                                {n.text}
                              </p>
                              <span className="text-[10px] text-zinc-500">{n.time}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setIsNotificationsOpen(false);
                }}
                className="flex items-center gap-2 focus:outline-none"
              >
                <div className="h-8 w-8 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900 flex items-center justify-center">
                  {user?.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    <UserIcon className="h-4 w-4 text-zinc-400" />
                  )}
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-zinc-500 hidden sm:block" />
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsProfileOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 rounded-xl border border-zinc-800 bg-[#09090b] p-2 shadow-xl z-40"
                    >
                      <div className="px-3 py-2 border-b border-zinc-900 text-left">
                        <p className="text-xs font-bold text-white leading-none">{user?.name}</p>
                        <p className="text-[10px] text-zinc-500 mt-1 truncate">{user?.email}</p>
                        <span className="mt-2 inline-flex items-center rounded-full bg-indigo-500/10 px-2 py-0.5 text-[9px] font-bold text-indigo-400 border border-indigo-500/20">
                          {user?.plan} Plan
                        </span>
                      </div>
                      
                      <div className="p-1 space-y-0.5">
                        <Link href="/app/settings" onClick={() => setIsProfileOpen(false)}>
                          <span className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg cursor-pointer transition-colors">
                            <Settings className="h-3.5 w-3.5" /> Settings
                          </span>
                        </Link>
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            logout();
                          }}
                          className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <LogOut className="h-3.5 w-3.5" /> Sign Out
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* --- DYNAMIC CHILD PAGES AREA --- */}
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

      {/* --- CREATE WORKSPACE INTERACTIVE MODAL OVERLAY --- */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-10 w-full max-w-md rounded-xl border border-zinc-800 bg-[#09090b] p-6 shadow-2xl bg-glass border-glass"
            >
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="absolute right-4 top-4 rounded-md opacity-70 transition-opacity hover:opacity-100 hover:bg-zinc-900 p-1"
              >
                <X className="h-4 w-4" />
              </button>
              
              <form onSubmit={handleCreateWorkspaceSubmit} className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">Create New Workspace</h3>
                  <p className="text-xs text-muted-foreground">Setup an isolated data boundary for a new brand or agency project.</p>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400">Workspace Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nike Global, Brand B"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-border bg-zinc-950 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="border-zinc-850 hover:bg-zinc-900 text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex gap-1.5 items-center"
                  >
                    <Plus className="h-4 w-4" /> Create Workspace
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
