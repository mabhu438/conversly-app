# Sales Copilot — AI Sales Chatbot

A modern, fully responsive AI sales chatbot built with React, Vite, TanStack Start, Tailwind CSS v4, and Lovable Cloud (auth + database). Bot replies are currently mocked and ready to be swapped for the Google Gemini API without changing the UI.

## Features

- Clean, ChatGPT/Gemini-style chat UI (desktop, tablet, mobile)
- Email/password and Google sign-in
- Multiple persistent conversation threads (sidebar with new/delete)
- User messages on the right, bot messages on the left with smooth bubble animations
- Auto-scroll to latest message
- Enter-to-send, disabled send button when input is empty
- Typing indicator while the bot "thinks" (1–2s)
- Per-user data isolation via row-level security
- Drop-in Gemini integration point in `src/services/gemini.ts`

## Folder structure

```
src/
├── components/
│   ├── chat/
│   │   ├── ChatWindow.tsx       # Scrollable chat + input
│   │   ├── MessageBubble.tsx    # User/assistant bubble
│   │   ├── MessageInput.tsx     # Textarea + send button
│   │   ├── ThreadSidebar.tsx    # Conversation list + sign out
│   │   └── TypingIndicator.tsx  # Animated dots
│   └── ui/                      # shadcn primitives
├── routes/
│   ├── auth.tsx                 # Sign-in / sign-up page
│   ├── index.tsx                # Redirects to /chat
│   └── _authenticated/          # Auth-gated section
│       ├── route.tsx            # Auth guard
│       ├── chat.tsx             # Sidebar + outlet layout
│       ├── chat.index.tsx       # Picks latest / creates thread
│       └── chat.$threadId.tsx   # Active conversation
├── services/
│   └── gemini.ts                # Dummy Gemini service (replace later)
└── styles.css                   # Design tokens (Tailwind v4)
```

## Local setup

```bash
bun install
bun run dev
```

The app runs at http://localhost:8080.

## Switching to the real Gemini API

`src/services/gemini.ts` exports `sendMessageToGemini(userMessage, history)`. The UI calls this function and does not care how a reply is produced. To use the real Gemini API:

1. Move the call to a server function (do **not** put the API key in the browser).
2. Inside the server handler, call Gemini:
   ```ts
   import { GoogleGenerativeAI } from "@google/generative-ai";
   const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
   const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
   const result = await model.generateContent(userMessage);
   return result.response.text();
   ```
3. Have `sendMessageToGemini` call your server function. The UI stays the same.

## Deployment

This project is built on TanStack Start and runs on Lovable's hosted infrastructure. Click **Publish** in the Lovable editor to deploy. For other hosts (e.g. Vercel), follow TanStack Start's adapter docs and supply the same `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` environment variables.
