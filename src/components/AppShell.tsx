// Reusable authenticated page shell with sidebar + animated main area.
import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { motion } from "framer-motion";
import { ThreadSidebar } from "@/components/chat/ThreadSidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <div className="hidden md:flex md:w-72 lg:w-80 shrink-0">
        <ThreadSidebar />
      </div>

      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex items-center gap-2 px-4 md:px-6 py-3 border-b bg-background/70 backdrop-blur sticky top-0 z-10">
          <div className="md:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <ThreadSidebar onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>
          <h1 className="text-sm font-medium text-muted-foreground truncate">{title}</h1>
        </header>

        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="flex-1 min-h-0 overflow-y-auto"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
