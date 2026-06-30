// Voice & appearance settings persisted in localStorage.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface VoiceSettings {
  voiceEnabled: boolean;
  rate: number; // 0.75 | 1 | 1.25 | 1.5
  lang: string; // BCP-47 e.g. "en-US"
  theme: "light" | "dark";
}

interface Ctx extends VoiceSettings {
  setVoiceEnabled: (v: boolean) => void;
  setRate: (r: number) => void;
  setLang: (l: string) => void;
  setTheme: (t: "light" | "dark") => void;
}

const DEFAULTS: VoiceSettings = {
  voiceEnabled: true,
  rate: 1,
  lang: "en-US",
  theme: "light",
};

const STORAGE_KEY = "voice-settings-v1";
const VoiceSettingsContext = createContext<Ctx | null>(null);

export function VoiceSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<VoiceSettings>(DEFAULTS);

  // Load once on mount (client only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSettings({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch { /* ignore */ }
  }, []);

  // Persist + apply theme class
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch { /* ignore */ }
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", settings.theme === "dark");
    }
  }, [settings]);

  const ctx: Ctx = {
    ...settings,
    setVoiceEnabled: (voiceEnabled) => setSettings((s) => ({ ...s, voiceEnabled })),
    setRate: (rate) => setSettings((s) => ({ ...s, rate })),
    setLang: (lang) => setSettings((s) => ({ ...s, lang })),
    setTheme: (theme) => setSettings((s) => ({ ...s, theme })),
  };

  return <VoiceSettingsContext.Provider value={ctx}>{children}</VoiceSettingsContext.Provider>;
}

export function useVoiceSettings(): Ctx {
  const ctx = useContext(VoiceSettingsContext);
  if (!ctx) throw new Error("useVoiceSettings must be used within VoiceSettingsProvider");
  return ctx;
}
