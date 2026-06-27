import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/chat/")({
  component: ChatIndex,
});

// Landing under /chat: pick the latest thread or create a new one.
function ChatIndex() {
  const navigate = useNavigate();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      const { data: existing } = await supabase
        .from("chat_threads")
        .select("id")
        .order("updated_at", { ascending: false })
        .limit(1);
      if (existing && existing.length > 0) {
        navigate({ to: "/chat/$threadId", params: { threadId: existing[0].id }, replace: true });
        return;
      }
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes.user?.id;
      if (!userId) return;
      const { data: created, error } = await supabase
        .from("chat_threads")
        .insert({ user_id: userId, title: "New chat" })
        .select("id")
        .single();
      if (!error && created) {
        navigate({ to: "/chat/$threadId", params: { threadId: created.id }, replace: true });
      }
    })();
  }, [navigate]);

  return (
    <div className="flex h-full flex-col items-center justify-center text-muted-foreground gap-3">
      <div className="grid h-12 w-12 place-items-center rounded-2xl brand-gradient text-white">
        <Sparkles className="h-6 w-6" />
      </div>
      <Loader2 className="h-4 w-4 animate-spin" />
    </div>
  );
}
