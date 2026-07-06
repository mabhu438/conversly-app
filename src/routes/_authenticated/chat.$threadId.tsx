import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy thread URLs redirect to the single voice call screen.
export const Route = createFileRoute("/_authenticated/chat/$threadId")({
  beforeLoad: () => {
    throw redirect({ to: "/chat" });
  },
});
