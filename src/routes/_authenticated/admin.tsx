import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  MessageSquare, Users, Activity, Calendar, ArrowLeft, ShieldCheck,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin dashboard — Sales Copilot" },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async () => {
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (!uid) throw redirect({ to: "/auth" });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    if (!(roles ?? []).some((r) => r.role === "admin")) {
      throw redirect({ to: "/chat" });
    }
  },
  component: AdminDashboard,
});

interface AdminStats {
  totalUsers: number;
  totalThreads: number;
  totalMessages: number;
  messagesToday: number;
  activeUsers7d: number;
}

function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async (): Promise<AdminStats> => {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const [users, threads, messages, today, active] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("chat_threads").select("id", { count: "exact", head: true }),
        supabase.from("chat_messages").select("id", { count: "exact", head: true }),
        supabase
          .from("chat_messages")
          .select("id", { count: "exact", head: true })
          .gte("created_at", startOfToday.toISOString()),
        supabase
          .from("chat_messages")
          .select("user_id")
          .gte("created_at", since),
      ]);

      const uniqueActive = new Set((active.data ?? []).map((r: { user_id: string }) => r.user_id));

      return {
        totalUsers: users.count ?? 0,
        totalThreads: threads.count ?? 0,
        totalMessages: messages.count ?? 0,
        messagesToday: today.count ?? 0,
        activeUsers7d: uniqueActive.size,
      };
    },
  });

  const { data: recentThreads = [], isLoading: threadsLoading } = useQuery({
    queryKey: ["admin-recent-threads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_threads")
        .select("id, title, user_id, updated_at")
        .order("updated_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  const stats: Array<{ label: string; value: number | undefined; icon: typeof Users }> = [
    { label: "Total users", value: data?.totalUsers, icon: Users },
    { label: "Active users (7d)", value: data?.activeUsers7d, icon: Activity },
    { label: "Total chats", value: data?.totalThreads, icon: MessageSquare },
    { label: "Messages today", value: data?.messagesToday, icon: Calendar },
    { label: "Total messages", value: data?.totalMessages, icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/60 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/chat"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
          </Button>
          <div className="grid h-9 w-9 place-items-center rounded-lg brand-gradient text-white">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">Admin dashboard</h1>
            <p className="text-xs text-muted-foreground">Usage across the workspace</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-8">
        <section className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {s.label}
                </CardTitle>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-3xl font-bold tabular-nums">{s.value ?? 0}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent conversations</CardTitle>
            </CardHeader>
            <CardContent>
              {threadsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : recentThreads.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No conversations yet.</p>
              ) : (
                <ul className="divide-y">
                  {recentThreads.map((t) => (
                    <li key={t.id} className="flex items-center justify-between py-3 gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{t.title || "New chat"}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          user {t.user_id.slice(0, 8)}… • updated {new Date(t.updated_at).toLocaleString()}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
