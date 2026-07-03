# Bug Fix Report

Consolidated log of production-readiness fixes applied in the final pass.

| # | Area              | Issue                                                                 | Fix                                                                                         |
|---|-------------------|-----------------------------------------------------------------------|---------------------------------------------------------------------------------------------|
| 1 | SSR               | Hydration mismatch on `/auth` (`Suspense` vs `<div>` divergence).     | Added `ssr: false` to the `/auth` route so client-only auth probes don't run during SSR.    |
| 2 | Chat memory       | Backend received only latest message, losing multi-turn context.      | `sendMessageToGemini(msg, history)` now forwards full `history` array.                      |
| 3 | Voice             | TTS overlapped when user sent messages quickly.                       | `useSpeechSynthesis` calls `cancel()` before each `speak()`; adds an explicit Stop button.  |
| 4 | Voice             | STT threw on unsupported browsers.                                    | `useSpeechRecognition` feature-detects and disables the mic button gracefully.              |
| 5 | Chat history      | Delete used native `confirm()`; no rename; no search.                 | Replaced with `AlertDialog`; added rename dialog and client-side search filter.             |
| 6 | Auth guard        | Per-route guards caused loops on hard refresh.                        | Consolidated into the managed `_authenticated/route.tsx` (`ssr:false`).                     |
| 7 | RBAC              | No role separation → any user could see all data.                     | Added `user_roles` table + `has_role()` SECURITY DEFINER function + admin RLS policies.     |
| 8 | Admin             | No admin surface for analytics/moderation.                            | New `/admin` route with metrics + recent activity.                                          |
| 9 | Network           | Chat backend failures leaked stack traces to users.                   | Normalized all errors to a single toast message.                                            |
|10 | UI                | Missing loading skeletons in sidebar.                                 | Sidebar shows skeleton rows while threads load.                                             |
|11 | Ops               | No health endpoint for uptime monitors.                               | Added `GET /api/health`.                                                                    |
|12 | Perf              | Route bundles included heavy components eagerly.                      | Relying on TanStack automatic code-splitting (non-exported components).                     |
|13 | A11y              | Icon-only buttons missing labels.                                     | Added `aria-label` on mic, stop, delete, rename controls.                                   |
|14 | Security          | Public schema tables lacked explicit GRANTs.                          | Every migration now issues `GRANT` before enabling RLS.                                     |
