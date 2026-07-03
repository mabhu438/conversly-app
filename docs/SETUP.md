# Setup Guide

## Prerequisites

- **Bun** ≥ 1.1 (or Node ≥ 20 + npm)
- A modern browser (Chrome/Edge recommended — best Web Speech API support)
- A Lovable Cloud project (Supabase auto-provisioned) — already configured for this repo

## 1. Install

```bash
git clone <your-repo-url> sales-copilot
cd sales-copilot
bun install
```

## 2. Environment Variables

Copy `.env.example` (or the values below) into `.env`:

```bash
VITE_SUPABASE_URL="https://<project>.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<publishable-anon-key>"
VITE_SUPABASE_PROJECT_ID="<project-ref>"
VITE_CHAT_API_URL="https://ai-sales-chatbot-backend.onrender.com/chat"
```

> Server-only secrets (`SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`) are stored in Lovable Cloud / Render dashboards — **never** commit them.

## 3. Database

Migrations live in `supabase/migrations/*.sql`. On Lovable Cloud they are applied automatically. For a local Supabase stack:

```bash
supabase db push
```

Schema highlights:
- `profiles` — 1:1 with `auth.users`, auto-created via trigger
- `chat_threads` — user conversations (RLS: owner-only)
- `messages` — chat turns (RLS: owner or admin)
- `user_roles` — RBAC (`admin` | `user`); read via `public.has_role(uid, role)`

## 4. Run

```bash
bun run dev          # http://localhost:8080
bun run build        # production build
bun run preview      # preview the build
```

## 5. Admin Access

The first admin is seeded in a migration. To promote another user:

```sql
insert into public.user_roles (user_id, role)
values ('<auth-user-uuid>', 'admin')
on conflict do nothing;
```

## 6. Verify

- Sign up → land in `/chat`
- Send a text message → get an AI reply
- Click the mic → speak → the transcript appears in the input
- Toggle 🔊 in Settings → AI replies are spoken
- Admins see an **Admin** link in the sidebar
