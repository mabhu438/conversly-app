import { createFileRoute } from "@tanstack/react-router";
import { CallScreen } from "@/components/call/CallScreen";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({
    meta: [
      { title: "Sales Copilot — Voice Call Assistant" },
      { name: "description", content: "Talk to your AI sales assistant over a live voice call." },
    ],
  }),
  component: () => <CallScreen />,
});
