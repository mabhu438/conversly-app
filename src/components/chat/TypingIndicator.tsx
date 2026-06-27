import { Sparkles } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex w-full gap-3 justify-start animate-message-in">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full brand-gradient text-white">
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="bg-bubble-bot rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5 shadow-sm">
        <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" style={{ animationDelay: "0s" }} />
        <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" style={{ animationDelay: "0.15s" }} />
        <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" style={{ animationDelay: "0.3s" }} />
      </div>
    </div>
  );
}
