import { useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

export function MessageInput({ value, onChange, onSend, disabled }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [value]);

  // Keep focus available
  useEffect(() => {
    ref.current?.focus();
  }, []);

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSend();
    }
  }

  const canSend = !disabled && value.trim().length > 0;

  return (
    <div className="border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-3xl px-4 py-3">
        <div className="relative flex items-end gap-2 rounded-2xl border bg-card shadow-sm focus-within:ring-2 focus-within:ring-ring/40 transition">
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            placeholder="Ask about pricing, plans, or book a demo…"
            className="flex-1 resize-none bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground max-h-40"
          />
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
          Press <kbd className="rounded border px-1 py-0.5 text-[10px]">Enter</kbd> to send,{" "}
          <kbd className="rounded border px-1 py-0.5 text-[10px]">Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
}
