import { createFileRoute } from "@tanstack/react-router";
import { ChatWindow } from "@/components/chat/ChatWindow";

export const Route = createFileRoute("/_authenticated/chat/$threadId")({
  component: ThreadPage,
});

function ThreadPage() {
  const { threadId } = Route.useParams();
  // key forces remount on thread change so state/messages don't bleed
  return <ChatWindow key={threadId} threadId={threadId} />;
}
