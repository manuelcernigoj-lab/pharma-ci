import { useCallback, useEffect, useState } from "react";

export type ThemeMode = "system" | "light" | "dark";

const STORAGE_KEY = "pharmaci-theme";

function getStoredMode(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "light" || v === "dark" ? v : "system";
}

function systemPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyDarkClass(isDark: boolean) {
  document.documentElement.classList.toggle("dark", isDark);
}

/**
 * Theme hook — three modes:
 *  - "system" (default): follows the OS preference, updates live if it changes.
 *  - "light" / "dark": manual override, persisted in localStorage.
 *
 * Call this once from a component that is always mounted on every page
 * (e.g. Sidebar) so the `dark` class on <html> stays in sync with the
 * chosen mode across the whole app.
 */
export function useTheme() {
  const [mode, setModeState] = useState<ThemeMode>(getStoredMode);

  // Apply the resolved theme whenever mode changes, and keep it live
  // in sync with OS changes while mode === "system".
  useEffect(() => {
    const resolveAndApply = () => {
      const isDark = mode === "system" ? systemPrefersDark() : mode === "dark";
      applyDarkClass(isDark);
    };
    resolveAndApply();

    if (mode !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    mql.addEventListener("change", resolveAndApply);
    return () => mql.removeEventListener("change", resolveAndApply);
  }, [mode]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    if (next === "system") window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  return { mode, setMode };
}
