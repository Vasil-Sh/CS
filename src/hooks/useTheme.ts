import { useCallback, useEffect, useSyncExternalStore } from "react";
import { UserDataService } from "@/lib/userDataService";

export type ThemePreference = "light" | "dark" | "system";
type Theme = "light" | "dark";
const THEME_KEY = "matchiq_theme";
const THEME_EVENT = "matchiq:theme-change";
let memoryPreference: ThemePreference = "light";

function getPreference(): ThemePreference {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === "dark" || value === "system" ? value : "light";
  } catch {
    return memoryPreference;
  }
}

function systemTheme(): Theme {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function snapshot() {
  const preference = getPreference();
  return `${preference}:${preference === "system" ? systemTheme() : preference}`;
}

function subscribe(update: () => void) {
  const media = window.matchMedia?.("(prefers-color-scheme: dark)");
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_KEY || event.key === null) update();
  };
  window.addEventListener(THEME_EVENT, update);
  window.addEventListener("storage", onStorage);
  media?.addEventListener("change", update);
  return () => {
    window.removeEventListener(THEME_EVENT, update);
    window.removeEventListener("storage", onStorage);
    media?.removeEventListener("change", update);
  };
}

export function useTheme() {
  const state = useSyncExternalStore(subscribe, snapshot, () => "light:light");
  const [preference, theme] = state.split(":") as [ThemePreference, Theme];

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const setTheme = useCallback((next: ThemePreference) => {
    memoryPreference = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* Session fallback. */
    }
    window.dispatchEvent(new Event(THEME_EVENT));
    UserDataService.saveUserPrefs({ preferences: { theme: next } }).catch(
      () => {},
    );
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light");
  }, [theme, setTheme]);

  return { theme, preference, setTheme, toggleTheme };
}
