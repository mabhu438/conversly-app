import { useRef, useEffect } from "react";
import { Send, Mic, MicOff, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;

  // Voice integration
  micSupported?: boolean;
  micStatus?: "idle" | "listening" | "processing";
  onMicToggle?: () => void;

  // TTS integration
  isSpeaking?: boolean;
  onStopSpeaking?: () => void;
}

export function MessageInput({
  value,
  onChange,
  onSend,
  disabled,
  micSupported,
  micStatus = "idle",
  onMicToggle,
  isSpeaking,
  onStopSpeaking,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [value]);

  useEffect(() => { ref.current?.focus(); }, []);

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSend();
    }
  }

  const canSend = !disabled && value.trim().length > 0;
  const listening = micStatus === "listening";

  return (
    <div className="border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-3xl px-4 py-3">
        {isSpeaking && (
          <div className="mb-2 flex justify-center">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onStopSpeaking}
              className="h-7 rounded-full text-xs"
            >
              <Square className="h-3 w-3 mr-1.5 fill-current" /> Stop speaking
            </Button>
          </div>
        )}
        <div
          className={cn(
            "relative flex items-end gap-2 rounded-2xl border bg-card shadow-sm focus-within:ring-2 focus-within:ring-ring/40 transition",
            listening && "ring-2 ring-destructive/40",
          )}
        >
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            placeholder={listening ? "Listening…" : "Ask about pricing, plans, or book a demo…"}
            className="flex-1 resize-none bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground max-h-40"
          />

          {micSupported && (
            <Button
              type="button"
              size="icon"
              variant={listening ? "destructive" : "ghost"}
              onClick={onMicToggle}
              className={cn("m-1.5 h-9 w-9 shrink-0 rounded-xl relative", listening && "animate-mic-pulse")}
              aria-label={listening ? "Stop recording" : "Start voice input"}
              title={listening ? "Stop recording" : "Voice input"}
            >
              {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          )}

          <Button
            type="button"
            size="icon"
            onClick={onSend}
            disabled={!canSend}
            className="m-1.5 h-9 w-9 shrink-0 rounded-xl"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {listening ? (
            <span className="text-destructive">● Listening — speak now</span>
          ) : micStatus === "processing" ? (
            "Processing…"
          ) : (
            <>
              Press <kbd className="rounded border px-1 py-0.5 text-[10px]">Enter</kbd> to send,{" "}
              <kbd className="rounded border px-1 py-0.5 text-[10px]">Shift+Enter</kbd> for new line
            </>
          )}
        </p>
      </div>
    </div>
  );
}
