# CLAUDE.md — Prospect Radar

SDR workbench for a rep at Hex Trust (regulated digital-asset custodian; HK/SG/Dubai;
products: Custody, Staking, OTC/Markets, Convert-to-Pay, Token Wrapping, WaaS, Aura).
Owner is a beginner developer on macOS + Chrome. Explain changes simply; verify builds.

Read HANDOFF.md (current status + task queue) and DESIGN.md (system blueprint) before coding.

## Commands
- `npm install` — setup
- `npm run build` — MUST pass before any task is considered done
- `npm run build && npx wrangler pages dev dist` — local test with Functions (.dev.vars holds local keys; restart wrangler after editing it)

## Architecture
- `src/ProspectRadar.jsx` — the ENTIRE app: one large React component + module-level helpers. Keep it single-file.
- `src/storage-shim.js` — mimics Claude-artifact `window.storage` on localStorage. All persistence goes through `window.storage`; never call localStorage directly elsewhere.
- `functions/api/research.js` — company research proxy (do not modify unless asked).
- `functions/api/chat.js` — assistant/brief proxy. Contract: POST `{provider:"gemini"|"anthropic"|"deepseek", model, system, messages:[{role,content}], max_tokens, search}` → `{text}` or `{error}`.
- Deploy target: Cloudflare Pages (build `npm run build`, output `dist`, functions auto-detected). API keys ONLY in Cloudflare Secrets / `.dev.vars` (`GEMINI_API_KEY`, `DEEPSEEK_API_KEY`, `ANTHROPIC_API_KEY`). Never in code, never logged, never echoed.

## Hard rules
- Data ownership: app's localStorage is the single source of truth; the Obsidian vault files the app writes (`_ProspectRadar/pipeline.md`, `03-Briefs/*`) are one-way mirrors. Never build features that parse-and-write-back human-owned vault files.
- AI edits to pipeline data are ALWAYS propose → user clicks Apply. Never auto-apply.
- Never fabricate or pattern-guess contact emails/phones; empty means unknown.
- DeepSeek has NO web search — prompts sent to it must forbid invented facts/URLs.
- Gemini calls: omit `maxOutputTokens` (thinking tokens can truncate JSON output).
- Model IDs live in `MODEL_SETS`; DeepSeek uses v4 names (`deepseek-v4-flash|pro`; old names die 2026-07-24).
- No `<form>` tags; onClick handlers only (legacy artifact rule, keep for consistency).
- Styling: Tailwind v4 core utility classes + inline styles with the `C` color tokens (cream/sage/forest palette), `serif`/`sans` font objects. Match existing look.
- File System Access (vault sync) is Chrome/Edge-only; always feature-detect and keep manual export fallbacks working.
- Keep resilient parsing intact (extractJson repair pass, retry-once, raw fallback).
- Footer principle applies to all generated content: "Draft-only tooling — a human always sends."

## User's vault
Obsidian vault at `/Users/aidenlin/Documents/Sales OS` (structure: 00-Inbox, 01-Prospects,
02-Transcripts, 03-Briefs, 04-Metrics, 05-Playbook, 06-Templates, 99-Archive, plus
app-created `_ProspectRadar/`). App writes only `_ProspectRadar/pipeline.md` and `03-Briefs/`.
