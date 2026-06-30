// Browser Speech Synthesis (TTS) hook.
// Speaks AI replies; cancels prior utterance when a new one arrives.
import { useCallback, useEffect, useRef, useState } from "react";

export function useSpeechSynthesis() {
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const [speaking, setSpeaking] = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    if (!supported) return;
    try { window.speechSynthesis.cancel(); } catch { /* noop */ }
    utterRef.current = null;
    setSpeaking(false);
  }, [supported]);

  const speak = useCallback(
    (text: string, opts: { rate?: number; lang?: string } = {}) => {
      if (!supported || !text) return;
      try {
        // Always interrupt any in-progress speech so only the newest reply plays.
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = opts.rate ?? 1;
        if (opts.lang) u.lang = opts.lang;
        u.onstart = () => setSpeaking(true);
        u.onend = () => { setSpeaking(false); utterRef.current = null; };
        u.onerror = () => { setSpeaking(false); utterRef.current = null; };
        utterRef.current = u;
        window.speechSynthesis.speak(u);
      } catch {
        setSpeaking(false);
      }
    },
    [supported],
  );

  // Cleanup on unmount — avoid leaking audio between routes
  useEffect(() => () => { if (supported) try { window.speechSynthesis.cancel(); } catch { /* noop */ } }, [supported]);

  return { supported, speaking, speak, stop };
}
