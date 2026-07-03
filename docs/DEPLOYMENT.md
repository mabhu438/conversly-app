# Deployment Guide

## Overview

| Component  | Platform          | URL                                                   |
| ---------- | ----------------- | ----------------------------------------------------- |
| Frontend   | Lovable / CF Workers | https://conversly-app.lovable.app                  |
| Backend    | Render (Node)     | https://ai-sales-chatbot-backend.onrender.com         |
| Database   | Lovable Cloud (Supabase) | managed                                        |

## Frontend — Lovable

1. Push to the connected GitHub repo (or click **Publish** in the Lovable editor).
2. Lovable builds with Vite + TanStack Start and deploys to a Cloudflare Workers edge target.
3. HTTPS is automatic. Custom domains: **Project Settings → Domains**.

### Environment variables (frontend)

Set in **Lovable Cloud → Secrets** (server) and in `.env` at build time (client, `VITE_*`):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`
- `VITE_CHAT_API_URL` — full URL of the Render backend `/chat` endpoint

## Backend — Render

The chat backend is a small Node service that proxies to Google Gemini.

1. Create a **Web Service** on Render pointing at your backend repo.
2. Runtime: Node 20, Build: `npm ci`, Start: `npm start`.
3. Environment:
   - `NODE_ENV=production`
   - `GEMINI_API_KEY=<your-key>`
   - `ALLOWED_ORIGINS=https://conversly-app.lovable.app,https://<your-custom-domain>`
4. Enable HTTPS (Render does this automatically).
5. Configure CORS in Express:
   ```js
   app.use(cors({
     origin: process.env.ALLOWED_ORIGINS.split(","),
     methods: ["POST", "OPTIONS"],
   }));
   ```

## CORS Checklist

- Backend `Access-Control-Allow-Origin` matches the deployed frontend URL(s).
- `OPTIONS` preflight returns 204 with the same headers.
- `Access-Control-Allow-Headers` includes `Content-Type`.

## Post-Deploy Verification

- `GET https://<frontend>/api/health` → `{"status":"ok"}`
- Sign in → send a message → response streamed back.
- Voice input works in Chrome/Edge (Web Speech API is unavailable in Firefox).
- Admin dashboard loads only for users in `user_roles` with `role = 'admin'`.
