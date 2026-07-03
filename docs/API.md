# API Reference

Two API surfaces:

1. **Frontend server routes** (`https://<frontend-domain>/api/*`) — TanStack Start server routes.
2. **Chat backend** (`VITE_CHAT_API_URL`, Render) — Node service that proxies Google Gemini.

Authentication for user-scoped data goes through **Supabase JS** using the browser's session — not a raw REST call from your code.

---

## Frontend Server Routes

### GET `/api/health`

Liveness probe.

**Response 200**
```json
{ "status": "ok", "timestamp": "2026-07-03T12:34:56.000Z" }
```

**Auth:** none.

---

## Chat Backend (Render)

### POST `/chat`

Generate an AI reply using Gemini, given the latest user message and prior turns.

**URL:** `https://ai-sales-chatbot-backend.onrender.com/chat`

**Headers**
| Name           | Value              |
| -------------- | ------------------ |
| `Content-Type` | `application/json` |

**Request body**
```json
{
  "message": "What are your pricing tiers?",
  "history": [
    { "role": "user", "content": "Hi" },
    { "role": "assistant", "content": "Hello! How can I help?" }
  ]
}
```

| Field     | Type                                                  | Required | Notes                          |
| --------- | ----------------------------------------------------- | -------- | ------------------------------ |
| `message` | `string`                                              | yes      | Latest user turn.              |
| `history` | `Array<{role:"user"\|"assistant", content:string}>`   | no       | Prior conversation for memory. |

**Response 200**
```json
{ "reply": "We offer Free, Pro at $19/mo, and Enterprise (custom)." }
```

**Error responses**

| Status | Meaning                        | Body                                    |
| ------ | ------------------------------ | --------------------------------------- |
| 400    | Missing/invalid body           | `{"error":"message is required"}`       |
| 429    | Rate-limited by upstream       | `{"error":"rate limited, try again"}`   |
| 500    | Upstream Gemini failure        | `{"error":"internal error"}`            |
| 502/503| Backend unavailable            | plain text                              |

The frontend normalizes all failures to a single user-friendly toast: _"Unable to contact the AI server. Please try again."_

**Auth:** none currently. Recommended hardening: signed JWT from the Supabase session or a per-user rate-limit key.

**Example (curl)**
```bash
curl -X POST https://ai-sales-chatbot-backend.onrender.com/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello!","history":[]}'
```

---

## Supabase Data API (client-side)

All app data reads/writes go through `@supabase/supabase-js` with the user's session — RLS enforces access. Tables:

| Table          | Access                                                        |
| -------------- | ------------------------------------------------------------- |
| `chat_threads` | Owner: full CRUD. Admin: read/delete all.                     |
| `messages`     | Owner (via thread): full CRUD. Admin: read/delete all.        |
| `profiles`     | Owner: read/update self. Admin: read all.                     |
| `user_roles`   | Authenticated user: read own. Admin writes via SQL/migration. |

Example (browser):
```ts
const { data } = await supabase
  .from("messages")
  .select("id, role, content, created_at")
  .eq("thread_id", threadId)
  .order("created_at");
```
