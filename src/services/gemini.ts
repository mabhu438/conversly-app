// services/gemini.ts
//
// Placeholder service for the Google Gemini API.
// The UI calls `sendMessageToGemini` and stays the same; swap the body
// to a real Gemini call when ready (e.g. via a server function that
// holds the API key — never expose the key in the browser).
//
// Example future implementation (server side):
//   import { GoogleGenerativeAI } from "@google/generative-ai";
//   const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
//   const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
//   const result = await model.generateContent(prompt);
//   return result.response.text();

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

const DUMMY_REPLIES = [
  "Hi! I'm your AI sales assistant. I can help you compare plans, share pricing, or book a demo — what are you exploring today?",
  "Great question. Our most popular plan includes everything you need to get started, with no setup fees. Want me to walk you through it?",
  "Absolutely — I can put together a quick proposal. Could you tell me a bit about your team size and main use case?",
  "We offer flexible monthly and annual billing, plus a 14-day free trial with no credit card required.",
  "Got it. I've noted that down. Is there anything else you'd like to know before I connect you with a specialist?",
  "Thanks for sharing! Based on what you've told me, the Pro plan looks like the best fit. Would you like to start a free trial?",
];

/**
 * Send a message to the (currently mocked) Gemini model.
 * Replace the body with a real API call without changing the signature.
 *
 * @param userMessage  latest user input
 * @param history      prior conversation turns (kept for future context)
 * @returns assistant reply text
 */
export async function sendMessageToGemini(
  userMessage: string,
  _history: ChatTurn[] = [],
): Promise<string> {
  // Simulate network/model latency (1–2s)
  const delay = 1000 + Math.random() * 1000;
  await new Promise((r) => setTimeout(r, delay));

  // Pick a contextual-ish dummy reply
  const lower = userMessage.toLowerCase();
  if (lower.includes("price") || lower.includes("cost") || lower.includes("plan")) {
    return DUMMY_REPLIES[1];
  }
  if (lower.includes("demo") || lower.includes("trial")) {
    return DUMMY_REPLIES[3];
  }
  if (lower.includes("hi") || lower.includes("hello") || lower.includes("hey")) {
    return DUMMY_REPLIES[0];
  }
  return DUMMY_REPLIES[Math.floor(Math.random() * DUMMY_REPLIES.length)];
}
