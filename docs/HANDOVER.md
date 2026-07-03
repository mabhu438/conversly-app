# Project Handover

## Live URLs

- **Production frontend:** https://conversly-app.lovable.app
- **Chat backend (Render):** https://ai-sales-chatbot-backend.onrender.com
- **Health check:** https://conversly-app.lovable.app/api/health

## Access

| Resource            | Where                                                    |
| ------------------- | -------------------------------------------------------- |
| Frontend source     | GitHub repo connected to Lovable                         |
| Lovable project     | https://lovable.dev/projects/f6813ac8-4daf-4123-ae0f-5cc2b446d0ed |
| Database + Auth     | Lovable Cloud → Backend tab                              |
| Backend source      | (your Render-connected repo)                             |
| Render dashboard    | https://dashboard.render.com                             |

## Environment matrix

| Variable                        | Frontend | Backend | Notes                     |
| ------------------------------- | :------: | :-----: | ------------------------- |
| `VITE_SUPABASE_URL`             |    ✔     |         | build-time (Vite)         |
| `VITE_SUPABASE_PUBLISHABLE_KEY` |    ✔     |         | build-time                |
| `VITE_SUPABASE_PROJECT_ID`      |    ✔     |         | build-time                |
| `VITE_CHAT_API_URL`             |    ✔     |         | Render URL + `/chat`      |
| `GEMINI_API_KEY`                |          |    ✔    | server-only               |
| `ALLOWED_ORIGINS`               |          |    ✔    | CSV of allowed frontends  |
| `NODE_ENV=production`           |          |    ✔    | enables prod logging      |

## Runbook

- **Deploy frontend:** merge to main → Lovable auto-publishes.
- **Deploy backend:** push to main → Render auto-deploys.
- **Rotate Gemini key:** update Render env → redeploy.
- **Promote admin:** insert row in `public.user_roles` with `role='admin'`.
- **Wipe a user:** delete from `auth.users`; cascade removes threads/messages.

## Support checklist

1. Reproduce with a fresh incognito session.
2. Check browser console + Network tab.
3. Check `/api/health`.
4. Check Render backend logs.
5. Query `chat_threads` / `messages` counts in SQL.

## Known limitations

- Web Speech API is Chromium-only for reliable STT.
- Render free tier cold-starts (~30s).
- No streaming responses (full reply returned at once).

## Roadmap suggestions

- Server-sent events for token streaming.
- Per-user rate limiting.
- File / image uploads (Supabase Storage).
- Multi-model selector (Gemini / GPT / Claude).
- Export conversation as Markdown/PDF.
