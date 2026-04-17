# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md
@docs/STANDARDS.md

---

## Commands

```bash
npm run dev      # dev server on :3000
npm run build    # production build
npm run lint     # eslint
```

No test suite exists yet. Verify behavior by running the dev server.

---

## What This Project Is

AI-powered sales intelligence tool. A salesperson pastes a WhatsApp conversation (or uploads audio/video), and the system returns:
1. Buyer's personality profile (Jung: Pragmático / Analítico / Afável / Expressivo)
2. Buyer's purchase-moment state (9 states: Indeciso, Confuso, Decidido…)
3. Salesperson performance evaluation (Phase 1: communication style, Phase 2: tactic)
4. Loss/advance signals + trend
5. Actionable recommendations + ready-to-send message

---

## Access Control

Two layers:

1. **Salesperson guard** — `src/proxy.js` (not `middleware.ts`). Gates all routes via `ACCESS_TOKEN` env var. Token passed as `?token=` on first visit, persisted in `httpOnly` cookie.

2. **Psychologist session** — HMAC-SHA256 token, 8h TTL, stored in `psych_session` cookie. Login at `POST /api/auth/login` checks `PSYCHOLOGIST_PASSWORD`. Session helpers are in `src/lib/auth.js`: `createSessionToken()`, `verifySessionToken()`, `getSessionFromRequest()`. Protected routes call `verifySessionToken(getSessionFromRequest(request))` at the top before any logic.

---

## AI Pipeline (`src/app/api/analyze/route.js`)

SSE streaming endpoint. Returns events as `data: {...}\n\n`. Event shape:
```js
{ event, status, label, data?, fileKey? }
// status values: 'processing' | 'done' | 'error'
// event values: 'upload' | 'transcribe' | 'client' | 'vendor' | 'signals' | 'sir' | 'done' | 'error'
```

Pipeline sequence:
1. Parse `multipart/form-data` — text (`rawText`) + files (audio/video/text, max 25MB)
2. Transcribe audio/video via `whisper-1` (2 attempts, 3s delay on retry)
3. **Call 1** — Client profile (`clientAnalysisSchema`) — sequential, its output feeds calls 2A/2B
4. **Calls 2A + 2B** — Vendor assessment + Signals detection — run in parallel via `Promise.all`
5. **Call 3** — SIR recommendations (`sirSchema`) — uses output of all prior calls

All GPT calls use `gpt-4o`, `temperature: 0`, structured outputs via `zodResponseFormat`.

Separate endpoint: `POST /api/rescue` — generates rescue plan from already-computed `clientData + vendorData + signalsData`. Called on-demand after marking a sale as "lost".

---

## Schemas

Two schema files with distinct purposes:

**`src/schemas/index.js`** — Zod schemas for GPT structured outputs (`zodResponseFormat`):
- `clientAnalysisSchema` — Jung profile + purchase moment + temporal context + approach guidance
- `vendorAnalysisSchema` — natural profile + phase 1/2 evaluation + verdict
- `signalsSchema` — loss signals, advance signals, trend, critical moment
- `sirSchema` — final recommendations + ready-to-send message
- `rescueSchema` — rescue plan: cause, ideal profile, timing window, approach, ready message

These are also the ground truth for what data gets stored in the DB (as JSONB columns).

**`src/schemas/api.js`** — Zod schemas for API request validation:
- `saveAnalysisSchema`, `saveReviewSchema`, `saveRescueSchema` — request body validation
- `paginationSchema`, `uuidParamSchema` — reusable param validators

---

## UI (`src/app/page.js`)

Single-file client component (~1150 lines). Uses SSE to stream pipeline results in real-time. Renders collapsible section bands per pipeline step as data arrives. Contains inline sub-components (`CopyButton`, `Accordion`, `SectionShell`, profile bands).

The page calls `fetch('/api/analyze', { method: 'POST', body: formData })` then reads the SSE stream via `ReadableStream` + `TextDecoder`. No state management library — plain `useState`/`useRef`.

---

## Runtime Rules

- All API routes: `export const runtime = 'nodejs'` — never Edge Runtime
- SSE: use `TransformStream` (not `ReadableStream` directly) — this is the pattern established in `analyze/route.js`
- `safeStringify`: replaces non-ASCII chars with `\uXXXX` escapes — required for SSE JSON payloads to avoid encoding issues
- DB: use `@neondatabase/serverless` via `getDb()` singleton in `src/lib/db.js` — HTTP/WebSocket driver required for Vercel serverless. Never `postgres.js` (TCP only)

---

## Workspace Settings

`src/lib/workspace.js` reads/writes a `workspace_settings` table (single row). Fields: `setor`, `produto`, `ticketMedio`, `cicloDecisao`, `perfilCliente`, `concorrentes`, `objecoes`, `observacao`. The `buildContextBlock()` function formats this into a prompt prefix injected into GPT calls to calibrate analysis for a specific business context.

Managed via `GET/POST /api/settings` (requires psych session) and the UI at `/revisao/configuracoes`.

---

## Key Env Vars

| Var | Purpose |
|-----|---------|
| `DATABASE_URL` | Neon PostgreSQL (auto-injected by Vercel Neon integration) |
| `OPENAI_API_KEY` | GPT-4o + Whisper |
| `ACCESS_TOKEN` | Salesperson access guard |
| `SESSION_SECRET` | HMAC key for psychologist session tokens |
| `PSYCHOLOGIST_PASSWORD` | Password checked at login |
