"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemePreference = "light" | "dark" | "system";
export type BoardView = "kanban" | "list";

type UiState = {
  theme: ThemePreference;
  view: BoardView;
  sidebarOpen: boolean;
  setTheme: (theme: ThemePreference) => void;
  setView: (view: BoardView) => void;
  setSidebarOpen: (open: boolean) => void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: "system",
      view: "kanban",
      sidebarOpen: false,
      setTheme: (theme) => set({ theme }),
      setView: (view) => set({ view }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
    }),
    { name: "jobflow-ui", partialize: (state) => ({ theme: state.theme, view: state.view }) },
  ),
);

export function applyTheme(theme: ThemePreference) {
  if (typeof document === "undefined") return;
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}
