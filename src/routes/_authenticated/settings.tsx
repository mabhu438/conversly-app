import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, LogOut, Monitor, Moon, Sun, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useVoiceSettings, type ThemePref } from "@/contexts/VoiceSettingsContext";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Sales Copilot" },
      { name: "description", content: "Appearance, chat, and account preferences." },
    ],
  }),
  component: SettingsPage,
});

const THEME_OPTIONS: { value: ThemePref; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const s = useVoiceSettings();
  const [clearing, setClearing] = useState(false);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  async function clearHistory() {
    if (!confirm("Delete all your conversations? This can't be undone.")) return;
    setClearing(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes.user?.id;
      if (!userId) throw new Error("Not signed in");
      const { error } = await supabase.from("chat_threads").delete().eq("user_id", userId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      toast.success("Chat history cleared");
      navigate({ to: "/chat" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to clear history");
    } finally {
      setClearing(false);
    }
  }

  return (
    <AppShell title="Settings">
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
        {/* Appearance */}
        <section className="rounded-2xl border bg-card shadow-sm p-6">
          <h2 className="text-base font-semibold mb-1">Appearance</h2>
          <p className="text-sm text-muted-foreground mb-4">Choose how Sales Copilot looks.</p>
          <div className="grid grid-cols-3 gap-2">
            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => s.setTheme(value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-4 text-sm transition",
                  s.theme === value
                    ? "border-primary bg-primary/5 text-foreground"
                    : "hover:bg-accent/60 text-muted-foreground",
                )}
                aria-pressed={s.theme === value}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* Chat */}
        <section className="rounded-2xl border bg-card shadow-sm p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold">Chat</h2>
            <p className="text-sm text-muted-foreground">Fine-tune the chat experience.</p>
          </div>

          <Row label="Auto-scroll to latest message" htmlFor="auto-scroll">
            <Switch id="auto-scroll" checked={s.autoScroll} onCheckedChange={s.setAutoScroll} />
          </Row>
          <Row label="Enter key sends message" htmlFor="enter-send">
            <Switch id="enter-send" checked={s.enterToSend} onCheckedChange={s.setEnterToSend} />
          </Row>
          <Row label="Speak assistant responses" htmlFor="voice-enabled">
            <Switch id="voice-enabled" checked={s.voiceEnabled} onCheckedChange={s.setVoiceEnabled} />
          </Row>

          <div className="pt-2">
            <Button variant="outline" onClick={clearHistory} disabled={clearing} className="w-full sm:w-auto">
              {clearing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Clear chat history
            </Button>
          </div>
        </section>

        {/* Account */}
        <section className="rounded-2xl border bg-card shadow-sm p-6 space-y-3">
          <h2 className="text-base font-semibold">Account</h2>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" /> Log out
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toast.info("Account deletion is handled by support — contact us to remove your data.")
              }
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete account
            </Button>
          </div>
        </section>

        {/* About */}
        <section className="rounded-2xl border bg-card shadow-sm p-6 text-sm">
          <h2 className="text-base font-semibold mb-3">About</h2>
          <dl className="grid grid-cols-2 gap-y-2 text-muted-foreground">
            <dt>Version</dt>
            <dd className="text-foreground">1.0.0</dd>
            <dt>Privacy Policy</dt>
            <dd>
              <a href="#" className="text-primary hover:underline">
                View
              </a>
            </dd>
            <dt>Terms</dt>
            <dd>
              <a href="#" className="text-primary hover:underline">
                View
              </a>
            </dd>
          </dl>
        </section>
      </div>
    </AppShell>
  );
}

function Row({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label htmlFor={htmlFor} className="text-sm font-normal">
        {label}
      </Label>
      {children}
    </div>
  );
}
