// services/gemini.ts
//
// Chat service — sends user messages + prior history to the backend AI server.
// Backend URL is configurable via VITE_CHAT_API_URL.

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

const CHAT_API_URL =
  (import.meta.env.VITE_CHAT_API_URL as string | undefined) ??
  "https://ai-sales-chatbot-backend.onrender.com/chat";

/**
 * Send a user message + conversation history to the backend.
 * The backend receives both `message` (latest input) and `history`
 * (full prior conversation) so the AI keeps context across turns.
 */
export async function sendMessageToGemini(
  userMessage: string,
  history: ChatTurn[] = [],
): Promise<string> {
  try {
    const res = await fetch(CHAT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage, history }),
    });

    if (!res.ok) throw new Error(`Server responded with ${res.status}`);

    const data = (await res.json()) as { reply?: string };
    if (typeof data.reply !== "string") throw new Error("Malformed server response");
    return data.reply;
  } catch (err) {
    console.error("[chat] backend request failed:", err);
    throw new Error("Unable to contact the AI server. Please try again.");
  }
}
