"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  name: string;
  email: string;
  plan: "Free" | "Pro" | "Enterprise";
  role: "admin" | "member" | "viewer";
  avatar?: string;
}

interface NotificationItem {
  id: string;
  text: string;
  time: string;
  read: boolean;
}

interface SaaSState {
  user: User | null;
  isAuthenticated: boolean;
  notifications: NotificationItem[];
  login: (email: string, name?: string) => void;
  register: (name: string, email: string) => void;
  logout: () => void;
  addNotification: (text: string) => void;
  markNotificationsAsRead: () => void;
  clearNotifications: () => void;
}

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop";

const createUser = (
  email: string,
  name: string,
  plan: User["plan"],
  role: User["role"]
): User => ({
  name,
  email,
  plan,
  role,
  avatar: DEFAULT_AVATAR,
});

export const useSaaSStore = create<SaaSState>()(
  persist(
    (set) => ({
      user: createUser("guest@socialpulse.ai", "Guest Explorer", "Free", "viewer"),
      isAuthenticated: true,
      notifications: [],

      login: (email, name = "Guest Explorer") =>
        set({
          isAuthenticated: true,
          user: createUser(email, name, "Pro", "admin"),
        }),

      register: (name, email) =>
        set({
          isAuthenticated: true,
          user: createUser(email, name, "Free", "admin"),
        }),

      logout: () =>
        set({
          isAuthenticated: false,
          user: null,
        }),

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
          notifications: state.notifications.map((item) => ({
            ...item,
            read: true,
          })),
        })),

      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: "social-pulse-ai-storage",
    }
  )
);