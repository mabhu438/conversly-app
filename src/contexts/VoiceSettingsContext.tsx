// App-wide settings (voice + appearance + chat behavior) persisted in localStorage.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemePref = "light" | "dark" | "system";

export interface VoiceSettings {
  voiceEnabled: boolean;
  rate: number; // 0.75 | 1 | 1.25 | 1.5
  lang: string; // BCP-47 e.g. "en-US"
  theme: ThemePref;
  autoScroll: boolean;
  enterToSend: boolean;
}

interface Ctx extends VoiceSettings {
  setVoiceEnabled: (v: boolean) => void;
  setRate: (r: number) => void;
  setLang: (l: string) => void;
  setTheme: (t: ThemePref) => void;
  setAutoScroll: (v: boolean) => void;
  setEnterToSend: (v: boolean) => void;
}

const DEFAULTS: VoiceSettings = {
  voiceEnabled: true,
  rate: 1,
  lang: "en-US",
  theme: "system",
  autoScroll: true,
  enterToSend: true,
};

const STORAGE_KEY = "voice-settings-v1";
const VoiceSettingsContext = createContext<Ctx | null>(null);

function applyTheme(pref: ThemePref) {
  if (typeof document === "undefined") return;
  const isDark =
    pref === "dark" ||
    (pref === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
}

export function VoiceSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<VoiceSettings>(DEFAULTS);

  // Load once on mount (client only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Migrate legacy boolean-style theme
        if (parsed.theme !== "light" && parsed.theme !== "dark" && parsed.theme !== "system") {
          parsed.theme = "system";
        }
        setSettings({ ...DEFAULTS, ...parsed });
      }
    } catch { /* ignore */ }
  }, []);

  // Persist + apply theme
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch { /* ignore */ }
    applyTheme(settings.theme);
  }, [settings]);

  // React to system theme changes when in "system" mode
  useEffect(() => {
    if (settings.theme !== "system" || typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => applyTheme("system");
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, [settings.theme]);

  const ctx: Ctx = {
    ...settings,
    setVoiceEnabled: (voiceEnabled) => setSettings((s) => ({ ...s, voiceEnabled })),
    setRate: (rate) => setSettings((s) => ({ ...s, rate })),
    setLang: (lang) => setSettings((s) => ({ ...s, lang })),
    setTheme: (theme) => setSettings((s) => ({ ...s, theme })),
    setAutoScroll: (autoScroll) => setSettings((s) => ({ ...s, autoScroll })),
    setEnterToSend: (enterToSend) => setSettings((s) => ({ ...s, enterToSend })),
  };

  return <VoiceSettingsContext.Provider value={ctx}>{children}</VoiceSettingsContext.Provider>;
}

export function useVoiceSettings(): Ctx {
  const ctx = useContext(VoiceSettingsContext);
  if (!ctx) throw new Error("useVoiceSettings must be used within VoiceSettingsProvider");
  return ctx;
}
