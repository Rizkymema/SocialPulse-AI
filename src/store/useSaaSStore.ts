"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Post, Workspace, initialPosts, initialWorkspaces } from "@/lib/mockData";

export interface User {
  name: string;
  email: string;
  plan: "Free" | "Pro" | "Enterprise";
  role: "admin" | "member" | "viewer";
  avatar?: string;
}

export interface ReportFile {
  id: string;
  name: string;
  type: "CSV" | "Excel" | "PDF";
  date: string;
  status: "completed" | "processing" | "failed";
  summary: string;
  workspaceName: string;
  downloads: number;
}

interface SaaSState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, name?: string) => void;
  register: (name: string, email: string) => void;
  logout: () => void;
  upgradePlan: (plan: "Free" | "Pro" | "Enterprise") => void;
  updateProfile: (name: string, email: string, role: "admin" | "member" | "viewer") => void;

  // Workspaces
  workspaces: Workspace[];
  activeWorkspaceId: string;
  createWorkspace: (name: string) => string;
  switchWorkspace: (id: string) => void;
  deleteWorkspace: (id: string) => void;

  // Posts
  posts: Post[];
  addPost: (post: Omit<Post, "id" | "timestamp">) => void;
  deletePost: (id: string) => void;

  // Reports
  reports: ReportFile[];
  addReport: (report: Omit<ReportFile, "id" | "date" | "downloads">) => void;
  deleteReport: (id: string) => void;
  incrementDownloads: (id: string) => void;

  // Settings & Theme
  apiKeys: { devKey: string; prodKey: string };
  updateApiKeys: (devKey: string, prodKey: string) => void;
  theme: "dark" | "light";
  toggleTheme: () => void;

  // Notifications
  notifications: { id: string; text: string; time: string; read: boolean }[];
  addNotification: (text: string) => void;
  markNotificationsAsRead: () => void;
  clearNotifications: () => void;
  activeLink: string | null;
  analyzeLink: (link: string) => void;
}

export const useSaaSStore = create<SaaSState>()(
  persist(
    (set) => ({
      // Auth Initial State
      user: {
        name: "Alex Mercer",
        email: "alex@socialpulse.ai",
        plan: "Pro",
        role: "admin",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop",
      },
      isAuthenticated: true,
      activeLink: null,

      analyzeLink: (link) => {
        let platform: "instagram" | "facebook" | "tiktok" | "youtube" = "instagram";
        let label = "Instagram Post";
        let handle = "guest_user";
        
        if (link.includes("tiktok.com")) {
          platform = "tiktok";
          label = "TikTok Video";
          handle = "tiktok_creator";
        } else if (link.includes("youtube.com") || link.includes("youtu.be")) {
          platform = "youtube";
          label = "YouTube Video";
          handle = "youtube_reviewer";
        } else if (link.includes("facebook.com")) {
          platform = "facebook";
          label = "Facebook Post";
          handle = "fb_customer";
        }

        let identifier = "";
        try {
          const urlObj = new URL(link);
          const pathSegments = urlObj.pathname.split("/").filter(Boolean);
          if (platform === "youtube") {
            identifier = urlObj.searchParams.get("v") || pathSegments[0] || "video";
          } else {
            identifier = pathSegments[pathSegments.length - 1] || "post";
            if (identifier === "p" && pathSegments.length > 1) {
              identifier = pathSegments[pathSegments.indexOf("p") + 1];
            }
          }
        } catch {
          identifier = "post-" + Math.random().toString(36).substring(2, 6);
        }

        const wsName = `${label} (${identifier.substring(0, 10)})`;
        const wsId = `ws-link-${Math.random().toString(36).substring(2, 9)}`;

        const newWorkspace: Workspace = {
          id: wsId,
          name: wsName,
          created_at: new Date().toISOString(),
        };

        const mockCommentsForLink: Post[] = [
          {
            id: `post-l-1`,
            workspace_id: wsId,
            platform,
            username: handle,
            content: `Simulated legal extraction from URL: ${link}. This content represents publicly accessible interactions gathered via mock official API structures.`,
            likes: 120,
            comments: 14,
            shares: 5,
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            sentiment: "positive"
          },
          {
            id: `post-l-2`,
            workspace_id: wsId,
            platform,
            username: "early_adopter",
            content: "Outstanding quality, exceeded my brand expectations completely. Very fast response!",
            likes: 450,
            comments: 32,
            shares: 12,
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            sentiment: "positive"
          },
          {
            id: `post-l-3`,
            workspace_id: wsId,
            platform,
            username: "critic_spot",
            content: "Pricing tier is quite high compared to other options. Hope it becomes more affordable.",
            likes: 95,
            comments: 41,
            shares: 2,
            timestamp: new Date(Date.now() - 14400000).toISOString(),
            sentiment: "negative"
          },
          {
            id: `post-l-4`,
            workspace_id: wsId,
            platform,
            username: "curious_mind",
            content: "How does the performance compare under heavy load? Has anyone tested this?",
            likes: 34,
            comments: 18,
            shares: 1,
            timestamp: new Date(Date.now() - 28800000).toISOString(),
            sentiment: "neutral"
          },
          {
            id: `post-l-5`,
            workspace_id: wsId,
            platform,
            username: "dev_review",
            content: "The API integrations are clean and well-structured, although some endpoints returned stale cache. Overall positive.",
            likes: 210,
            comments: 15,
            shares: 8,
            timestamp: new Date(Date.now() - 43200000).toISOString(),
            sentiment: "positive"
          }
        ];

        set((state) => ({
          workspaces: [...state.workspaces, newWorkspace],
          activeWorkspaceId: wsId,
          activeLink: link,
          posts: [...state.posts, ...mockCommentsForLink],
          isAuthenticated: true,
          user: state.user || {
            name: "Guest Explorer",
            email: "guest@socialpulse.ai",
            plan: "Free",
            role: "viewer"
          }
        }));
      },

      login: (email, name = "Alex Mercer") =>
        set({
          isAuthenticated: true,
          user: {
            name,
            email,
            plan: "Pro",
            role: "admin",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop",
          },
        }),

      register: (name, email) =>
        set({
          isAuthenticated: true,
          user: {
            name,
            email,
            plan: "Free",
            role: "admin",
          },
        }),

      logout: () => set({ isAuthenticated: false, user: null }),

      upgradePlan: (plan) =>
        set((state) => ({
          user: state.user ? { ...state.user, plan } : null,
        })),

      updateProfile: (name, email, role) =>
        set((state) => ({
          user: state.user ? { ...state.user, name, email, role } : null,
        })),

      // Workspace Initial State
      workspaces: initialWorkspaces,
      activeWorkspaceId: "ws-global",

      createWorkspace: (name) => {
        const id = `ws-${Math.random().toString(36).substring(2, 9)}`;
        const newWorkspace: Workspace = {
          id,
          name,
          created_at: new Date().toISOString(),
        };
        set((state) => ({
          workspaces: [...state.workspaces, newWorkspace],
          activeWorkspaceId: id,
        }));
        return id;
      },

      switchWorkspace: (id) => set({ activeWorkspaceId: id }),

      deleteWorkspace: (id) =>
        set((state) => {
          const filtered = state.workspaces.filter((w) => w.id !== id);
          const nextActive = filtered.length > 0 ? filtered[0].id : "";
          return {
            workspaces: filtered,
            activeWorkspaceId: nextActive,
          };
        }),

      // Posts Initial State
      posts: initialPosts,

      addPost: (post) =>
        set((state) => ({
          posts: [
            ...state.posts,
            {
              ...post,
              id: `post-${Math.random().toString(36).substring(2, 9)}`,
              timestamp: new Date().toISOString(),
            },
          ],
        })),

      deletePost: (id) =>
        set((state) => ({
          posts: state.posts.filter((p) => p.id !== id),
        })),

      // Reports Initial State
      reports: [
        {
          id: "rep-1",
          name: "Q2 Social Sentiment Summary",
          type: "PDF",
          date: "2026-05-28T14:30:00Z",
          status: "completed",
          summary: "Comprehensive review showing a 15% increase in positive sentiment across Instagram brand mentions.",
          workspaceName: "SocialPulse AI (Global)",
          downloads: 12,
        },
        {
          id: "rep-2",
          name: "Acme Retail Competitor Analytics",
          type: "Excel",
          date: "2026-05-25T10:15:00Z",
          status: "completed",
          summary: "Multi-sheet comparison analyzing Acme Retail vs top three regional market alternatives.",
          workspaceName: "Acme Corp (Retail)",
          downloads: 5,
        },
      ],

      addReport: (report) =>
        set((state) => ({
          reports: [
            {
              ...report,
              id: `rep-${Math.random().toString(36).substring(2, 9)}`,
              date: new Date().toISOString(),
              downloads: 0,
            },
            ...state.reports,
          ],
        })),

      deleteReport: (id) =>
        set((state) => ({
          reports: state.reports.filter((r) => r.id !== id),
        })),

      incrementDownloads: (id) =>
        set((state) => ({
          reports: state.reports.map((r) =>
            r.id === id ? { ...r, downloads: r.downloads + 1 } : r
          ),
        })),

      // Settings Initial State
      apiKeys: {
        devKey: "sp_dev_8f2e9a3b1c7d4e5f6g7h8i9j",
        prodKey: "sp_prod_0a1b2c3d4e5f6g7h8i9j0k1l",
      },

      updateApiKeys: (devKey, prodKey) =>
        set({
          apiKeys: { devKey, prodKey },
        }),

      theme: "dark",
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === "dark" ? "light" : "dark",
        })),

      // Notifications Initial State
      notifications: [
        { id: "notif-1", text: "New positive comment collected from Instagram (tech_influencer)", time: "2 hours ago", read: false },
        { id: "notif-2", text: "Acme Corp workspace setup completed successfully", time: "1 day ago", read: true },
        { id: "notif-3", text: "Weekly reports PDF generated automatically", time: "2 days ago", read: true },
      ],

      addNotification: (text) =>
        set((state) => ({
          notifications: [
            {
              id: `notif-${Math.random().toString(36).substring(2, 9)}`,
              text,
              time: "Just now",
              read: false,
            },
            ...state.notifications,
          ],
        })),

      markNotificationsAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),

      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: "social-pulse-ai-storage",
    }
  )
);
