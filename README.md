# Sales Copilot — AI Voice Chatbot

Production-ready AI chatbot with voice input/output, persistent conversation history, RBAC, and an admin dashboard. Built on TanStack Start, React 19, Tailwind v4, and Lovable Cloud (Supabase).

**Live demo:** https://conversly-app.lovable.app
**Backend (chat API):** https://ai-sales-chatbot-backend.onrender.com

---

## Features

- 💬 ChatGPT / Gemini-style chat UI (desktop, tablet, mobile)
- 🎙️ Voice input via Web Speech API (SpeechRecognition)
- 🔊 Voice output via SpeechSynthesis with voice/rate/pitch settings
- 🧠 Conversation memory — full history sent per turn
- 🗂️ Persistent multi-thread history with search, rename, delete
- 👤 Email/password + Google OAuth authentication
- 🛡️ RBAC (`admin` / `user`) with a protected admin dashboard
- 📊 Admin analytics: users, messages, threads, recent activity
- ♿ A11y-focused, keyboard-friendly, mobile-responsive
- 🌓 Light/dark themes via CSS design tokens

## Tech Stack

| Layer     | Tech                                                        |
| --------- | ----------------------------------------------------------- |
| Framework | TanStack Start v1 + React 19 + Vite 7                       |
| Styling   | Tailwind CSS v4 (CSS-first, design tokens in `styles.css`)  |
| UI        | shadcn/ui + Radix primitives + lucide-react                 |
| Data      | TanStack Query v5, TanStack Router (file-based)             |
| Backend   | Lovable Cloud (Supabase) — Auth, Postgres, RLS              |
| AI        | Google Gemini via external REST backend (Render)            |
| Voice     | Web Speech API (browser-native STT + TTS)                   |
| Deploy    | Frontend: Lovable / Cloudflare Workers · Backend: Render    |

## Folder Structure

```
src/
├── components/
│   ├── AppShell.tsx
│   ├── chat/               # ChatWindow, MessageInput, ThreadSidebar, VoiceSettingsMenu, ...
│   └── ui/                 # shadcn primitives
├── contexts/               # VoiceSettingsContext
├── hooks/                  # useSpeechRecognition, useSpeechSynthesis, useUserRole
├── integrations/supabase/  # auto-generated clients (do not edit)
├── routes/
│   ├── __root.tsx          # app shell
│   ├── index.tsx           # → /chat
│   ├── auth.tsx            # sign in / sign up
│   ├── api/health.ts       # GET /api/health
│   └── _authenticated/     # gated subtree
│       ├── route.tsx       # auth guard (managed)
│       ├── chat.tsx        # sidebar layout
│       ├── chat.index.tsx  # picks/creates thread
│       ├── chat.$threadId.tsx
│       ├── profile.tsx
│       ├── settings.tsx
│       └── admin.tsx       # admin-only dashboard
├── services/gemini.ts      # POST chat backend
└── styles.css              # design tokens
supabase/migrations/        # SQL migrations (RLS, roles, tables)
docs/                       # setup, deploy, API, architecture
```

## Local Setup

```bash
bun install
bun run dev
```

App runs at http://localhost:8080. See **[docs/SETUP.md](docs/SETUP.md)** for the full guide.

## Environment Variables

Public (browser, `VITE_*`):

| Variable                       | Purpose                                |
| ------------------------------ | -------------------------------------- |
| `VITE_SUPABASE_URL`            | Supabase project URL                   |
| `VITE_SUPABASE_PUBLISHABLE_KEY`| Supabase anon/publishable key          |
| `VITE_SUPABASE_PROJECT_ID`     | Supabase project ref                   |
| `VITE_CHAT_API_URL`            | Chat backend endpoint (Render)         |

Server (never expose): `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY` (backend only). See **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**.

## Documentation

- [Setup Guide](docs/SETUP.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [API Reference](docs/API.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [Bug Fix Report](docs/BUGFIXES.md)
- [Project Handover](docs/HANDOVER.md)
- [Presentation](PRESENTATION.md)

## License

MIT
