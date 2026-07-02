import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, MessageSquare, Trash2, LogOut, Sparkles, User, Settings,
  Search, Pencil, ShieldCheck, MoreVertical,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";

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
  const { isAdmin } = useUserRole();

  const [search, setSearch] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Thread | null>(null);
  const [renaming, setRenaming] = useState<Thread | null>(null);
  const [renameValue, setRenameValue] = useState("");

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((t) => (t.title || "").toLowerCase().includes(q));
  }, [threads, search]);

  const createThread = useMutation({
    mutationFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes.user?.id;
      if (!userId) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("chat_threads")
        .insert({ user_id: userId, title: "New chat" })
        .select("id").single();
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
      toast.success("Conversation deleted");
      if (activeId === id) navigate({ to: "/chat" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to delete"),
  });

  const renameThread = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const { error } = await supabase.from("chat_threads").update({ title }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      toast.success("Renamed");
      setRenaming(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to rename"),
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

      <div className="p-3 space-y-2">
        <Button
          className="w-full justify-start"
          onClick={() => createThread.mutate()}
          disabled={createThread.isPending}
        >
          <Plus className="mr-2 h-4 w-4" /> New chat
        </Button>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations"
            className="pl-8 h-9"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        <p className="px-2 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Conversations
        </p>
        {isLoading ? (
          <div className="space-y-1.5 px-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-md" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="px-3 py-6 text-sm text-muted-foreground text-center">
            {search ? "No conversations match." : "No chats yet. Start a new conversation."}
          </p>
        ) : (
          <ul className="space-y-1">
            {filtered.map((t) => {
              const isActive = t.id === activeId;
              return (
                <li key={t.id} className="group relative">
                  <Link
                    to="/chat/$threadId"
                    params={{ threadId: t.id }}
                    onClick={() => onNavigate?.()}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 pr-9 text-sm transition-colors min-w-0",
                      isActive
                        ? "bg-accent text-accent-foreground font-medium"
                        : "hover:bg-accent/60",
                    )}
                  >
                    <MessageSquare className="h-4 w-4 shrink-0 opacity-70" />
                    <span className="truncate flex-1">{t.title || "New chat"}</span>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-accent text-muted-foreground hover:text-foreground transition"
                        aria-label="Conversation options"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem
                        onClick={() => {
                          setRenameValue(t.title || "");
                          setRenaming(t);
                        }}
                      >
                        <Pencil className="mr-2 h-3.5 w-3.5" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setPendingDelete(t)}
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border-t p-2 space-y-1">
        {isAdmin && (
          <Button variant="ghost" asChild className="w-full justify-start text-muted-foreground hover:text-foreground">
            <Link to="/admin" onClick={() => onNavigate?.()}>
              <ShieldCheck className="mr-2 h-4 w-4" /> Admin
            </Link>
          </Button>
        )}
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
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              "{pendingDelete?.title || "New chat"}" and all of its messages will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) deleteThread.mutate(pendingDelete.id);
                setPendingDelete(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename dialog */}
      <Dialog open={!!renaming} onOpenChange={(o) => !o && setRenaming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename conversation</DialogTitle>
            <DialogDescription>Give this chat a name that helps you find it later.</DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            value={renameValue}
            maxLength={120}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && renameValue.trim() && renaming) {
                renameThread.mutate({ id: renaming.id, title: renameValue.trim() });
              }
            }}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenaming(null)}>Cancel</Button>
            <Button
              disabled={!renameValue.trim() || renameThread.isPending}
              onClick={() => renaming && renameThread.mutate({ id: renaming.id, title: renameValue.trim() })}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
