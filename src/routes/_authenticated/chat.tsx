import { createFileRoute, Outlet, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, Sparkles } from "lucide-react";
import { ThreadSidebar } from "@/components/chat/ThreadSidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({
    meta: [
      { title: "Sales Copilot — AI Sales Chat" },
      { name: "description", content: "Chat with your AI sales assistant." },
    ],
  }),
  component: ChatLayout,
});

function ChatLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const params = useParams({ strict: false }) as { threadId?: string };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-72 lg:w-80 shrink-0">
        <ThreadSidebar />
      </div>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden flex items-center gap-2 px-3 py-3 border-b bg-background">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <SheetTitle className="sr-only">Conversations</SheetTitle>
              <ThreadSidebar onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2 min-w-0">
            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg brand-gradient text-white">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <span className="font-semibold truncate">Sales Copilot</span>
          </div>
        </header>

        {/* Desktop header */}
        <header className="hidden md:flex items-center justify-between px-6 py-3 border-b bg-background/60 backdrop-blur">
          <h1 className="text-sm font-medium text-muted-foreground">
            {params.threadId ? "Conversation" : "Start a new conversation"}
          </h1>
        </header>

        <main className="flex-1 min-h-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
