import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Sparkles, Plus } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { sendMessageToGemini } from "@/services/gemini";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { MessageInput } from "./MessageInput";
import { VoiceSettingsMenu } from "./VoiceSettingsMenu";
import { Button } from "@/components/ui/button";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useVoiceSettings } from "@/contexts/VoiceSettingsContext";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export function ChatWindow({ threadId }: { threadId: string }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastSpokenIdRef = useRef<string | null>(null);
  const sendingRef = useRef(false);

  const { voiceEnabled, rate, lang } = useVoiceSettings();
  const tts = useSpeechSynthesis();

  // Speech-to-text — auto-send recognized speech
  const stt = useSpeechRecognition({
    lang,
    onFinal: (text) => {
      setInput(text);
      // Slight delay so the user sees recognized text before send
      setTimeout(() => void handleSend(text), 200);
    },
  });

  useEffect(() => {
    if (stt.error) {
      toast.error(stt.error);
      stt.clearError();
    }
  }, [stt.error, stt]);

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

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  // Auto-speak the newest assistant message (once per id)
  useEffect(() => {
    if (!voiceEnabled || !tts.supported) return;
    const last = [...messages].reverse().find((m) => m.role === "assistant");
    if (!last) return;
    if (lastSpokenIdRef.current === last.id) return;
    lastSpokenIdRef.current = last.id;
    tts.speak(last.content, { rate, lang });
  }, [messages, voiceEnabled, rate, lang, tts]);

  // Stop speech if voice gets disabled mid-utterance
  useEffect(() => { if (!voiceEnabled) tts.stop(); }, [voiceEnabled, tts]);

  // Create a fresh thread ("New chat")
  const newChat = useMutation({
    mutationFn: async () => {
      tts.stop();
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes.user?.id;
      if (!userId) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("chat_threads")
        .insert({ user_id: userId, title: "New chat" })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      navigate({ to: "/chat/$threadId", params: { threadId: id } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to create chat"),
  });

  async function handleSend(overrideText?: string) {
    const text = (overrideText ?? input).trim();
    if (!text || isTyping || sendingRef.current) return;

    // Prevent duplicate send of identical last user message
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (lastUser && lastUser.content === text && !overrideText) {
      toast.info("Duplicate message skipped");
      return;
    }

    sendingRef.current = true;
    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes.user?.id;
    if (!userId) {
      toast.error("Not signed in");
      sendingRef.current = false;
      return;
    }

    setInput("");
    setIsTyping(true);
    tts.stop(); // stop any in-progress speech once a new send begins

    const { data: userMsg, error: userErr } = await supabase
      .from("chat_messages")
      .insert({ thread_id: threadId, user_id: userId, role: "user", content: text })
      .select("id, role, content, created_at")
      .single();
    if (userErr) {
      toast.error(userErr.message);
      setIsTyping(false);
      sendingRef.current = false;
      return;
    }

    queryClient.setQueryData<Message[]>(["messages", threadId], (prev = []) => [
      ...prev,
      userMsg as Message,
    ]);

    if (messages.length === 0) {
      const title = text.slice(0, 60);
      await supabase.from("chat_threads").update({ title }).eq("id", threadId);
    } else {
      await supabase
        .from("chat_threads")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", threadId);
    }
    queryClient.invalidateQueries({ queryKey: ["threads"] });

    try {
      // Conversation memory — send entire prior history with the request
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
      sendingRef.current = false;
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-end gap-1 px-3 py-2 border-b bg-background/60 backdrop-blur">
        <Button
          variant="outline"
          size="sm"
          onClick={() => newChat.mutate()}
          disabled={newChat.isPending}
          className="h-8"
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> New chat
        </Button>
        <VoiceSettingsMenu />
      </div>

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
        onSend={() => handleSend()}
        disabled={isTyping}
        micSupported={stt.supported}
        micStatus={stt.status}
        onMicToggle={stt.toggle}
        isSpeaking={tts.speaking}
        onStopSpeaking={tts.stop}
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
        Tap the mic to talk — I'll speak my answers back.
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
