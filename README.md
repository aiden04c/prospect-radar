# Prospect Radar (self-hosted)

Personal SDR workbench for Hex Trust outreach: AI research + lead scoring +
mini-CRM + AI assistant. React (Vite) single-page app served by a Cloudflare
Worker that also proxies the AI calls at `/api/research` (research) and
`/api/chat` (assistant & meeting briefs), so API keys stay server-side.

## Features

- **AI company research** — Claude (default, Opus 4.8), Gemini (web search,
  free-tier friendly), or DeepSeek (cheapest, no web search); structured JSON
  output with suggested classification, signals, ranked contacts, sources, and
  short "why" evidence lines. Never auto-fills the form — you review, then Apply.
- **5-factor lead scoring** — client type, region, size, trigger, custody →
  score /100 with Band A–D and product/angle suggestions.
  - *Region is scored by relevance to Hex Trust's markets, not headquarters:*
    any real HK/SG/Dubai/APAC link — an office, licence (MAS/SFC/VARA), regional
    clients, events, or expansion intent — marks the score up, with a "why" note.
  - *Multiple triggers:* the highest-scoring trigger drives the score, and a
    note lists every trigger found. "Expanding into HK/SG/Dubai" is a trigger.
- **Score breakdown on click** — click any score in the pipeline table to see
  exactly how it's built: each factor's chosen value, points earned vs max with
  a mini bar, the research "why" evidence per factor, and which factors are
  still unset (scoring 0).
- **Prospect exploration (Explore tab)** — live discovery feed of ~8,000
  on-chain projects from DeFiLlama's free public API (no key, fetched straight
  from the browser). Each project gets a transparent 0–100 fit score (TVL size
  40 + category fit 30 + 7d momentum 20 + listing freshness 10); filter by
  search/category/chain/TVL floor, sort by fit, TVL, or growth, click a fit
  score for its breakdown, and hit "Research →" to prefill the Research tab
  with the project and its context.
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

- Providers: Claude (`ANTHROPIC_API_KEY`), Gemini (`GEMINI_API_KEY`), DeepSeek
  (`DEEPSEEK_API_KEY`). Set these as the Worker's **runtime** Variables and
  Secrets in Cloudflare (encrypted) — not the Build-section variables, which
  don't reach the running app, and never in code.
- Deployment: a Cloudflare Worker (`wrangler.jsonc` + `worker/index.js`) serves
  the built site from `dist` and routes `/api/*` to the reused `functions/`
  handlers. Placement is pinned to Singapore (`aws:ap-southeast-1`) so outbound
  API calls egress from an Anthropic-supported region.
- Data is saved in the browser's localStorage (per browser, per device).
- To change model IDs: edit `MODEL_SETS` near the top of `src/ProspectRadar.jsx`.

Full step-by-step deployment guide: see the accompanying
`部署指南-deploy-guide.md` file.

Quick start:
1. `npm install`
2. `npm run dev` → UI at the printed localhost address (the `/api` calls won't work here — they need the Worker runtime, step 3)
3. Local API test: copy `.dev.vars.example` to `.dev.vars`, paste your keys, then `npm run build && npx wrangler dev`
4. Deploy: push to GitHub → Cloudflare Workers Builds (`npm run build` + `npx wrangler deploy`) → add the API keys as **runtime** secrets → redeploy
