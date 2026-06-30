// Browser Web Speech API recognition hook.
// Returns helpers to start/stop listening + status, errors, and live transcript.
import { useCallback, useEffect, useRef, useState } from "react";

type RecognitionStatus = "idle" | "listening" | "processing";

// The Web Speech API isn't in TS lib.dom types — declare minimal shapes.
interface SRAlternative { transcript: string }
interface SRResult { 0: SRAlternative; isFinal: boolean; length: number }
interface SREvent { resultIndex: number; results: ArrayLike<SRResult> }
interface SRErrorEvent { error: string; message?: string }
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SREvent) => void) | null;
  onerror: ((e: SRErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}
type SRCtor = new () => SpeechRecognitionLike;

function getCtor(): SRCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export interface UseSpeechRecognitionOptions {
  lang?: string;
  onFinal?: (text: string) => void;
}

export function useSpeechRecognition({ lang = "en-US", onFinal }: UseSpeechRecognitionOptions = {}) {
  const supported = typeof window !== "undefined" && !!getCtor();
  const [status, setStatus] = useState<RecognitionStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef<string>("");
  const onFinalRef = useRef(onFinal);
  useEffect(() => { onFinalRef.current = onFinal; }, [onFinal]);

  const stop = useCallback(() => {
    try { recRef.current?.stop(); } catch { /* noop */ }
  }, []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) {
      setError("Speech recognition isn't supported in this browser.");
      return;
    }
    if (recRef.current) { stop(); return; }

    setError(null);
    setTranscript("");
    finalRef.current = "";

    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = true;

    rec.onstart = () => setStatus("listening");
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const txt = r[0].transcript;
        if (r.isFinal) finalRef.current += txt;
        else interim += txt;
      }
      setTranscript(finalRef.current + interim);
    };
    rec.onerror = (e) => {
      const map: Record<string, string> = {
        "not-allowed": "Microphone permission denied.",
        "service-not-allowed": "Microphone permission denied.",
        "no-speech": "No speech detected. Try again.",
        "audio-capture": "No microphone found.",
        "network": "Network error while recognizing speech.",
        "aborted": "",
      };
      const msg = map[e.error] ?? "Speech recognition failed. Please try again.";
      if (msg) setError(msg);
    };
    rec.onend = () => {
      setStatus("processing");
      const finalText = finalRef.current.trim();
      recRef.current = null;
      if (finalText) onFinalRef.current?.(finalText);
      setStatus("idle");
    };

    try {
      rec.start();
      recRef.current = rec;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start microphone.");
      recRef.current = null;
    }
  }, [lang, stop]);

  // Cleanup on unmount
  useEffect(() => () => { try { recRef.current?.abort(); } catch { /* noop */ } }, []);

  const toggle = useCallback(() => {
    if (recRef.current) stop();
    else start();
  }, [start, stop]);

  return { supported, status, transcript, error, start, stop, toggle, clearError: () => setError(null) };
}
