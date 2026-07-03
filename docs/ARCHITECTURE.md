# Architecture

## High-level

```
 ┌──────────────┐      HTTPS       ┌────────────────────┐
 │  Browser     │ ───────────────▶ │  TanStack Start    │
 │  (React 19)  │                  │  (CF Workers edge) │
 └──────┬───────┘                  └─────────┬──────────┘
        │ Web Speech API                     │ Supabase JS
        │ (STT + TTS)                        │
        │                                    ▼
        │                        ┌─────────────────────┐
        │ fetch VITE_CHAT_API_URL│  Lovable Cloud      │
        └───────────────┐        │  (Postgres + Auth)  │
                        ▼        └─────────────────────┘
              ┌───────────────────┐
              │  Render Backend   │
              │  Node + Gemini    │
              └───────────────────┘
```

## Frontend

- **Router**: TanStack Router file-based routing. `_authenticated/` is `ssr:false` and gated client-side by `supabase.auth.getUser()`.
- **State**: TanStack Query for server state; React state for local UI; a small `VoiceSettingsContext` for TTS prefs (persisted in `localStorage`).
- **Voice**: `useSpeechRecognition` wraps `webkitSpeechRecognition`; `useSpeechSynthesis` wraps `speechSynthesis`. Both degrade gracefully when unsupported.
- **Design tokens**: Tailwind v4 CSS-first, tokens in `src/styles.css` (HSL variables, dark mode via `.dark`).

## Data model

- `profiles` — user metadata, autopopulated by `handle_new_user()` trigger.
- `chat_threads` — one per conversation (`user_id`, `title`, `updated_at`).
- `messages` — `{thread_id, role, content, created_at}`.
- `user_roles` — RBAC; enum `app_role = ('admin','user')`. `has_role(uid, role)` used in RLS policies to prevent recursion.

## RLS

- Owners can read/write their own threads and messages.
- Admins can read/delete all threads, messages, and profiles.
- `user_roles` is readable by the authenticated user; only service_role writes.

## Chat flow

1. User types or dictates a message.
2. Client inserts a `messages` row (`role='user'`).
3. Client sends `{message, history}` to `VITE_CHAT_API_URL`.
4. Backend calls Gemini and returns `{reply}`.
5. Client inserts assistant reply, updates thread `updated_at`.
6. TTS speaks the reply (if enabled).

## Server surface

- `GET /api/health` — liveness probe.
- Auth-gated server functions use `requireSupabaseAuth` middleware — bearer token attached by `attachSupabaseAuth` (registered in `src/start.ts`).
