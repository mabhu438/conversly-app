import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, MessageSquare, Trash2, LogOut, Sparkles, Loader2, User, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Thread {
  id: string;
  title: string;
  updated_at: string;
}

export function ThreadSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const params = useParams({ strict: false }) as { threadId?: string };
  const activeId = params.threadId;

  const { data: threads = [], isLoading } = useQuery({
    queryKey: ["threads"],
    queryFn: async (): Promise<Thread[]> => {
      const { data, error } = await supabase
        .from("chat_threads")
        .select("id, title, updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const createThread = useMutation({
    mutationFn: async () => {
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
      onNavigate?.();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to create chat"),
  });

  const deleteThread = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("chat_threads").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      if (activeId === id) navigate({ to: "/chat" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to delete"),
  });

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <aside className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground border-r">
      <div className="flex items-center gap-2 px-4 py-4 border-b">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg brand-gradient text-white">
          <Sparkles className="h-4 w-4" />
        </div>
        <span className="font-semibold truncate">Sales Copilot</span>
      </div>

      <div className="p-3">
        <Button
          className="w-full justify-start"
          onClick={() => createThread.mutate()}
          disabled={createThread.isPending}
        >
          {createThread.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          New chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        <p className="px-2 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Conversations
        </p>
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : threads.length === 0 ? (
          <p className="px-3 py-6 text-sm text-muted-foreground text-center">
            No chats yet. Start a new conversation.
          </p>
        ) : (
          <ul className="space-y-1">
            {threads.map((t) => {
              const isActive = t.id === activeId;
              return (
                <li key={t.id} className="group relative">
                  <Link
                    to="/chat/$threadId"
                    params={{ threadId: t.id }}
                    onClick={() => onNavigate?.()}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors min-w-0",
                      isActive
                        ? "bg-accent text-accent-foreground font-medium"
                        : "hover:bg-accent/60",
                    )}
                  >
                    <MessageSquare className="h-4 w-4 shrink-0 opacity-70" />
                    <span className="truncate flex-1">{t.title || "New chat"}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (confirm("Delete this conversation?")) deleteThread.mutate(t.id);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition"
                    aria-label="Delete conversation"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border-t p-2 space-y-1">
        <Button variant="ghost" asChild className="w-full justify-start text-muted-foreground hover:text-foreground">
          <Link to="/profile" onClick={() => onNavigate?.()}>
            <User className="mr-2 h-4 w-4" /> Profile
          </Link>
        </Button>
        <Button variant="ghost" asChild className="w-full justify-start text-muted-foreground hover:text-foreground">
          <Link to="/settings" onClick={() => onNavigate?.()}>
            <Settings className="mr-2 h-4 w-4" /> Settings
          </Link>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
