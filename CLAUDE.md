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

## Access Control (Current V1 Guard)

`src/proxy.js` is the **middleware** (not `middleware.ts`). It gates all routes via a shared token in `ACCESS_TOKEN` env var. Token is passed as `?token=` on first visit, then persisted in a `httpOnly` cookie. API routes require `x-access-token` header or cookie. No JWT auth yet — that's V2.

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

## Schemas (`src/schemas/index.js`)

Five Zod schemas that define GPT response shapes:
- `clientAnalysisSchema` — Jung profile + purchase moment + temporal context + approach guidance
- `vendorAnalysisSchema` — natural profile + phase 1/2 evaluation + verdict
- `signalsSchema` — loss signals, advance signals, trend, critical moment
- `sirSchema` — final recommendations + ready-to-send message
- `rescueSchema` — rescue plan: cause, ideal profile, timing window, approach, ready message

These schemas are also the ground truth for what data gets stored in the DB (as JSONB columns).

---

## UI (`src/app/page.js`)

Single-file client component (~1150 lines). Uses SSE to stream pipeline results in real-time. Renders collapsible section bands per pipeline step as data arrives. Contains inline sub-components (`CopyButton`, `Accordion`, `SectionShell`, profile bands).

The page calls `fetch('/api/analyze', { method: 'POST', body: formData })` then reads the SSE stream via `ReadableStream` + `TextDecoder`. No state management library — plain `useState`/`useRef`.

---

## Runtime Rules

- All API routes: `export const runtime = 'nodejs'` — never Edge Runtime
- SSE: use `TransformStream` (not `ReadableStream` directly) — this is the pattern established in `analyze/route.js`
- `safeStringify`: replaces non-ASCII chars with `\uXXXX` escapes — required for SSE JSON payloads to avoid encoding issues
- DB (when added): use `@neondatabase/serverless` — HTTP/WebSocket driver required for Vercel serverless. Never `postgres.js` (TCP only)

---

---

## Planned Next — V1 Prototype

Database schema and sprint plan are in `docs/planejamento_v1.md`. Sprint order:
1. Neon PostgreSQL setup: install `@neondatabase/serverless`, create `src/lib/db.js`, run DDL
2. `POST /api/analyses` + `PATCH /api/analyses/[id]/resultado` — save analysis + mark outcome
3. HMAC auth for psychologist panel (no JWT — use `crypto.subtle`, Edge-safe)
4. Psychologist review panel at `/revisao` and `/revisao/[id]`

Key env vars needed: `DATABASE_URL` (auto-injected by Vercel Neon integration), `OPENAI_API_KEY`, `ACCESS_TOKEN`, `PSYCH_SECRET`.
