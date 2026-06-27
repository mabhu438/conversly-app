import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { sendMessageToGemini } from "@/services/gemini";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { MessageInput } from "./MessageInput";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export function ChatWindow({ threadId }: { threadId: string }) {
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["messages", threadId],
    queryFn: async (): Promise<Message[]> => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, role, content, created_at")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Message[];
    },
  });

  // Auto-scroll to bottom on new content
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isTyping) return;

    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes.user?.id;
    if (!userId) {
      toast.error("Not signed in");
      return;
    }

    setInput("");
    setIsTyping(true);

    // Insert user message
    const { data: userMsg, error: userErr } = await supabase
      .from("chat_messages")
      .insert({ thread_id: threadId, user_id: userId, role: "user", content: text })
      .select("id, role, content, created_at")
      .single();
    if (userErr) {
      toast.error(userErr.message);
      setIsTyping(false);
      return;
    }

    // Optimistically add to cache
    queryClient.setQueryData<Message[]>(["messages", threadId], (prev = []) => [
      ...prev,
      userMsg as Message,
    ]);

    // If first message, update thread title from prompt
    if (messages.length === 0) {
      const title = text.slice(0, 60);
      await supabase.from("chat_threads").update({ title }).eq("id", threadId);
      queryClient.invalidateQueries({ queryKey: ["threads"] });
    } else {
      // Touch updated_at so it floats to the top of the sidebar
      await supabase
        .from("chat_threads")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", threadId);
      queryClient.invalidateQueries({ queryKey: ["threads"] });
    }

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const reply = await sendMessageToGemini(text, history);

      const { data: botMsg, error: botErr } = await supabase
        .from("chat_messages")
        .insert({ thread_id: threadId, user_id: userId, role: "assistant", content: reply })
        .select("id, role, content, created_at")
        .single();
      if (botErr) throw botErr;

      queryClient.setQueryData<Message[]>(["messages", threadId], (prev = []) => [
        ...prev,
        botMsg as Message,
      ]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to get reply");
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
          {isLoading ? null : messages.length === 0 ? (
            <EmptyState />
          ) : (
            messages.map((m) => (
              <MessageBubble key={m.id} role={m.role} content={m.content} />
            ))
          )}
          {isTyping && <TypingIndicator />}
        </div>
      </div>
      <MessageInput
        value={input}
        onChange={setInput}
        onSend={handleSend}
        disabled={isTyping}
      />
    </div>
  );
}

function EmptyState() {
  const suggestions = [
    "What plans do you offer?",
    "Can I book a demo?",
    "How does pricing work?",
    "Do you have a free trial?",
  ];
  return (
    <div className="flex flex-col items-center text-center py-16 px-4">
      <div className="grid h-14 w-14 place-items-center rounded-2xl brand-gradient text-white shadow-lg mb-4">
        <Sparkles className="h-7 w-7" />
      </div>
      <h2 className="text-2xl font-bold mb-2">How can I help you today?</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        I'm your AI sales assistant. Ask me about plans, pricing, demos, or anything else.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
        {suggestions.map((s) => (
          <div
            key={s}
            className="rounded-xl border bg-card px-4 py-3 text-sm text-left text-muted-foreground hover:bg-accent transition cursor-default"
          >
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}
