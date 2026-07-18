# Prospect Radar (self-hosted)

Personal SDR workbench for Hex Trust outreach: AI research + lead scoring +
mini-CRM + AI assistant. React (Vite) frontend, Cloudflare Pages Function
backend proxies at `/api/research` (research) and `/api/chat` (assistant &
meeting briefs).

## Features

- **AI company research** — Gemini (default, web search), Claude (optional),
  or DeepSeek (cheapest, no web search); structured JSON output with suggested
  classification, signals, ranked contacts and sources. Never auto-fills the
  form — you review, then Apply.
- **5-factor lead scoring** — client type, region, size, trigger, custody
  → score /100 with Band A–D and product/angle suggestions.
- **Pipeline mini-CRM** — sortable table with live text filter, status
  tracking, touch-cadence engine with Today's desk (overdue / due today /
  next 3 days), per-prospect drawer with contacts, signals, notes and touch
  log; CSV and Markdown export.
- **MEDDPICC qualification** — 8 pill toggles per prospect (unknown → partial
  → confirmed) in the drawer; gaps feed the assistant and meeting briefs.
- **Persona coverage** — chips showing which buyer personas (ops, finance,
  compliance, tech, exec, bd) you've got contacts for, and which are missing.
- **Assistant chat** (Pipeline tab) — you pick which companies' full detail is
  sent as context; sales-methodology-aware (MEDDPICC, SPIN, Challenger,
  multithreading, MAP); can propose pipeline edits (add note / set status /
  log touch) that you Apply or Dismiss — never applied automatically. History
  is filterable by company and auto-deletes after 15 days.
- **Meeting brief generator** — one button in the drawer produces a <450-word
  brief (objective, insights to teach, SPIN question bank, qualification gaps,
  likely objections, dated next step); save to the vault's `03-Briefs/` or
  download.
- **Obsidian vault sync** (Chrome/Edge) — connect your vault folder once and
  the app auto-writes a one-way mirror to `_ProspectRadar/pipeline.md` with a
  full JSON backup block; Import / Restore recovers everything from that file.

## Configuration

- Providers: Gemini (needs GEMINI_API_KEY), DeepSeek (DEEPSEEK_API_KEY),
  Claude (optional, ANTHROPIC_API_KEY). Keys are Cloudflare encrypted
  Secrets — never in code.
- Data is saved in the browser's localStorage (per browser, per device).
- To change model IDs later: edit `MODEL_SETS` near the top of
  `src/ProspectRadar.jsx`.

Full step-by-step deployment guide: see the accompanying
`部署指南-deploy-guide.md` file.

Quick start:
1. `npm install`
2. `npm run dev` → UI at the printed localhost address (research/assistant won't work locally without step 3)
3. Local API test (optional): copy `.dev.vars.example` to `.dev.vars`, paste your key, then `npm run build && npx wrangler pages dev dist`
4. Deploy: push to GitHub → Cloudflare Pages → set GEMINI_API_KEY secret → redeploy
