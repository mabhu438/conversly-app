# Sales Copilot — Presentation

> Markdown slide deck. Import into [Marp](https://marp.app), Slidev, or paste into Google Slides. Each `---` is a new slide.

---

## Sales Copilot
### An AI Voice Chatbot for Sales Teams

Production-ready · Voice-enabled · Multi-tenant with RBAC

*Built with TanStack Start, React 19, Tailwind v4, Lovable Cloud, Google Gemini*

---

## Problem Statement

- Sales reps lose deals waiting for answers to prospect questions.
- Existing chatbots are text-only, forget context, and don't scale to teams.
- Companies need an AI assistant that is **conversational, persistent, and secure**.

---

## Solution

A voice-first AI chatbot that:

- 💬 Answers prospect and product questions in natural language
- 🎙️ Accepts **voice input** and **speaks replies back**
- 🧠 Remembers the entire conversation
- 🗂️ Persists chats per user with search / rename / delete
- 🛡️ Ships with RBAC + admin dashboard out of the box

---

## Key Features

| Chat                    | Voice                | Admin                  |
| ----------------------- | -------------------- | ---------------------- |
| Multi-thread history    | Speech-to-Text (STT) | Users & message counts |
| Full conversation memory| Text-to-Speech (TTS) | Recent activity        |
| Search / rename / delete| Voice, rate, pitch   | Global moderation      |
| Mobile-responsive       | Stop-speaking control| Role-gated routes      |

---

## Architecture

```
Browser (React 19, TanStack Start)
   │
   ├─ Web Speech API  → STT / TTS (in-browser)
   ├─ Supabase JS     → Auth, chat_threads, messages (RLS)
   └─ fetch /chat     → Render Backend → Google Gemini
```

Edge-rendered on Cloudflare Workers · Postgres + Auth on Lovable Cloud (Supabase) · Chat service on Render.

---

## Workflow

1. User signs in (Email or Google OAuth).
2. Creates a new chat → `chat_threads` row.
3. Types or dictates a message → stored in `messages`.
4. Frontend POSTs `{message, history}` to the Gemini backend.
5. Assistant reply is stored, rendered, and optionally spoken aloud.
6. Sidebar updates via TanStack Query invalidation.

---

## Technology Stack

- **Frontend:** React 19, TanStack Start v1, TanStack Router/Query, Vite 7
- **UI:** Tailwind CSS v4, shadcn/ui, Radix, lucide-react
- **Backend (data):** Lovable Cloud → Supabase (Postgres, Auth, RLS)
- **Backend (AI):** Node + Express on Render
- **AI:** Google Gemini (1.5 Flash / Pro)
- **Voice:** Web Speech API (browser-native)
- **Deploy:** Cloudflare Workers (frontend) · Render (backend)

---

## AI Integration

- Frontend sends `{message, history}` for **contextual memory**.
- Backend proxies to Gemini with the API key held server-side.
- Errors normalized to a single toast; no stack traces leak to users.
- Ready to swap models — `gemini.ts` is the single integration point.

---

## Security

- **RLS** on every user-facing table (owner-scoped `auth.uid()`).
- **RBAC** via a dedicated `user_roles` table + `has_role()` SECURITY DEFINER.
- No secrets in the client — service keys stay on the server.
- HTTPS everywhere; CORS locked to production origins.

---

## Deployment

- **Frontend:** push to main → Lovable auto-builds → Cloudflare Workers edge.
- **Backend:** push to main → Render auto-deploys.
- **DB migrations:** SQL files under `supabase/migrations/`, applied automatically.
- **Uptime:** `GET /api/health` for monitors.

---

## Demo

1. Sign in with Google.
2. Click the mic → say _"What are your pricing tiers?"_
3. Watch the transcript appear and the reply spoken aloud.
4. Open a new chat → memory resets.
5. Log in as an admin → open **Admin** dashboard.

---

## Challenges

- **Hydration mismatches** in SSR for auth-gated routes → solved with `ssr:false` on the protected subtree.
- **Cross-browser Web Speech API** — Chromium-only in practice; graceful degradation elsewhere.
- **RLS recursion** on role checks → SECURITY DEFINER `has_role()` function.
- **Render cold starts** — mitigated with health-ping and user-facing loading states.

---

## Future Scope

- Streaming (SSE) responses for perceived latency wins.
- File / image uploads via Supabase Storage.
- Multi-model routing (Gemini / GPT / Claude).
- Team workspaces with shared threads.
- Analytics + CRM webhooks (HubSpot, Salesforce).

---

## Conclusion

Sales Copilot is a **secure, voice-enabled, production-ready** AI chatbot with the ergonomics of ChatGPT and the observability of an enterprise app — deployed today at **https://conversly-app.lovable.app**.

**Thank you!**
