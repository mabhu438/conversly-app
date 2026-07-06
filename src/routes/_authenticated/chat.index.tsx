import { createFileRoute, redirect } from "@tanstack/react-router";

// The parent /chat route now renders the call screen directly.
export const Route = createFileRoute("/_authenticated/chat/")({
  beforeLoad: () => {
    throw redirect({ to: "/chat" });
  },
});
