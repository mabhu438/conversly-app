// services/gemini.ts
//
// Chat service — sends user messages to the backend AI server.
// Backend URL is configurable via VITE_CHAT_API_URL (defaults to
// https://ai-sales-chatbot-backend.onrender.com/chat for local development).

// Provide minimal typing for Vite's import.meta.env to satisfy TS.
interface ImportMetaEnv {
  VITE_CHAT_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

const CHAT_API_URL =
  (import.meta.env.VITE_CHAT_API_URL as string | undefined) ??
  "https://ai-sales-chatbot-backend.onrender.com/chat";

/**
 * Send a message to the backend AI server.
 *
 * @param userMessage  latest user input
 * @param _history     prior conversation turns (kept for future use)
 * @returns assistant reply text
 * @throws Error with a user-friendly message when the request fails
 */
export async function sendMessageToGemini(
  userMessage: string,
  _history: ChatTurn[] = [],
): Promise<string> {
  try {
    const res = await fetch(CHAT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage }),
    });

    if (!res.ok) {
      throw new Error(`Server responded with ${res.status}`);
    }

    const data = (await res.json()) as { reply?: string };
    if (typeof data.reply !== "string") {
      throw new Error("Malformed server response");
    }
    return data.reply;
  } catch (err) {
    // Normalize all failures (network errors, bad status, bad payload)
    // into the user-facing message required by the product spec.
    console.error("[chat] backend request failed:", err);
    throw new Error("Unable to contact the AI server. Please try again.");
  }
}
