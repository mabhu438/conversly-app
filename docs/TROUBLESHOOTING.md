# Troubleshooting

### Voice input doesn't work
- Only Chromium browsers implement Web Speech API reliably. Firefox and iOS Safari have partial or no support.
- Browser must have microphone permission granted (`chrome://settings/content/microphone`).
- Serve over HTTPS (or `localhost`). Permission is denied on plain HTTP.

### TTS cuts off mid-sentence
- Some voices have a ~200-char limit. Long replies are chunked at sentence boundaries.
- Clicking **Stop Speaking** cancels the queue immediately (`speechSynthesis.cancel()`).

### "Unable to contact the AI server"
- Check `VITE_CHAT_API_URL` points to a reachable backend.
- Render free instances cold-start; the first request after idle can take 30-60s.
- Look at the Network tab — a CORS error means the backend `ALLOWED_ORIGINS` doesn't include your frontend URL.

### Empty AI responses
- Verify `GEMINI_API_KEY` on the Render backend is valid and not exhausted.
- Check backend logs for `SAFETY` blocks (Gemini refuses harmful prompts).

### Sign-in loops back to /auth
- Hard-refresh clears client cache; try again.
- The `_authenticated` layout is `ssr:false` by design — a server-side gate would loop because Supabase sessions live in `localStorage`.

### Admin dashboard shows "Forbidden"
- Confirm the user exists in `public.user_roles` with `role = 'admin'`.
- `has_role()` is `SECURITY DEFINER`; missing rows return `false`.

### Hydration mismatch warning
- Avoid `new Date()`, `Math.random()`, or `typeof window` checks inside route components.
- The `/auth` route opts out of SSR (`ssr: false`) to avoid client-only session probes.

### Mobile keyboard covers the input
- The chat input uses `env(safe-area-inset-bottom)` and `dvh` units — update your browser if you see overlap.

### Chat history not persisting
- User must be signed in — anonymous mode is disabled.
- Check RLS: `select * from chat_threads where user_id = auth.uid()` in the SQL editor.
