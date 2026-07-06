// Voice-call style AI assistant.
// State machine: idle → listening → processing → speaking → listening ...
// Uses browser SpeechRecognition + SpeechSynthesis directly so we can
// restart recognition automatically after each AI reply — no button
// press per turn, feels like a phone call.
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Mic, MicOff, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendMessageToGemini, type ChatTurn } from "@/services/gemini";
import { toast } from "sonner";

type CallStatus = "idle" | "listening" | "processing" | "speaking";

interface Line {
  id: string;
  role: "user" | "assistant";
  text: string;
}

// --- Minimal typings for the Web Speech API (not in lib.dom) ---
interface SRAlternative { transcript: string }
interface SRResult { 0: SRAlternative; isFinal: boolean; length: number }
interface SREvent { resultIndex: number; results: ArrayLike<SRResult> }
interface SRErrorEvent { error: string; message?: string }
interface SpeechRecognitionLike {
  lang: string; continuous: boolean; interimResults: boolean;
  start(): void; stop(): void; abort(): void;
  onresult: ((e: SREvent) => void) | null;
  onerror: ((e: SRErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}
type SRCtor = new () => SpeechRecognitionLike;
function getSRCtor(): SRCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function CallScreen() {
  const [status, setStatus] = useState<CallStatus>("idle");
  const [muted, setMuted] = useState(false);
  const [interim, setInterim] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [inCall, setInCall] = useState(false);

  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef("");
  const historyRef = useRef<ChatTurn[]>([]);
  const inCallRef = useRef(false);
  const mutedRef = useRef(false);
  const statusRef = useRef<CallStatus>("idle");
  const transcriptRef = useRef<HTMLDivElement>(null);

  const supported =
    typeof window !== "undefined" && !!getSRCtor() && "speechSynthesis" in window;

  const setStatusBoth = (s: CallStatus) => { statusRef.current = s; setStatus(s); };

  const stopRecognition = useCallback(() => {
    try { recRef.current?.abort(); } catch { /* noop */ }
    recRef.current = null;
  }, []);

  const startRecognition = useCallback(() => {
    if (!inCallRef.current || mutedRef.current) return;
    const Ctor = getSRCtor();
    if (!Ctor) return;
    if (recRef.current) return; // already listening
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    finalRef.current = "";
    setInterim("");

    rec.onstart = () => setStatusBoth("listening");
    rec.onresult = (e) => {
      let live = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalRef.current += r[0].transcript + " ";
        else live += r[0].transcript;
      }
      setInterim(live);
    };
    rec.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        toast.error("Microphone permission denied.");
        endCallInternal();
        return;
      }
      // Other transient errors — recognizer will fire onend; restart there.
    };
    rec.onend = () => {
      recRef.current = null;
      const finalText = finalRef.current.trim();
      finalRef.current = "";
      setInterim("");
      if (!inCallRef.current) return;

      if (finalText) {
        void handleUserUtterance(finalText);
      } else if (!mutedRef.current && statusRef.current === "listening") {
        // Silence with no speech — keep listening.
        startRecognition();
      }
    };

    try {
      rec.start();
      recRef.current = rec;
    } catch {
      recRef.current = null;
      // Chrome throws if start() is called before the previous instance
      // fully released. Retry shortly.
      setTimeout(() => startRecognition(), 250);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!("speechSynthesis" in window)) return resolve();
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 1;
        u.lang = "en-US";
        u.onend = () => resolve();
        u.onerror = () => resolve();
        window.speechSynthesis.speak(u);
      } catch { resolve(); }
    });
  }, []);

  const handleUserUtterance = useCallback(async (text: string) => {
    stopRecognition();
    setStatusBoth("processing");
    const userLine: Line = { id: crypto.randomUUID(), role: "user", text };
    setLines((prev) => [...prev, userLine]);

    let reply = "";
    try {
      reply = await sendMessageToGemini(text, historyRef.current);
    } catch (err) {
      reply = err instanceof Error ? err.message : "Sorry, I couldn't reach the AI.";
    }

    historyRef.current = [
      ...historyRef.current,
      { role: "user", content: text },
      { role: "assistant", content: reply },
    ];
    const botLine: Line = { id: crypto.randomUUID(), role: "assistant", text: reply };
    setLines((prev) => [...prev, botLine]);

    if (!inCallRef.current) return;
    setStatusBoth("speaking");
    await speak(reply);
    if (!inCallRef.current) return;
    // Resume listening automatically — the phone-call loop.
    if (!mutedRef.current) startRecognition();
    else setStatusBoth("idle");
  }, [speak, startRecognition, stopRecognition]);

  const endCallInternal = useCallback(() => {
    inCallRef.current = false;
    setInCall(false);
    stopRecognition();
    try { window.speechSynthesis.cancel(); } catch { /* noop */ }
    setInterim("");
    setStatusBoth("idle");
  }, [stopRecognition]);

  const startCall = useCallback(async () => {
    if (!supported) {
      toast.error("Voice calls need a browser with speech recognition (try Chrome).");
      return;
    }
    try {
      // Explicit mic permission prompt.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Immediately release — recognition opens its own stream.
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      toast.error("Microphone permission is required to start a call.");
      return;
    }
    inCallRef.current = true;
    setInCall(true);
    mutedRef.current = false;
    setMuted(false);
    startRecognition();
  }, [supported, startRecognition]);

  const toggleMute = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    if (next) {
      stopRecognition();
      setStatusBoth("idle");
    } else if (inCallRef.current && statusRef.current !== "speaking") {
      startRecognition();
    }
  }, [startRecognition, stopRecognition]);

  // Cleanup on unmount
  useEffect(() => () => {
    inCallRef.current = false;
    try { recRef.current?.abort(); } catch { /* noop */ }
    try { window.speechSynthesis.cancel(); } catch { /* noop */ }
  }, []);

  // Auto-scroll transcript
  useEffect(() => {
    const el = transcriptRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [lines, interim]);

  const statusLabel: Record<CallStatus, string> = {
    idle: inCall ? "On call" : "Ready to call",
    listening: "Listening…",
    processing: "Thinking…",
    speaking: "Speaking…",
  };

  return (
    <div className="flex h-full min-h-screen w-full flex-col items-center bg-gradient-to-b from-background via-background to-muted/40">
      <div className="flex w-full max-w-md flex-1 flex-col items-center px-5 pt-10 pb-6 sm:pt-16">
        {/* Avatar with pulse */}
        <div className="relative mb-6">
          <AnimatePresence>
            {status === "listening" && (
              <motion.span
                key="pulse"
                initial={{ scale: 0.9, opacity: 0.7 }}
                animate={{ scale: 1.4, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                className="absolute inset-0 rounded-full bg-primary/40"
              />
            )}
          </AnimatePresence>
          <motion.div
            animate={
              status === "speaking"
                ? { scale: [1, 1.05, 1] }
                : status === "processing"
                ? { rotate: 360 }
                : { scale: 1 }
            }
            transition={
              status === "speaking"
                ? { duration: 0.9, repeat: Infinity }
                : status === "processing"
                ? { duration: 2.5, repeat: Infinity, ease: "linear" }
                : { duration: 0.3 }
            }
            className="relative grid h-36 w-36 place-items-center rounded-full brand-gradient text-white shadow-2xl"
          >
            <Sparkles className="h-14 w-14" />
          </motion.div>
        </div>

        <h1 className="text-xl font-semibold">Sales Copilot</h1>
        <p className="mt-1 text-sm text-muted-foreground">AI Voice Assistant</p>

        <div className="mt-4 flex items-center gap-2">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              status === "listening"
                ? "bg-emerald-500 animate-pulse"
                : status === "processing"
                ? "bg-amber-500 animate-pulse"
                : status === "speaking"
                ? "bg-sky-500 animate-pulse"
                : inCall
                ? "bg-muted-foreground"
                : "bg-muted-foreground/40"
            }`}
          />
          <span className="text-sm font-medium">{statusLabel[status]}</span>
        </div>

        {/* Transcript */}
        <div
          ref={transcriptRef}
          className="mt-6 w-full flex-1 min-h-[180px] max-h-[45vh] overflow-y-auto rounded-2xl border bg-card/60 backdrop-blur px-4 py-4 space-y-3"
        >
          {lines.length === 0 && !interim ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              {inCall
                ? "Say hello — I'm listening."
                : "Press the green button to start a voice call."}
            </p>
          ) : (
            <>
              {lines.map((l) => (
                <div
                  key={l.id}
                  className={`text-sm leading-relaxed ${
                    l.role === "user" ? "text-foreground" : "text-primary"
                  }`}
                >
                  <span className="mr-2 text-[10px] uppercase tracking-wider font-semibold opacity-60">
                    {l.role === "user" ? "You" : "AI"}
                  </span>
                  {l.text}
                </div>
              ))}
              {interim && (
                <div className="text-sm italic text-muted-foreground">
                  <span className="mr-2 text-[10px] uppercase tracking-wider font-semibold opacity-60">
                    You
                  </span>
                  {interim}
                </div>
              )}
            </>
          )}
        </div>

        {/* Controls */}
        <div className="mt-8 flex items-center justify-center gap-6">
          {inCall && (
            <Button
              variant="outline"
              size="icon"
              onClick={toggleMute}
              className="h-14 w-14 rounded-full"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </Button>
          )}

          {!inCall ? (
            <Button
              onClick={startCall}
              className="h-16 w-16 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
              aria-label="Start call"
            >
              <Phone className="h-7 w-7" />
            </Button>
          ) : (
            <Button
              onClick={endCallInternal}
              className="h-16 w-16 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg"
              aria-label="End call"
            >
              <PhoneOff className="h-7 w-7" />
            </Button>
          )}
        </div>

        {!supported && (
          <p className="mt-6 text-center text-xs text-destructive">
            Your browser doesn't support voice calls. Please use Chrome or Edge on desktop or Android.
          </p>
        )}
      </div>
    </div>
  );
}
