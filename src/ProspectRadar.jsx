import React, { useState, useEffect, useMemo, useRef } from "react";

/* ============================================================
   PROSPECT RADAR — Hex Trust SDR field notebook
   Research · Score · Pipeline (single-file React artifact)
   ============================================================ */

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Source+Sans+3:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
`;

const C = {
  bg: "#FAF7F0",
  panel: "#EEF3E6",
  panelDeep: "#E3EBD6",
  card: "#FFFFFF",
  forest: "#2F5D3A",
  forestDark: "#234A2D",
  ink: "#26382B",
  inkSoft: "#5F6E5B",
  border: "#DCE3CC",
  borderSoft: "#E8ECDA",
  amber: "#A05E12",
  amberBg: "#FBF0DA",
  amberBorder: "#EBD6A8",
  red: "#96341C",
  redBg: "#F9E7DE",
  redBorder: "#EBC8B8",
  midGreen: "#5F8A5E",
  gray: "#8B8676",
};

const serif = { fontFamily: "'Fraunces', Georgia, serif" };
const sans = { fontFamily: "'Source Sans 3', 'Segoe UI', sans-serif" };

/* ---------------- Scoring model ---------------- */

const CLIENT_TYPES = [
  { v: "foundation", label: "Foundation / token issuer", pts: 25 },
  { v: "crypto_fund", label: "Crypto fund", pts: 23 },
  { v: "payments", label: "Payments / fintech", pts: 20 },
  { v: "otc", label: "OTC desk", pts: 18 },
  { v: "family_office", label: "Family office", pts: 16 },
  { v: "bank", label: "Bank / TradFi", pts: 15 },
  { v: "corporate", label: "Corporate", pts: 12 },
  { v: "other", label: "Other", pts: 8 },
];

const REGIONS = [
  { v: "hk_sg_dubai", label: "HK / Singapore / Dubai", pts: 20 },
  { v: "global_apac", label: "Global, with APAC presence", pts: 17 },
  { v: "apac_other", label: "Rest of APAC", pts: 16 },
  { v: "mena", label: "MENA", pts: 14 },
  { v: "europe", label: "Europe", pts: 10 },
  { v: "us_only", label: "US-only", pts: 4 },
];

const SIZES = [
  { v: "250m_1b", label: "$250M – 1B", pts: 20 },
  { v: "over_1b", label: "> $1B", pts: 18 },
  { v: "50_250m", label: "$50 – 250M", pts: 16 },
  { v: "10_50m", label: "$10 – 50M", pts: 10 },
  { v: "unknown", label: "Unknown", pts: 8 },
  { v: "under_10m", label: "< $10M", pts: 4 },
];

const TRIGGERS = [
  { v: "tge", label: "TGE upcoming", pts: 25 },
  { v: "fund_launch", label: "Fund launch", pts: 24 },
  { v: "regulatory", label: "Regulatory / licence", pts: 22 },
  { v: "incident", label: "Security incident", pts: 22 },
  { v: "staking_expansion", label: "Staking expansion", pts: 20 },
  { v: "token_unlock", label: "Token unlock", pts: 18 },
  { v: "hiring", label: "Hiring", pts: 15 },
  { v: "none", label: "No live trigger", pts: 5 },
];

const CUSTODY = [
  { v: "self_custody", label: "Self-custody / multisig", pts: 10 },
  { v: "exchange", label: "Exchange custody", pts: 9 },
  { v: "none_yet", label: "None yet", pts: 8 },
  { v: "competitor_renewal", label: "Competitor, renewal < 6 mo", pts: 7 },
  { v: "unknown", label: "Unknown", pts: 5 },
  { v: "competitor_locked", label: "Competitor, locked in", pts: 3 },
];

const FIELDS = [
  { key: "clientType", label: "Client type", opts: CLIENT_TYPES, max: 25 },
  { key: "region", label: "Region", opts: REGIONS, max: 20 },
  { key: "size", label: "Size (AUM / treasury)", opts: SIZES, max: 20 },
  { key: "trigger", label: "Trigger event", opts: TRIGGERS, max: 25 },
  { key: "custody", label: "Current custody", opts: CUSTODY, max: 10 },
];

const PRODUCTS = {
  foundation: ["Custody", "Staking", "Token Wrapping", "Validator services"],
  crypto_fund: ["Custody", "OTC / Markets", "Staking", "Lending"],
  payments: ["Convert-to-Pay", "Custody", "Stablecoins"],
  bank: ["Wallet-as-a-Service", "Custody"],
  family_office: ["Aura wealth", "Custody"],
  corporate: ["Custody", "Tokenization"],
  otc: ["Custody", "Markets"],
  other: ["Custody"],
};

const ANGLES = {
  tge: "Lock in institutional custody and wrapping before the TGE — setup takes weeks, not days.",
  fund_launch: "New fund? LPs increasingly expect licensed, segregated custody from day one.",
  regulatory: "Congrats on the licence momentum — regulated custody is usually the next box to tick.",
  incident: "After the recent incident, worth benchmarking your setup against a regulated custodian's controls.",
  staking_expansion: "Expanding staking? Assets can keep earning while sitting in regulated custody.",
  token_unlock: "Upcoming unlock — treasury-grade custody plus OTC can help manage it quietly.",
  hiring: "Saw the ops/compliance hiring — a good moment to formalise custody infrastructure.",
  none: "No live trigger — lead with a short intro to regulated custody across HK, SG and Dubai.",
};

const PERSONA_PRIORITY = {
  foundation: ["finance", "ops", "exec", "bd", "tech", "compliance"],
  crypto_fund: ["ops", "finance", "compliance", "exec", "tech", "bd"],
  payments: ["tech", "exec", "finance", "compliance", "ops", "bd"],
  bank: ["exec", "compliance", "ops", "tech", "finance", "bd"],
  family_office: ["exec", "finance", "ops", "compliance", "bd", "tech"],
  corporate: ["finance", "exec", "ops", "compliance", "tech", "bd"],
  otc: ["ops", "exec", "finance", "compliance", "tech", "bd"],
  other: ["exec", "finance", "ops", "compliance", "tech", "bd"],
};

const BANDS = [
  { min: 80, band: "A", note: "Priority — reach out today", color: C.forest, bg: "#DCEAD9" },
  { min: 60, band: "B", note: "Strong — queue this week", color: "#4C7A4B", bg: "#E7F0DF" },
  { min: 40, band: "C", note: "Fair — batch outreach", color: C.amber, bg: C.amberBg },
  { min: 0, band: "D", note: "Low — deprioritise", color: C.gray, bg: "#EEEBE0" },
];

const STATUSES = ["Researched", "Contacted", "Replied", "Meeting", "Handed off", "Nurture", "Lost"];
const CHANNELS = ["Email", "LinkedIn", "Call", "Telegram", "Event", "Other"];
const PERSONAS = ["ops", "finance", "compliance", "tech", "exec", "bd"];

const MEDDPICC_ITEMS = [
  { key: "metrics", label: "Metrics" },
  { key: "eb", label: "Economic Buyer" },
  { key: "dc", label: "Decision Criteria" },
  { key: "dp", label: "Decision Process" },
  { key: "pp", label: "Paper Process" },
  { key: "pain", label: "Pain" },
  { key: "champion", label: "Champion" },
  { key: "competition", label: "Competition" },
];

const CADENCE = {
  2: { days: 2, action: "Touch 2 — LinkedIn connect" },
  3: { days: 3, action: "Touch 3 — Email 2, new angle" },
  4: { days: 3, action: "Touch 4 — Call" },
  5: { days: 4, action: "Touch 5 — LinkedIn / Telegram" },
  6: { days: 5, action: "Touch 6 — Breakup email" },
};

const PROVIDERS = [
  { id: "gemini", label: "Gemini (Google) — web search, free-tier friendly" },
  { id: "anthropic", label: "Claude (Anthropic) — best reasoning + web search" },
  { id: "deepseek", label: "DeepSeek — cheapest, but NO web search (training knowledge only)" },
];

const MODEL_SETS = {
  gemini: [
    { id: "gemini-flash-latest", label: "Gemini Flash (latest) — daily driver" },
    { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash — fast, cheap" },
    { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro — complex accounts" },
  ],
  anthropic: [
    { id: "claude-haiku-4-5-20251001", label: "Haiku 4.5 — bulk triage, cheapest" },
    { id: "claude-sonnet-4-6", label: "Sonnet 4.6 — daily driver" },
    { id: "claude-opus-4-8", label: "Opus 4.8 — complex corporates" },
    { id: "claude-fable-5", label: "Fable 5 — strategic accounts" },
  ],
  deepseek: [
    { id: "deepseek-v4-flash", label: "DeepSeek V4 Flash — quick, cheapest" },
    { id: "deepseek-v4-pro", label: "DeepSeek V4 Pro — deep analysis" },
  ],
};

const DEPTHS = [
  { id: "quick", label: "Quick — triage a long list (≤2 searches, smallest output)", maxTokens: 1300, searches: 2, events: 2, contacts: 2, sources: 2 },
  { id: "standard", label: "Standard — daily driver (≤4 searches)", maxTokens: 2500, searches: 4, events: 3, contacts: 3, sources: 3 },
  { id: "deep", label: "Deep — strategic accounts (≤6 searches, fullest output)", maxTokens: 4000, searches: 6, events: 3, contacts: 4, sources: 3 },
];

const STORAGE_KEY = "prospect_radar_v1";
const CHAT_KEY = "prospect_radar_chat_v1";
const CHAT_MAX_AGE_MS = 15 * 86400000; // chat history auto-deletes after 15 days

/* ---------------- Date helpers ---------------- */

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function addDaysStr(dateStr, days) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}
function daysBetween(a, b) {
  // b - a in whole days (local)
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round((new Date(by, bm - 1, bd) - new Date(ay, am - 1, ad)) / 86400000);
}
function fmtDate(s) {
  if (!s) return "—";
  const [y, m, d] = s.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d} ${months[m - 1]}`;
}

/* ---------------- Scoring helpers ---------------- */

function pts(opts, v) {
  const o = opts.find((x) => x.v === v);
  return o ? o.pts : 0;
}
function labelOf(opts, v) {
  const o = opts.find((x) => x.v === v);
  return o ? o.label : "—";
}
function computeScore(form) {
  return (
    pts(CLIENT_TYPES, form.clientType) +
    pts(REGIONS, form.region) +
    pts(SIZES, form.size) +
    pts(TRIGGERS, form.trigger) +
    pts(CUSTODY, form.custody)
  );
}
function bandOf(score) {
  return BANDS.find((b) => score >= b.min) || BANDS[BANDS.length - 1];
}
function meddpiccSummary(r) {
  const src = (r && r.meddpicc) || {};
  const confirmed = [];
  const partial = [];
  const unknown = [];
  MEDDPICC_ITEMS.forEach(({ key, label }) => {
    if (src[key] === "confirmed") confirmed.push(label);
    else if (src[key] === "partial") partial.push(label);
    else unknown.push(label);
  });
  return { confirmed, partial, unknown, anySet: confirmed.length + partial.length > 0 };
}

function personaCoverage(r) {
  const covered = PERSONAS.filter((p) => (r.contacts || []).some((c) => c && c.persona === p));
  return { covered, missing: PERSONAS.filter((p) => !covered.includes(p)) };
}

function rankContacts(contacts, clientType) {
  const order = PERSONA_PRIORITY[clientType] || PERSONA_PRIORITY.other;
  return [...(contacts || [])].sort((a, b) => {
    const ia = order.indexOf(a?.persona);
    const ib = order.indexOf(b?.persona);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
}

/* ---------------- Cadence engine ---------------- */

function nextDueFor(rec) {
  const status = rec.status;
  if (status === "Handed off" || status === "Lost") return null;
  const touches = rec.touches || [];
  if (touches.length === 0) return { start: true };
  const last = touches.reduce((m, t) => (t.date > m ? t.date : m), touches[0].date);
  if (status === "Replied") return { due: addDaysStr(last, 2), action: "Respond / qualify" };
  if (status === "Meeting") return { due: addDaysStr(last, 2), action: "Prep / follow-up" };
  if (status === "Nurture") return { due: addDaysStr(last, 30), action: "Nurture check-in" };
  const n = touches.length;
  if (n >= 6) return { suggestNurture: true };
  const step = CADENCE[n + 1];
  return { due: addDaysStr(last, step.days), action: step.action };
}

/* ---------------- Markdown mirror (Obsidian / Claude Code) ---------------- */

const MD_FILENAME = "prospect-radar-pipeline.md"; // manual Export MD download only
const VAULT_DIR = "_ProspectRadar"; // vault sync writes into this subfolder
const VAULT_FILENAME = "pipeline.md";

function mdEscape(s) {
  return String(s == null ? "" : s).replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function buildMarkdown(records) {
  const lines = [];
  lines.push("---");
  lines.push("title: Prospect Radar Pipeline");
  lines.push(`updated: ${new Date().toISOString()}`);
  lines.push(`companies: ${records.length}`);
  lines.push("tool: prospect-radar");
  lines.push("---");
  lines.push("");
  lines.push("> Auto-generated by Prospect Radar. This file is overwritten on every sync — treat it as read-only in Obsidian. The JSON block at the bottom is a complete backup: restore it in the app via Import / Restore.");
  lines.push("");
  lines.push("## Pipeline overview");
  lines.push("");
  lines.push("| Company | Score | Band | Status | Touches | Next due | Next action |");
  lines.push("|---|---|---|---|---|---|---|");
  const withDue = records.map((r) => ({ r, due: nextDueFor(r) }));
  withDue.forEach(({ r, due }) => {
    const b = bandOf(r.score);
    const action = due
      ? due.start
        ? "Log Touch 1 to start cadence"
        : due.suggestNurture
          ? "Cadence complete — move to Nurture?"
          : due.action
      : "No reminders";
    lines.push(
      `| ${mdEscape(r.company)} | ${r.score} | ${b.band} | ${r.status} | ${(r.touches || []).length} | ${due && due.due ? due.due : "—"} | ${mdEscape(action)} |`
    );
  });
  lines.push("");
  withDue.forEach(({ r, due }) => {
    const b = bandOf(r.score);
    lines.push(`## ${r.company}`);
    lines.push("");
    lines.push(`**Score ${r.score}/100 · Band ${b.band}** (${b.note}) · Status: ${r.status}`);
    lines.push("");
    lines.push(`- Client type: ${labelOf(CLIENT_TYPES, r.form.clientType)}`);
    lines.push(`- Region: ${labelOf(REGIONS, r.form.region)}`);
    lines.push(`- Size: ${labelOf(SIZES, r.form.size)}`);
    lines.push(`- Trigger: ${labelOf(TRIGGERS, r.form.trigger)}`);
    lines.push(`- Custody: ${labelOf(CUSTODY, r.form.custody)}`);
    const prods = r.form.clientType ? PRODUCTS[r.form.clientType] || PRODUCTS.other : null;
    if (prods) lines.push(`- Lead with: ${prods.join(", ")}`);
    if (due && due.due) lines.push(`- Next: ${due.action} — due ${due.due}`);
    const mp = meddpiccSummary(r);
    if (mp.anySet)
      lines.push(
        `- MEDDPICC: confirmed [${mp.confirmed.join(", ")}] · partial [${mp.partial.join(", ")}] · unknown [${mp.unknown.join(", ")}]`
      );
    lines.push("");
    if (r.summary) {
      lines.push(r.summary);
      lines.push("");
    }
    if (r.caution) {
      lines.push(`> ⚠ ${r.caution}`);
      lines.push("");
    }
    if ((r.contacts || []).length) {
      lines.push("**Contacts**");
      r.contacts.forEach((p) => {
        const bits = [];
        if (p.email) bits.push(p.email);
        if (p.phone) bits.push(p.phone);
        if (p.url) bits.push(p.url);
        lines.push(`- ${p.name || "?"} — ${p.title || ""} (${p.persona || "?"})${bits.length ? ": " + bits.join(" · ") : ""}`);
      });
      lines.push("");
    }
    if (r.companyContact && (r.companyContact.email || r.companyContact.phone)) {
      lines.push(
        `Company general contact: ${[r.companyContact.email, r.companyContact.phone].filter(Boolean).join(" · ")}`
      );
      lines.push("");
    }
    if ((r.signals || []).length) {
      lines.push("**Signals**");
      r.signals.forEach((t) => {
        lines.push(`- ${t.event || "?"}${t.when ? ` (${t.when})` : ""}${t.url ? ` — [${t.source || "source"}](${t.url})` : ""}`);
        if (t.implication) lines.push(`    - Why it matters for HT: ${t.implication}`);
      });
      lines.push("");
    }
    if ((r.sources || []).length) {
      lines.push(
        "**Sources**: " +
          r.sources.map((s) => (s.url ? `[${s.title || s.url}](${s.url})` : s.title || "")).join(" · ")
      );
      lines.push("");
    }
    if ((r.touches || []).length) {
      lines.push("**Touch history**");
      r.touches.forEach((t) => lines.push(`- T${t.n} · ${t.channel} · ${t.date}${t.note ? ` — ${t.note}` : ""}`));
      lines.push("");
    }
    if (r.notes && r.notes.trim()) {
      lines.push("**Notes**");
      lines.push("");
      r.notes
        .trim()
        .split(/\r?\n/)
        .forEach((n) => lines.push(`> ${n}`));
      lines.push("");
    }
  });
  lines.push("---");
  lines.push("");
  lines.push("## Data backup (do not edit)");
  lines.push("");
  lines.push("<!-- prospect-radar-backup-v1 -->");
  lines.push("```json");
  lines.push(JSON.stringify(records));
  lines.push("```");
  lines.push("");
  return lines.join("\n");
}

function parseImport(text) {
  const t = String(text || "").trim();
  if (t.startsWith("[") || t.startsWith("{")) {
    const j = JSON.parse(t);
    if (Array.isArray(j)) return j;
    if (j && Array.isArray(j.records)) return j.records;
    return null;
  }
  const mark = t.indexOf("prospect-radar-backup");
  const from = mark > -1 ? mark : 0;
  const fenceStart = t.indexOf("```json", from);
  if (fenceStart === -1) return null;
  const jsonStart = t.indexOf("\n", fenceStart) + 1;
  const fenceEnd = t.indexOf("```", jsonStart);
  if (jsonStart <= 0 || fenceEnd === -1) return null;
  const j = JSON.parse(t.slice(jsonStart, fenceEnd).trim());
  return Array.isArray(j) ? j : null;
}

function sanitizeRecord(r, i) {
  const arr = (x) => (Array.isArray(x) ? x : []);
  const f = r && r.form ? r.form : {};
  return {
    id: String((r && r.id) || `${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`),
    company: String((r && r.company) || "Unknown"),
    form: {
      clientType: f.clientType || "",
      region: f.region || "",
      size: f.size || "",
      trigger: f.trigger || "",
      custody: f.custody || "",
    },
    score: Number(r && r.score) || 0,
    status: STATUSES.includes(r && r.status) ? r.status : "Researched",
    touches: arr(r && r.touches).map((t, j) => ({
      n: Number(t && t.n) || j + 1,
      channel: String((t && t.channel) || "Other"),
      date: String((t && t.date) || todayStr()),
      note: String((t && t.note) || ""),
    })),
    notes: String((r && r.notes) || ""),
    summary: String((r && r.summary) || ""),
    meddpicc: (() => {
      const src = (r && r.meddpicc && typeof r.meddpicc === "object" && !Array.isArray(r.meddpicc)) ? r.meddpicc : {};
      const out = {};
      MEDDPICC_ITEMS.forEach(({ key }) => {
        if (src[key] === "partial" || src[key] === "confirmed") out[key] = src[key];
      });
      return out;
    })(),
    contacts: arr(r && r.contacts),
    signals: arr(r && r.signals),
    sources: arr(r && r.sources),
    caution: String((r && r.caution) || ""),
    sizeEvidence: String((r && r.sizeEvidence) || ""),
    custodyEvidence: String((r && r.custodyEvidence) || ""),
    companyContact: (r && r.companyContact) || null,
    createdAt: (r && r.createdAt) || new Date().toISOString(),
    updatedAt: (r && r.updatedAt) || new Date().toISOString(),
  };
}

/* --- IndexedDB helpers: persist the vault folder handle across reloads --- */

function idbOpen() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("prospect-radar-fs", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("handles");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbSet(key, value) {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("handles", "readwrite");
    tx.objectStore("handles").put(value, key);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
async function idbGet(key) {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("handles", "readonly");
    const rq = tx.objectStore("handles").get(key);
    rq.onsuccess = () => resolve(rq.result || null);
    rq.onerror = () => reject(rq.error);
  });
}

/* ---------------- Resilient JSON extraction ---------------- */

function repairJson(s) {
  // 1) Drop any trailing incomplete element after the last complete "}," or "],"
  const cut = Math.max(s.lastIndexOf("},"), s.lastIndexOf("],"));
  if (cut > -1) s = s.slice(0, cut + 1);
  // 2) Balance unclosed brackets/braces (string-aware scan)
  const stack = [];
  let inStr = false;
  let esc = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (esc) { esc = false; continue; }
    if (ch === "\\") { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === "{" || ch === "[") stack.push(ch);
    else if (ch === "}" || ch === "]") stack.pop();
  }
  if (inStr) s += '"';
  while (stack.length) {
    const open = stack.pop();
    s += open === "{" ? "}" : "]";
  }
  // 3) Remove trailing commas before closers
  s = s.replace(/,\s*([}\]])/g, "$1");
  return s;
}

function extractJson(raw) {
  let s = String(raw || "").replace(/```json/gi, "").replace(/```/g, "");
  const a = s.indexOf("{");
  const b = s.lastIndexOf("}");
  if (a === -1) throw new Error("No JSON object found");
  s = b > a ? s.slice(a, b + 1) : s.slice(a);
  try {
    return JSON.parse(s);
  } catch (e) {
    return JSON.parse(repairJson(s));
  }
}

function normalizeResearch(r) {
  const arr = (x) => (Array.isArray(x) ? x : []);
  return {
    company_summary: String(r.company_summary || ""),
    client_type: r.client_type,
    region: r.region,
    size_band: r.size_band,
    best_trigger: r.best_trigger,
    current_custody: r.current_custody,
    size_evidence: String(r.size_evidence || ""),
    custody_evidence: String(r.custody_evidence || ""),
    company_contact: {
      email: String((r.company_contact && r.company_contact.email) || ""),
      phone: String((r.company_contact && r.company_contact.phone) || ""),
    },
    trigger_events: arr(r.trigger_events).slice(0, 3),
    contacts: arr(r.contacts).slice(0, 4),
    sources: arr(r.sources).slice(0, 3),
    caution: String(r.caution || ""),
  };
}

/* ---------------- Research prompt ---------------- */

function buildPrompt(company, context, depth, canSearch = true) {
  const searchLine = canSearch
    ? `BE ECONOMICAL: use at most ${depth.searches} web searches. Start with ONE combined query (company name + crypto/custody/funding/news); search again only if a scoring field is still unknown. Do not open pages you don't need. Keep any reasoning very brief.`
    : `NOTE: you have NO web access. Answer only from what you reliably know about this company. If unsure about a field, use "unknown" or "none" rather than guessing. Leave contact emails/phones and source URLs blank unless certain they are real. Flag low confidence in "caution".`;
  return `You are a B2B research assistant for an SDR at Hex Trust, a regulated digital-asset custodian licensed in Hong Kong, Singapore and Dubai (products: Custody, Staking, OTC/Markets, Convert-to-Pay payments, Token Wrapping, Wallet-as-a-Service, Aura wealth).

Research the company "${company}".${context ? ` Known context: ${context}` : ""}

${searchLine}

Return ONLY minified JSON — no prose, no markdown, no code fences — exactly this shape:
{"company_summary":"...","client_type":"foundation|crypto_fund|payments|otc|family_office|bank|corporate|other","region":"hk_sg_dubai|global_apac|apac_other|mena|europe|us_only","size_band":"over_1b|250m_1b|50_250m|10_50m|under_10m|unknown","best_trigger":"tge|fund_launch|regulatory|incident|staking_expansion|token_unlock|hiring|none","current_custody":"self_custody|exchange|none_yet|competitor_renewal|competitor_locked|unknown","size_evidence":"...","custody_evidence":"...","company_contact":{"email":"","phone":""},"trigger_events":[{"event":"...","when":"...","implication":"...","source":"...","url":"https://..."}],"contacts":[{"name":"...","title":"...","persona":"ops|finance|compliance|tech|exec|bd","email":"","phone":"","evidence":"...","url":"https://..."}],"sources":[{"title":"...","url":"https://..."}],"caution":"..."}

Hard rules: enum fields must use one of the listed values EXACTLY. Max ${depth.events} trigger_events, max ${depth.contacts} contacts, max ${depth.sources} sources. Every string under 20 words. In "implication", state in under 20 words how that event signals a need for a specific Hex Trust product (Custody, Staking, OTC/Markets, Convert-to-Pay, Token Wrapping, WaaS, Aura). Only publicly named people. CONTACT INFO: fill a contact's "email"/"phone" only if it is actually published on an official page (company site, press release, filing) — NEVER guess, construct, or pattern-infer addresses or numbers; leave "" when not found. "company_contact" is the company's general public email/phone as a fallback, same rule. Every url must be a real URL you actually found. If uncertain, use "unknown" or "none" and note it in caution.`;
}

/* ---------------- Assistant chat helpers ---------------- */

function nextDueLine(due) {
  if (!due) return "no reminders (closed)";
  if (due.start) return "cadence not started — log Touch 1";
  if (due.suggestNurture) return "cadence complete — consider Nurture";
  return `${due.due} — ${due.action}`;
}

function buildRecordDetail(r) {
  const b = bandOf(r.score);
  const lines = [];
  lines.push(`### ${r.company}`);
  lines.push(`- Score ${r.score}/100 · Band ${b.band} (${b.note}) · Status: ${r.status}`);
  lines.push(
    `- Classification: ${labelOf(CLIENT_TYPES, r.form.clientType)} · ${labelOf(REGIONS, r.form.region)} · size ${labelOf(SIZES, r.form.size)} · trigger ${labelOf(TRIGGERS, r.form.trigger)} · custody ${labelOf(CUSTODY, r.form.custody)}`
  );
  lines.push(`- Next due: ${nextDueLine(nextDueFor(r))}`);
  const mp = meddpiccSummary(r);
  lines.push(
    `- MEDDPICC: confirmed [${mp.confirmed.join(", ") || "none"}] · partial [${mp.partial.join(", ") || "none"}] · unknown [${mp.unknown.join(", ") || "none"}]`
  );
  const pc = personaCoverage(r);
  lines.push(
    `- Persona coverage: covered [${pc.covered.join(", ") || "none"}] · missing [${pc.missing.join(", ") || "none"}]`
  );
  if (r.summary) lines.push(`- Summary: ${r.summary}`);
  if (r.caution) lines.push(`- Caution: ${r.caution}`);
  if ((r.contacts || []).length) {
    lines.push("- Contacts:");
    r.contacts.forEach((p) => {
      const bits = [p.email, p.phone, p.url].filter(Boolean).join(" · ");
      lines.push(`  - ${p.name || "?"} — ${p.title || "?"} (${p.persona || "?"})${bits ? ": " + bits : ""}`);
    });
  }
  if (r.companyContact && (r.companyContact.email || r.companyContact.phone)) {
    lines.push(
      `- Company general contact: ${[r.companyContact.email, r.companyContact.phone].filter(Boolean).join(" · ")}`
    );
  }
  if ((r.signals || []).length) {
    lines.push("- Signals:");
    r.signals.forEach((t) => {
      lines.push(
        `  - ${t.event || "?"}${t.when ? ` (${t.when})` : ""}${t.implication ? ` — why it matters: ${t.implication}` : ""}`
      );
    });
  }
  if ((r.touches || []).length) {
    lines.push("- Touch history:");
    r.touches.forEach((t) => lines.push(`  - T${t.n} · ${t.channel} · ${t.date}${t.note ? ` — ${t.note}` : ""}`));
  }
  if (r.notes && r.notes.trim()) {
    lines.push("- Notes:");
    r.notes.trim().split(/\r?\n/).forEach((n) => lines.push(`  - ${n}`));
  }
  return lines.join("\n");
}

function buildChatSystem(records, scopeIds) {
  const lines = [];
  lines.push(
    "You are the pipeline assistant for an SDR at Hex Trust, a regulated digital-asset custodian licensed in Hong Kong, Singapore and Dubai (products: Custody, Staking, OTC/Markets, Convert-to-Pay payments, Token Wrapping, Wallet-as-a-Service, Aura wealth). You help with outreach drafts, prioritisation and next steps."
  );
  lines.push(
    `Be concise and practical. Everything you write is a DRAFT only — a human always reviews and sends. Never invent facts, names, emails or phone numbers; if something is not in the data below, say it is unknown. Today is ${todayStr()}.`
  );
  lines.push("");
  lines.push(
    "METHOD — silently apply these in every answer; never lecture the user about the frameworks by name unless asked:\n" +
      "- MEDDPICC: a company's unknown items are what to ask or find out next; work them into questions and plans.\n" +
      "- SPIN discovery: build question sets in the order Situation → Problem → Implication → Need-payoff, weighted toward Implication (make the cost of the problem vivid).\n" +
      "- Challenger: open outreach by TEACHING an insight tied to the company's trigger event — never a self-introduction. Tailor per persona: finance → cost, audit and LP expectations; ops → process and key-person risk; compliance → evidence for regulators; tech → architecture and integration; exec → growth and institutional clients.\n" +
      "- Multithreading: flag companies where everything runs through a single contact and suggest the next persona to bring in.\n" +
      "- MAP: every draft or plan ends with one specific, dated next step."
  );
  lines.push("");
  if (records.length) {
    lines.push("PIPELINE OVERVIEW (one line per company — company | score/band | status | client type | touches | next due + action):");
    records.forEach((r) => {
      const b = bandOf(r.score);
      lines.push(
        `- ${r.company} | ${r.score}/100 Band ${b.band} | ${r.status} | ${labelOf(CLIENT_TYPES, r.form.clientType)} | ${(r.touches || []).length} touches | next: ${nextDueLine(nextDueFor(r))}`
      );
    });
  } else {
    lines.push("PIPELINE OVERVIEW: the pipeline is currently empty.");
  }
  const picked = records.filter((r) => (scopeIds || []).includes(r.id));
  if (picked.length) {
    lines.push("");
    lines.push("FULL DETAIL for the companies the user selected as context:");
    picked.forEach((r) => {
      lines.push("");
      lines.push(buildRecordDetail(r));
    });
  }
  lines.push("");
  lines.push(
    "EDIT PROPOSALS: only when the user EXPLICITLY asks you to change the pipeline (add a note, change a status, log a touch) may you propose edits, by ending your reply with exactly one fenced block in this exact form:"
  );
  lines.push("```json actions");
  lines.push('[{"type":"add_note","company":"<exact name>","text":"..."},');
  lines.push(' {"type":"set_status","company":"<exact name>","status":"<one of: ' + STATUSES.join(" | ") + '>"},');
  lines.push(' {"type":"log_touch","company":"<exact name>","channel":"<one of: ' + CHANNELS.join(" | ") + '>","date":"YYYY-MM-DD","note":"..."}]');
  lines.push("```");
  lines.push(
    "Include only the action objects the user asked for (one or more, any of the three types). Company names must match the overview exactly. The user reviews every proposal and clicks Apply — nothing you output is ever applied automatically. If the user did not explicitly ask for a pipeline change, do NOT output an actions block."
  );
  return lines.join("\n");
}

const CHAT_ACTION_TYPES = ["add_note", "set_status", "log_touch"];

function extractChatActions(text) {
  const s = String(text || "");
  const re = /```[^\n]*\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(s))) {
    let parsed;
    try {
      parsed = JSON.parse(m[1].trim());
    } catch (e) {
      continue;
    }
    if (
      Array.isArray(parsed) &&
      parsed.length > 0 &&
      parsed.every((a) => a && typeof a === "object" && CHAT_ACTION_TYPES.includes(a.type))
    ) {
      return {
        text: (s.slice(0, m.index) + s.slice(m.index + m[0].length)).trim(),
        actions: parsed.map((a) => ({ ...a, state: "pending", failReason: "" })),
      };
    }
  }
  return { text: s.trim(), actions: [] };
}

function describeChatAction(a) {
  if (a.type === "add_note") return `Add note to ${a.company}: “${a.text}”`;
  if (a.type === "set_status") return `Set ${a.company} status to ${a.status}`;
  if (a.type === "log_touch")
    return `Log ${a.channel || "?"} touch on ${a.date || "?"} for ${a.company}${a.note ? ` — “${a.note}”` : ""}`;
  return "Unknown action";
}

function slugify(s) {
  return (
    String(s || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "company"
  );
}

function buildBriefRequest(company) {
  return `Write a meeting brief for "${company}" in markdown, under 450 words total, with EXACTLY these six sections in this order and nothing else:

## Objective
One sentence on what this meeting must achieve, plus the dated next step to ask for.

## Insights to teach
3 Challenger-style insights for this company's client type and trigger — teach something they likely haven't considered; no self-introduction.

## SPIN question bank
2 Situation, 2 Problem, 3 Implication and 2 Need-payoff questions, each specific to this company's signals.

## Qualification gaps
Turn this company's unknown MEDDPICC items into natural questions to weave into the conversation.

## Likely objections
3 likely objections, each with a one-line response.

## Proposed next step
One concrete, dated ask.

Do NOT output a json actions block. Markdown only.`;
}

function copyTextFallback(text) {
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    return true;
  } catch (e) {
    return false;
  }
}

/* ============================================================ */

// Parse an /api response defensively — an empty or non-JSON body almost always
// means the Cloudflare Functions backend isn't running (e.g. plain `npm run dev`
// instead of `npx wrangler pages dev dist`, or a static host with no functions).
async function readApiJson(resp) {
  const raw = await resp.text();
  if (!raw.trim()) {
    throw new Error(
      `The API sent back an empty response (HTTP ${resp.status}). The research/assistant backend isn't running here — test with "npm run build && npx wrangler pages dev dist" (not "npm run dev"), or use your deployed Cloudflare site.`
    );
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(
      `The API sent back a non-JSON response (HTTP ${resp.status}). The backend may not be running — use "npx wrangler pages dev dist" or your deployed site.`
    );
  }
}

export default function ProspectRadar() {
  const [tab, setTab] = useState("research");

  // research state
  const [provider, setProvider] = useState("anthropic");
  const [model, setModel] = useState("claude-opus-4-8");
  const [depth, setDepth] = useState("standard");
  const [company, setCompany] = useState("");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [research, setResearch] = useState(null);
  const [rawFallback, setRawFallback] = useState(null);
  const [researchError, setResearchError] = useState(null);
  const [applied, setApplied] = useState(false);
  const [callCount, setCallCount] = useState(0);

  // scoring form
  const [form, setForm] = useState({ clientType: "", region: "", size: "", trigger: "", custody: "" });

  // pipeline
  const [records, setRecords] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [saveWarn, setSaveWarn] = useState(false);
  const [savedFlash, setSavedFlash] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [sortKey, setSortKey] = useState("score");
  const [sortDir, setSortDir] = useState("desc");
  const [confirmDelete, setConfirmDelete] = useState(null);

  // touch-log inputs (per open drawer)
  const [logChannel, setLogChannel] = useState("Email");
  const [logDate, setLogDate] = useState(todayStr());
  const [logNote, setLogNote] = useState("");

  const rowRefs = useRef({});

  // vault sync + import/restore
  const fsSupported = typeof window !== "undefined" && "showDirectoryPicker" in window;
  const [dirHandle, setDirHandle] = useState(null);
  const [vaultStatus, setVaultStatus] = useState("off"); // off | resume | on | error
  const [vaultName, setVaultName] = useState("");
  const [pendingImport, setPendingImport] = useState(null);
  const [importMsg, setImportMsg] = useState("");
  const fileInputRef = useRef(null);

  // pipeline table filter
  const [filterText, setFilterText] = useState("");

  // assistant chat panel
  const [chatOpen, setChatOpen] = useState(false);
  const [chatProvider, setChatProvider] = useState("anthropic");
  const [chatModel, setChatModel] = useState("claude-opus-4-8");
  const [chatSearch, setChatSearch] = useState(false);
  const [chatScope, setChatScope] = useState([]); // record ids whose full detail is sent
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoaded, setChatLoaded] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatFilter, setChatFilter] = useState("all");
  const [copiedId, setCopiedId] = useState(null);
  const chatEndRef = useRef(null);

  // meeting brief (one at a time, keyed to a record)
  const [briefState, setBriefState] = useState(null); // {id, status: "loading"|"done"|"error", text?, msg?}
  const [briefSaveMsg, setBriefSaveMsg] = useState(null); // {id, msg}

  /* ---------- persistence ---------- */
  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY);
        if (res && res.value) {
          const parsed = JSON.parse(res.value);
          if (Array.isArray(parsed)) setRecords(parsed);
        }
      } catch (e) {
        // missing key throws — treat as empty pipeline
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // restore the previously connected vault folder (Chrome/Edge only)
  useEffect(() => {
    if (!fsSupported) return;
    (async () => {
      try {
        const h = await idbGet("vaultDir");
        if (!h) return;
        setDirHandle(h);
        setVaultName(h.name || "");
        const perm = await h.queryPermission({ mode: "readwrite" });
        setVaultStatus(perm === "granted" ? "on" : "resume");
      } catch (e) {
        // ignore — user can reconnect manually
      }
    })();
  }, [fsSupported]);

  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        const res = await window.storage.set(STORAGE_KEY, JSON.stringify(records));
        setSaveWarn(!res);
      } catch (e) {
        setSaveWarn(true);
      }
    })();
  }, [records, loaded]);

  // auto-write the Markdown mirror into the connected vault folder
  useEffect(() => {
    if (!loaded || vaultStatus !== "on" || !dirHandle) return;
    const t = setTimeout(async () => {
      try {
        const sub = await dirHandle.getDirectoryHandle(VAULT_DIR, { create: true });
        const fh = await sub.getFileHandle(VAULT_FILENAME, { create: true });
        const w = await fh.createWritable();
        await w.write(buildMarkdown(records));
        await w.close();
      } catch (e) {
        setVaultStatus("error");
      }
    }, 800);
    return () => clearTimeout(t);
  }, [records, loaded, vaultStatus, dirHandle]);

  useEffect(() => {
    setLogChannel("Email");
    setLogDate(todayStr());
    setLogNote("");
    setConfirmDelete(null);
    setBriefSaveMsg(null);
  }, [expandedId]);

  // chat history: load once, prune messages older than 15 days
  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(CHAT_KEY);
        if (res && res.value) {
          const parsed = JSON.parse(res.value);
          if (Array.isArray(parsed)) {
            const cutoff = Date.now() - CHAT_MAX_AGE_MS;
            setChatMessages(
              parsed
                .filter((m) => m && typeof m === "object" && typeof m.content === "string" && Number(m.ts) > cutoff)
                .map((m, i) => ({
                  id: String(m.id || `${m.ts}_${i}`),
                  role: m.role === "assistant" ? "assistant" : "user",
                  content: m.content,
                  actions: Array.isArray(m.actions) ? m.actions : [],
                  companies: Array.isArray(m.companies) ? m.companies : [],
                  ts: Number(m.ts),
                  error: !!m.error,
                }))
            );
          }
        }
      } catch (e) {
        // missing key throws — start with an empty chat
      } finally {
        setChatLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!chatLoaded) return;
    (async () => {
      try {
        await window.storage.set(CHAT_KEY, JSON.stringify(chatMessages));
      } catch (e) {
        // chat persistence is best-effort; pipeline data has its own warning
      }
    })();
  }, [chatMessages, chatLoaded]);

  // keep the newest message in view while the panel is open
  useEffect(() => {
    if (chatOpen && chatEndRef.current && chatEndRef.current.scrollIntoView) {
      chatEndRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [chatMessages, chatLoading, chatOpen]);

  /* ---------- research call ---------- */
  async function runResearch() {
    const name = company.trim();
    setResearchError(null);
    setRawFallback(null);
    setResearch(null);
    setApplied(false);
    if (!name) {
      setResearchError("Enter a company name first.");
      return;
    }
    setLoading(true);
    const depthCfg = DEPTHS.find((d) => d.id === depth) || DEPTHS[1];
    let lastRaw = "";
    let lastErr = "";
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        setCallCount((c) => c + 1);
        // All AI calls go through our own Cloudflare Pages Function so API keys
        // stay server-side (see functions/api/research.js). NEVER put keys here.
        const resp = await fetch("/api/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider,
            model,
            max_tokens: depthCfg.maxTokens,
            prompt: buildPrompt(name, context.trim(), depthCfg, provider !== "deepseek"),
          }),
        });
        const data = await readApiJson(resp);
        if (data.error) throw new Error(data.error);
        const text = String(data.text || "");
        if (!text.trim()) throw new Error("Empty response");
        lastRaw = text;
        const parsed = normalizeResearch(extractJson(text));
        setResearch({ ...parsed, forCompany: name });
        setLoading(false);
        return;
      } catch (e) {
        lastErr = (e && e.message) || "";
        if (attempt === 2) {
          if (lastRaw) {
            setRawFallback(lastRaw);
          } else {
            setResearchError(
              lastErr
                ? `Research failed: ${lastErr}`
                : "Research didn't come back — the model or network may be busy. Try again in a moment."
            );
          }
        }
      }
    }
    setLoading(false);
  }

  function applyResearch() {
    if (!research) return;
    const next = { ...form };
    if (CLIENT_TYPES.some((o) => o.v === research.client_type)) next.clientType = research.client_type;
    if (REGIONS.some((o) => o.v === research.region)) next.region = research.region;
    if (SIZES.some((o) => o.v === research.size_band)) next.size = research.size_band;
    if (TRIGGERS.some((o) => o.v === research.best_trigger)) next.trigger = research.best_trigger;
    if (CUSTODY.some((o) => o.v === research.current_custody)) next.custody = research.current_custody;
    setForm(next);
    setApplied(true);
  }

  /* ---------- scoring ---------- */
  const score = useMemo(() => computeScore(form), [form]);
  const filled = FIELDS.filter((f) => form[f.key]).length;
  const band = bandOf(score);
  const recProducts = form.clientType ? PRODUCTS[form.clientType] || PRODUCTS.other : null;
  const angle = form.trigger ? ANGLES[form.trigger] : null;

  /* ---------- save to pipeline ---------- */
  function saveToPipeline() {
    const name = company.trim();
    if (!name) {
      setSavedFlash("Enter a company name before saving.");
      return;
    }
    const attach =
      research && research.forCompany && research.forCompany.toLowerCase() === name.toLowerCase()
        ? research
        : null;
    const now = new Date().toISOString();
    setRecords((prev) => {
      const idx = prev.findIndex((r) => r.company.trim().toLowerCase() === name.toLowerCase());
      if (idx > -1) {
        // MERGE: refresh score/research, keep touches, notes, status
        const old = prev[idx];
        const merged = {
          ...old,
          company: name,
          form: { ...form },
          score,
          summary: attach ? attach.company_summary : old.summary,
          contacts: attach ? rankContacts(attach.contacts, form.clientType || attach.client_type) : old.contacts,
          signals: attach ? attach.trigger_events : old.signals,
          sources: attach ? attach.sources : old.sources,
          caution: attach ? attach.caution : old.caution,
          companyContact: attach ? attach.company_contact : old.companyContact,
          sizeEvidence: attach ? attach.size_evidence : old.sizeEvidence,
          custodyEvidence: attach ? attach.custody_evidence : old.custodyEvidence,
          updatedAt: now,
        };
        const copy = [...prev];
        copy[idx] = merged;
        return copy;
      }
      return [
        ...prev,
        {
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          company: name,
          form: { ...form },
          score,
          status: "Researched",
          touches: [],
          notes: "",
          meddpicc: {},
          summary: attach ? attach.company_summary : "",
          contacts: attach ? rankContacts(attach.contacts, form.clientType || attach.client_type) : [],
          signals: attach ? attach.trigger_events : [],
          sources: attach ? attach.sources : [],
          caution: attach ? attach.caution : "",
          companyContact: attach ? attach.company_contact : null,
          sizeEvidence: attach ? attach.size_evidence : "",
          custodyEvidence: attach ? attach.custody_evidence : "",
          createdAt: now,
          updatedAt: now,
        },
      ];
    });
    setSavedFlash(`Saved "${name}" to pipeline.`);
    setTimeout(() => setSavedFlash(""), 3500);
  }

  /* ---------- pipeline mutations ---------- */
  function updateRecord(id, patch) {
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r)));
  }
  function logTouch(rec) {
    const touch = {
      n: (rec.touches || []).length + 1,
      channel: logChannel,
      date: logDate || todayStr(),
      note: logNote.trim(),
    };
    const patch = { touches: [...(rec.touches || []), touch] };
    if ((rec.touches || []).length === 0 && rec.status === "Researched") patch.status = "Contacted";
    updateRecord(rec.id, patch);
    setLogChannel("Email");
    setLogDate(todayStr());
    setLogNote("");
  }
  function deleteRecord(id) {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    setExpandedId(null);
    setConfirmDelete(null);
  }

  /* ---------- assistant chat ---------- */
  function performChatAction(a) {
    const name = String(a.company || "").trim().toLowerCase();
    const rec = records.find((r) => r.company.trim().toLowerCase() === name);
    if (!rec) return { ok: false, reason: `no pipeline company named “${a.company}”` };
    if (a.type === "add_note") {
      const text = String(a.text || "").trim();
      if (!text) return { ok: false, reason: "the note is empty" };
      const line = `[AI ${todayStr()}] ${text}`;
      const existing = (rec.notes || "").replace(/\s+$/, "");
      updateRecord(rec.id, { notes: existing ? `${existing}\n${line}` : line });
      return { ok: true };
    }
    if (a.type === "set_status") {
      if (!STATUSES.includes(a.status)) return { ok: false, reason: `“${a.status}” is not a valid status` };
      updateRecord(rec.id, { status: a.status });
      return { ok: true };
    }
    if (a.type === "log_touch") {
      const channel = CHANNELS.find((c) => c.toLowerCase() === String(a.channel || "").trim().toLowerCase());
      if (!channel) return { ok: false, reason: `“${a.channel}” is not a valid channel` };
      const date = String(a.date || "").trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, reason: "date must be YYYY-MM-DD" };
      // mirror logTouch: number the touch, first touch moves Researched → Contacted
      const touch = { n: (rec.touches || []).length + 1, channel, date, note: String(a.note || "").trim() };
      const patch = { touches: [...(rec.touches || []), touch] };
      if ((rec.touches || []).length === 0 && rec.status === "Researched") patch.status = "Contacted";
      updateRecord(rec.id, patch);
      return { ok: true };
    }
    return { ok: false, reason: "unknown action type" };
  }

  function resolveChatAction(msgId, idx, apply) {
    const msg = chatMessages.find((m) => m.id === msgId);
    const a = msg && (msg.actions || [])[idx];
    if (!a || (a.state && a.state !== "pending")) return;
    let state = "dismissed";
    let failReason = "";
    if (apply) {
      const res = performChatAction(a);
      state = res.ok ? "applied" : "failed";
      failReason = res.reason || "";
    }
    setChatMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? { ...m, actions: (m.actions || []).map((x, i) => (i === idx ? { ...x, state, failReason } : x)) }
          : m
      )
    );
  }

  async function sendChat() {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    const scope = chatScope.filter((id) => records.some((r) => r.id === id));
    const stamp = Date.now();
    const userMsg = {
      id: `${stamp}_u_${Math.random().toString(36).slice(2, 6)}`,
      role: "user",
      content: text,
      actions: [],
      companies: scope,
      ts: stamp,
    };
    const history = [...chatMessages, userMsg];
    setChatMessages(history);
    setChatInput("");
    setChatLoading(true);
    try {
      // last 12 turns, error bubbles excluded, trimmed so the thread starts with a user turn
      const apiMsgs = history
        .filter((m) => !m.error)
        .slice(-12)
        .map((m) => ({ role: m.role, content: m.content }));
      while (apiMsgs.length && apiMsgs[0].role !== "user") apiMsgs.shift();
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: chatProvider,
          model: chatModel,
          system: buildChatSystem(records, scope),
          messages: apiMsgs,
          max_tokens: 2000,
          search: chatProvider === "deepseek" ? false : chatSearch,
        }),
      });
      const data = await readApiJson(resp);
      if (data.error) throw new Error(data.error);
      const raw = String(data.text || "");
      if (!raw.trim()) throw new Error("The model returned an empty reply — try again.");
      const cleaned = extractChatActions(raw);
      setChatMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}_a_${Math.random().toString(36).slice(2, 6)}`,
          role: "assistant",
          content: cleaned.text || "(empty reply)",
          actions: cleaned.actions,
          companies: scope,
          ts: Date.now(),
        },
      ]);
    } catch (e) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}_e_${Math.random().toString(36).slice(2, 6)}`,
          role: "assistant",
          content: (e && e.message) || "Request failed — check your connection and try again.",
          actions: [],
          companies: scope,
          ts: Date.now(),
          error: true,
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  function copyChat(msg) {
    const done = () => {
      setCopiedId(msg.id);
      setTimeout(() => setCopiedId((c) => (c === msg.id ? null : c)), 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(msg.content).then(done, () => {
        if (copyTextFallback(msg.content)) done();
      });
    } else if (copyTextFallback(msg.content)) {
      done();
    }
  }

  /* ---------- meeting brief ---------- */
  async function generateBrief(rec) {
    if (briefState && briefState.status === "loading") return;
    setBriefSaveMsg(null);
    setBriefState({ id: rec.id, status: "loading" });
    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: chatProvider,
          model: chatModel,
          system: buildChatSystem(records, [rec.id]),
          messages: [{ role: "user", content: buildBriefRequest(rec.company) }],
          max_tokens: 2000,
          search: chatProvider === "deepseek" ? false : chatSearch,
        }),
      });
      const data = await readApiJson(resp);
      if (data.error) throw new Error(data.error);
      const text = String(data.text || "").trim();
      if (!text) throw new Error("The model returned an empty brief — try again.");
      setBriefState({ id: rec.id, status: "done", text });
    } catch (e) {
      setBriefState({
        id: rec.id,
        status: "error",
        msg: (e && e.message) || "Brief request failed — check your connection and try again.",
      });
    }
  }

  function downloadTextFile(filename, content) {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function saveBrief(rec) {
    if (!briefState || briefState.id !== rec.id || briefState.status !== "done") return;
    const filename = `${slugify(rec.company)}-${todayStr()}.md`;
    const content = `---\ncompany: ${rec.company}\ndate: ${todayStr()}\ntype: brief\n---\n\n${briefState.text}\n`;
    const flash = (msg) => {
      setBriefSaveMsg({ id: rec.id, msg });
      setTimeout(() => setBriefSaveMsg((c) => (c && c.id === rec.id ? null : c)), 4000);
    };
    if (vaultStatus === "on" && dirHandle) {
      try {
        const sub = await dirHandle.getDirectoryHandle("03-Briefs", { create: true });
        const fh = await sub.getFileHandle(filename, { create: true });
        const w = await fh.createWritable();
        await w.write(content);
        await w.close();
        flash(`Saved to 03-Briefs/${filename} in your vault.`);
        return;
      } catch (e) {
        // vault write failed — fall through to a download so the brief isn't lost
      }
    }
    try {
      downloadTextFile(filename, content);
      flash(`Downloaded ${filename} — move it into your vault's 03-Briefs folder.`);
    } catch (e) {
      flash("Couldn't save the brief — use Copy instead.");
    }
  }

  /* ---------- derived pipeline rows ---------- */
  const rows = useMemo(() => {
    return records.map((r) => {
      const due = nextDueFor(r);
      const touches = r.touches || [];
      const last = touches.length ? touches.reduce((m, t) => (t.date > m ? t.date : m), touches[0].date) : null;
      return { ...r, dueInfo: due, lastTouch: last };
    });
  }, [records]);

  const sortedRows = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "score") cmp = a.score - b.score;
      else {
        const da = a.dueInfo && a.dueInfo.due ? a.dueInfo.due : "9999-99-99";
        const db = b.dueInfo && b.dueInfo.due ? b.dueInfo.due : "9999-99-99";
        cmp = da < db ? -1 : da > db ? 1 : 0;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  // live text filter over the sorted rows (sorting still applies)
  const filteredRows = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return sortedRows;
    return sortedRows.filter((r) => {
      const hay = [
        r.company,
        r.notes,
        r.summary,
        r.status,
        labelOf(CLIENT_TYPES, r.form.clientType),
        ...(r.contacts || []).flatMap((p) => [(p && p.name) || "", (p && p.title) || ""]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [sortedRows, filterText]);

  const visibleChat = useMemo(
    () => (chatFilter === "all" ? chatMessages : chatMessages.filter((m) => (m.companies || []).includes(chatFilter))),
    [chatMessages, chatFilter]
  );

  const desk = useMemo(() => {
    const t = todayStr();
    const overdue = [];
    const dueToday = [];
    const next3 = [];
    rows.forEach((r) => {
      if (!r.dueInfo || !r.dueInfo.due) return;
      const diff = daysBetween(t, r.dueInfo.due);
      if (diff < 0) overdue.push(r);
      else if (diff === 0) dueToday.push(r);
      else if (diff <= 3) next3.push(r);
    });
    const byDue = (a, b) => (a.dueInfo.due < b.dueInfo.due ? -1 : 1);
    return { overdue: overdue.sort(byDue), dueToday: dueToday.sort(byDue), next3: next3.sort(byDue) };
  }, [rows]);

  function jumpToRow(id) {
    setExpandedId(id);
    setTimeout(() => {
      const el = rowRefs.current[id];
      if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
  }

  function toggleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "score" ? "desc" : "asc");
    }
  }

  /* ---------- CSV export (includes notes + touch history) ---------- */
  function exportCsv() {
    const esc = (v) => {
      const s = String(v == null ? "" : v);
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = [
      "Company", "Score", "Band", "Status", "Client type", "Region", "Size", "Trigger", "Custody",
      "Touches", "Last touch", "Next due", "Next action", "Notes", "Touch history", "Summary",
    ];
    const lines = [header.map(esc).join(",")];
    rows.forEach((r) => {
      const d = r.dueInfo || {};
      const history = (r.touches || [])
        .map((t) => `T${t.n} ${t.channel} ${t.date}${t.note ? " — " + t.note : ""}`)
        .join(" | ");
      lines.push(
        [
          r.company,
          r.score,
          bandOf(r.score).band,
          r.status,
          labelOf(CLIENT_TYPES, r.form.clientType),
          labelOf(REGIONS, r.form.region),
          labelOf(SIZES, r.form.size),
          labelOf(TRIGGERS, r.form.trigger),
          labelOf(CUSTODY, r.form.custody),
          (r.touches || []).length,
          r.lastTouch || "",
          d.due || "",
          d.suggestNurture ? "Suggest: move to Nurture" : d.start ? "Log Touch 1 to start cadence" : d.action || "",
          r.notes || "",
          history,
          r.summary || "",
        ].map(esc).join(",")
      );
    });
    try {
      const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prospect-radar-${todayStr()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setSaveWarn(true);
    }
  }

  /* ---------- Markdown mirror: connect, export, import ---------- */
  const toolBtn = {
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 9,
    color: C.forestDark,
    cursor: "pointer",
  };

  async function writeVaultNow(h) {
    const sub = await h.getDirectoryHandle(VAULT_DIR, { create: true });
    const fh = await sub.getFileHandle(VAULT_FILENAME, { create: true });
    const w = await fh.createWritable();
    await w.write(buildMarkdown(records));
    await w.close();
  }

  async function connectVault() {
    try {
      const h = await window.showDirectoryPicker({ mode: "readwrite" });
      setDirHandle(h);
      setVaultName(h.name || "");
      setVaultStatus("on");
      try {
        await idbSet("vaultDir", h);
      } catch (e) {
        // handle persistence failed — sync still works this session
      }
      await writeVaultNow(h);
    } catch (e) {
      // user cancelled the picker — do nothing
    }
  }

  async function resumeVault() {
    if (!dirHandle) return;
    try {
      const perm = await dirHandle.requestPermission({ mode: "readwrite" });
      if (perm === "granted") {
        setVaultStatus("on");
        await writeVaultNow(dirHandle);
      }
    } catch (e) {
      setVaultStatus("error");
    }
  }

  function exportMarkdown() {
    try {
      const blob = new Blob([buildMarkdown(records)], { type: "text/markdown;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = MD_FILENAME;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setSaveWarn(true);
    }
  }

  function onImportFile(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const recs = parseImport(String(reader.result));
        if (!recs || !recs.length) {
          setImportMsg("Couldn't find a Prospect Radar backup in that file.");
          setPendingImport(null);
          return;
        }
        setPendingImport(recs.map(sanitizeRecord));
        setImportMsg("");
      } catch (err) {
        setImportMsg("Couldn't read that file — is it a Prospect Radar export (.md or .json)?");
        setPendingImport(null);
      }
    };
    reader.onerror = () => setImportMsg("Couldn't read that file.");
    reader.readAsText(file);
  }

  function confirmImport() {
    if (!pendingImport) return;
    setRecords(pendingImport);
    setPendingImport(null);
    setImportMsg(`Restored ${pendingImport.length} record${pendingImport.length === 1 ? "" : "s"}.`);
    setTimeout(() => setImportMsg(""), 4000);
  }

  /* ============================ UI ============================ */

  const rankedResearchContacts = research
    ? rankContacts(research.contacts, form.clientType || research.client_type)
    : [];

  // Suggested score preview — computed from research enums BEFORE apply
  const previewForm = research
    ? {
        clientType: CLIENT_TYPES.some((o) => o.v === research.client_type) ? research.client_type : "",
        region: REGIONS.some((o) => o.v === research.region) ? research.region : "",
        size: SIZES.some((o) => o.v === research.size_band) ? research.size_band : "",
        trigger: TRIGGERS.some((o) => o.v === research.best_trigger) ? research.best_trigger : "",
        custody: CUSTODY.some((o) => o.v === research.current_custody) ? research.current_custody : "",
      }
    : null;
  const previewScoreVal = previewForm ? computeScore(previewForm) : 0;
  const previewFilled = previewForm ? FIELDS.filter((f) => previewForm[f.key]).length : 0;
  const previewBand = bandOf(previewScoreVal);

  return (
    <div style={{ ...sans, background: C.bg, color: C.ink, minHeight: "100vh" }}>
      <style>{FONTS}</style>

      {/* header */}
      <div className="px-6 pt-7 pb-4" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-6xl mx-auto flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center"
                style={{ width: 40, height: 40, borderRadius: 12, background: C.forest, color: "#F3F0E4", ...serif, fontSize: 20 }}
                aria-hidden="true"
              >
                ◎
              </div>
              <h1 style={{ ...serif, fontSize: 30, fontWeight: 600, color: C.forestDark, lineHeight: 1.1 }}>
                Prospect Radar
              </h1>
            </div>
            <p className="mt-1" style={{ color: C.inkSoft, fontSize: 14 }}>
              Hex Trust · SDR field notebook — research, score, and work the pipeline.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="px-3 py-1 text-sm"
              style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 999, color: C.inkSoft }}
            >
              {callCount} research call{callCount === 1 ? "" : "s"} this session
            </span>
          </div>
        </div>
        {/* tabs */}
        <div className="max-w-6xl mx-auto mt-4 flex gap-2">
          {[
            { id: "research", label: "Research & Score" },
            { id: "pipeline", label: `Pipeline${records.length ? ` (${records.length})` : ""}` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-4 py-2 text-sm font-semibold"
              style={{
                borderRadius: "10px 10px 0 0",
                border: `1px solid ${C.border}`,
                borderBottom: tab === t.id ? `1px solid ${C.bg}` : `1px solid ${C.border}`,
                marginBottom: -1,
                background: tab === t.id ? C.bg : C.panel,
                color: tab === t.id ? C.forestDark : C.inkSoft,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {saveWarn && (
        <div className="max-w-6xl mx-auto mt-3 px-6">
          <div
            className="px-4 py-2 text-sm"
            style={{ background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 10, color: C.amber }}
          >
            Heads up — the last save may not have stuck. Your changes are still on screen; try another edit to re-save.
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-6">
        {tab === "research" ? (
          /* ================= TAB 1 ================= */
          <div className="grid gap-6" style={{ gridTemplateColumns: "minmax(320px, 5fr) minmax(320px, 6fr)" }}>
            {/* LEFT: inputs + scoring */}
            <div className="flex flex-col gap-5">
              <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
                <h2 style={{ ...serif, fontSize: 19, fontWeight: 600, color: C.forestDark }}>Research a company</h2>
                <div className="mt-3 flex flex-col gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: C.inkSoft }}>
                      AI provider
                    </label>
                    <select
                      value={provider}
                      onChange={(e) => {
                        const p = e.target.value;
                        setProvider(p);
                        setModel((MODEL_SETS[p] && MODEL_SETS[p][0].id) || "");
                      }}
                      className="w-full px-3 py-2 text-sm"
                      style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, color: C.ink }}
                    >
                      {PROVIDERS.map((p) => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                    <p className="text-xs mt-1" style={{ color: C.gray }}>
                      API keys live server-side on Cloudflare — this page never sees them. Gemini Flash + Quick depth is the free-tier-friendly combo.
                    </p>
                    {provider === "deepseek" && (
                      <p className="text-xs mt-1" style={{ color: C.amber }}>
                        DeepSeek has no web search — results come from training knowledge, so they may be dated and lack live sources. Best for well-known companies; verify before use.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: C.inkSoft }}>
                      Research model
                    </label>
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full px-3 py-2 text-sm"
                      style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, color: C.ink }}
                    >
                      {(MODEL_SETS[provider] || []).map((m) => (
                        <option key={m.id} value={m.id}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: C.inkSoft }}>
                      Search depth
                    </label>
                    <select
                      value={depth}
                      onChange={(e) => setDepth(e.target.value)}
                      className="w-full px-3 py-2 text-sm"
                      style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, color: C.ink }}
                    >
                      {DEPTHS.map((d) => (
                        <option key={d.id} value={d.id}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: C.inkSoft }}>
                      Company name
                    </label>
                    <input
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="e.g. Meridian Labs"
                      className="w-full px-3 py-2 text-sm"
                      style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, color: C.ink }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: C.inkSoft }}>
                      Context <span className="normal-case font-normal">(optional — what you already know)</span>
                    </label>
                    <input
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                      placeholder="e.g. L1 foundation, heard TGE in Q4"
                      className="w-full px-3 py-2 text-sm"
                      style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, color: C.ink }}
                    />
                  </div>
                  <button
                    onClick={runResearch}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-semibold self-start"
                    style={{
                      background: loading ? C.midGreen : C.forest,
                      color: "#F6F3E7",
                      borderRadius: 10,
                      border: "none",
                      cursor: loading ? "wait" : "pointer",
                      opacity: loading ? 0.8 : 1,
                    }}
                  >
                    {loading ? "Researching…" : "Research"}
                  </button>
                  <p className="text-xs" style={{ color: C.inkSoft }}>
                    Research never fills the form by itself — review it on the right, then apply. Manual scoring below always works on its own.
                  </p>
                </div>
              </div>

              {/* scoring */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
                <h2 style={{ ...serif, fontSize: 19, fontWeight: 600, color: C.forestDark }}>Score the fit</h2>
                <div className="mt-3 flex flex-col gap-3">
                  {FIELDS.map((f) => (
                    <div key={f.key}>
                      <label className="flex justify-between text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: C.inkSoft }}>
                        <span>{f.label}</span>
                        <span style={{ color: form[f.key] ? C.forest : C.gray }}>
                          {form[f.key] ? `${pts(f.opts, form[f.key])} / ${f.max}` : `— / ${f.max}`}
                        </span>
                      </label>
                      <select
                        value={form[f.key]}
                        onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                        className="w-full px-3 py-2 text-sm"
                        style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, color: C.ink }}
                      >
                        <option value="">Select…</option>
                        {f.opts.map((o) => (
                          <option key={o.v} value={o.v}>
                            {o.label} ({o.pts})
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                {/* score readout */}
                <div className="mt-5 flex items-center gap-4" style={{ borderTop: `1px dashed ${C.border}`, paddingTop: 16 }}>
                  <div style={{ ...serif, fontSize: 46, fontWeight: 700, color: band.color, lineHeight: 1 }}>
                    {score}
                    <span style={{ fontSize: 18, color: C.inkSoft, fontWeight: 400 }}> /100</span>
                  </div>
                  <div>
                    <span
                      className="px-3 py-1 text-sm font-bold inline-block"
                      style={{ background: band.bg, color: band.color, borderRadius: 999 }}
                    >
                      Band {band.band}
                    </span>
                    <div className="text-sm mt-1" style={{ color: C.ink }}>{band.note}</div>
                    {filled < 5 && (
                      <div className="text-xs mt-1" style={{ color: C.amber }}>
                        Provisional — {filled} of 5 factors set
                      </div>
                    )}
                  </div>
                </div>

                {recProducts && (
                  <div className="mt-4">
                    <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.inkSoft }}>
                      Lead with
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {recProducts.map((p) => (
                        <span
                          key={p}
                          className="px-2.5 py-1 text-xs font-semibold"
                          style={{ background: C.panelDeep, color: C.forestDark, borderRadius: 8 }}
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {angle && (
                  <div
                    className="mt-3 px-3 py-2 text-sm italic"
                    style={{ background: C.bg, borderLeft: `3px solid ${C.forest}`, borderRadius: "0 8px 8px 0", color: C.ink }}
                  >
                    “{angle}”
                  </div>
                )}

                <button
                  onClick={saveToPipeline}
                  className="mt-5 px-4 py-2 text-sm font-semibold w-full"
                  style={{ background: C.forestDark, color: "#F6F3E7", borderRadius: 10, border: "none", cursor: "pointer" }}
                >
                  Save / update in pipeline
                </button>
                {savedFlash && (
                  <div className="text-sm mt-2 text-center" style={{ color: C.forest }}>{savedFlash}</div>
                )}
              </div>
            </div>

            {/* RIGHT: research review */}
            <div>
              <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, minHeight: 300 }}>
                <div className="flex items-center justify-between gap-3">
                  <h2 style={{ ...serif, fontSize: 19, fontWeight: 600, color: C.forestDark }}>Research review</h2>
                  {research && (
                    <button
                      onClick={applyResearch}
                      className="px-3 py-1.5 text-sm font-semibold"
                      style={{
                        background: applied ? C.panelDeep : C.forest,
                        color: applied ? C.forestDark : "#F6F3E7",
                        borderRadius: 9,
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      {applied ? "Applied ✓ (apply again)" : "Apply research to form"}
                    </button>
                  )}
                </div>

                {loading && (
                  <div className="mt-6 text-sm" style={{ color: C.inkSoft }}>
                    Searching the web and structuring findings… this usually takes 20–60 seconds.
                  </div>
                )}

                {researchError && !loading && (
                  <div
                    className="mt-4 px-3 py-2 text-sm"
                    style={{ background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 10, color: C.amber }}
                  >
                    {researchError}
                  </div>
                )}

                {rawFallback && !loading && (
                  <div className="mt-4">
                    <div
                      className="px-3 py-2 text-sm font-semibold"
                      style={{ background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: "10px 10px 0 0", color: C.amber }}
                    >
                      Structured parse failed — raw research below
                    </div>
                    <pre
                      className="px-3 py-3 text-xs overflow-auto"
                      style={{
                        background: C.card, border: `1px solid ${C.amberBorder}`, borderTop: "none",
                        borderRadius: "0 0 10px 10px", maxHeight: 380, whiteSpace: "pre-wrap", color: C.ink,
                      }}
                    >
                      {rawFallback}
                    </pre>
                  </div>
                )}

                {!loading && !research && !rawFallback && !researchError && (
                  <div className="mt-6 text-sm" style={{ color: C.inkSoft }}>
                    Nothing researched yet. Run a lookup on the left — findings, suggested scores, contacts and sources will land here for your review. Or skip research entirely and score by hand.
                  </div>
                )}

                {research && !loading && (
                  <div className="mt-4 flex flex-col gap-4 text-sm">
                    <p style={{ color: C.ink, lineHeight: 1.55 }}>{research.company_summary || "No summary returned."}</p>

                    {/* suggested score — visible before Apply */}
                    <div
                      className="flex items-center gap-4 px-4 py-3"
                      style={{ background: C.card, border: `1px solid ${C.borderSoft}`, borderRadius: 12 }}
                    >
                      <div style={{ ...serif, fontSize: 34, fontWeight: 700, color: previewBand.color, lineHeight: 1 }}>
                        {previewScoreVal}
                        <span style={{ fontSize: 14, color: C.inkSoft, fontWeight: 400 }}> /100</span>
                      </div>
                      <div>
                        <span
                          className="px-2 py-0.5 text-xs font-bold"
                          style={{ background: previewBand.bg, color: previewBand.color, borderRadius: 999 }}
                        >
                          Band {previewBand.band}
                        </span>
                        <span className="text-xs ml-2" style={{ color: C.inkSoft }}>{previewBand.note}</span>
                        <div className="text-xs mt-0.5" style={{ color: previewFilled < 5 ? C.amber : C.inkSoft }}>
                          Suggested score if applied
                          {previewFilled < 5 ? ` — only ${previewFilled} of 5 factors mapped, set the rest by hand` : " — click Apply to load it into the form"}
                        </div>
                      </div>
                    </div>

                    {/* suggested classifications */}
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.inkSoft }}>
                        Suggested classification
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                        {[
                          ["Client type", labelOf(CLIENT_TYPES, research.client_type)],
                          ["Region", labelOf(REGIONS, research.region)],
                          ["Size", labelOf(SIZES, research.size_band)],
                          ["Trigger", labelOf(TRIGGERS, research.best_trigger)],
                          ["Custody", labelOf(CUSTODY, research.current_custody)],
                        ].map(([k, v]) => (
                          <div key={k} className="flex justify-between gap-2" style={{ borderBottom: `1px dotted ${C.border}`, paddingBottom: 3 }}>
                            <span style={{ color: C.inkSoft }}>{k}</span>
                            <span className="font-semibold text-right" style={{ color: v === "—" ? C.gray : C.forestDark }}>{v}</span>
                          </div>
                        ))}
                      </div>
                      {(research.size_evidence || research.custody_evidence) && (
                        <div className="mt-2 text-xs" style={{ color: C.inkSoft }}>
                          {research.size_evidence && <div>Size: {research.size_evidence}</div>}
                          {research.custody_evidence && <div>Custody: {research.custody_evidence}</div>}
                        </div>
                      )}
                    </div>

                    {/* signals */}
                    {research.trigger_events.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.inkSoft }}>
                          Signals
                        </div>
                        <ul className="flex flex-col gap-1.5">
                          {research.trigger_events.map((t, i) => (
                            <li key={i} className="px-3 py-2" style={{ background: C.card, borderRadius: 8, border: `1px solid ${C.borderSoft}` }}>
                              <span className="font-semibold" style={{ color: C.ink }}>{t.event}</span>
                              {t.when ? <span style={{ color: C.inkSoft }}> · {t.when}</span> : null}
                              {t.url ? (
                                <>
                                  {" "}
                                  <a href={t.url} target="_blank" rel="noopener" style={{ color: C.forest, textDecoration: "underline" }}>
                                    {t.source || "source"}
                                  </a>
                                </>
                              ) : t.source ? <span style={{ color: C.inkSoft }}> · {t.source}</span> : null}
                              {t.implication && (
                                <div
                                  className="text-xs mt-1 px-2 py-1"
                                  style={{ background: C.panelDeep, color: C.forestDark, borderRadius: 6 }}
                                >
                                  <span className="font-bold">Why it matters for HT:</span> {t.implication}
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* contacts */}
                    {rankedResearchContacts.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.inkSoft }}>
                          Contacts — ranked for this client type
                        </div>
                        <ul className="flex flex-col gap-1.5">
                          {rankedResearchContacts.map((p, i) => (
                            <li key={i} className="px-3 py-2 flex items-start gap-2" style={{ background: C.card, borderRadius: 8, border: `1px solid ${C.borderSoft}` }}>
                              <span
                                className="text-xs font-bold px-1.5 py-0.5 mt-0.5"
                                style={{ background: C.panelDeep, color: C.forestDark, borderRadius: 6 }}
                              >
                                {i + 1}
                              </span>
                              <span>
                                {p.url ? (
                                  <a href={p.url} target="_blank" rel="noopener" className="font-semibold" style={{ color: C.forest, textDecoration: "underline" }}>
                                    {p.name}
                                  </a>
                                ) : (
                                  <span className="font-semibold" style={{ color: C.ink }}>{p.name}</span>
                                )}
                                <span style={{ color: C.inkSoft }}> — {p.title}</span>
                                <span className="ml-1 text-xs px-1.5 py-0.5" style={{ background: C.bg, color: C.inkSoft, borderRadius: 6, border: `1px solid ${C.borderSoft}` }}>
                                  {p.persona}
                                </span>
                                {(p.email || p.phone) && (
                                  <div className="text-xs">
                                    {p.email && (
                                      <a href={`mailto:${p.email}`} style={{ color: C.forest, textDecoration: "underline" }}>{p.email}</a>
                                    )}
                                    {p.email && p.phone && <span style={{ color: C.inkSoft }}> · </span>}
                                    {p.phone && (
                                      <a href={`tel:${p.phone}`} style={{ color: C.forest, textDecoration: "underline" }}>{p.phone}</a>
                                    )}
                                  </div>
                                )}
                                {p.evidence && <div className="text-xs" style={{ color: C.inkSoft }}>{p.evidence}</div>}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {research.company_contact && (research.company_contact.email || research.company_contact.phone) && (
                      <div
                        className="text-xs px-3 py-2"
                        style={{ background: C.card, border: `1px solid ${C.borderSoft}`, borderRadius: 8, color: C.inkSoft }}
                      >
                        <span className="font-semibold" style={{ color: C.ink }}>Company general contact (fallback):</span>{" "}
                        {research.company_contact.email && (
                          <a href={`mailto:${research.company_contact.email}`} style={{ color: C.forest, textDecoration: "underline" }}>
                            {research.company_contact.email}
                          </a>
                        )}
                        {research.company_contact.email && research.company_contact.phone && " · "}
                        {research.company_contact.phone && (
                          <a href={`tel:${research.company_contact.phone}`} style={{ color: C.forest, textDecoration: "underline" }}>
                            {research.company_contact.phone}
                          </a>
                        )}
                      </div>
                    )}

                    {/* sources */}
                    {research.sources.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: C.inkSoft }}>
                          Sources
                        </div>
                        <ul className="text-xs flex flex-col gap-1">
                          {research.sources.map((s, i) => (
                            <li key={i}>
                              <a href={s.url} target="_blank" rel="noopener" style={{ color: C.forest, textDecoration: "underline" }}>
                                {s.title || s.url}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {research.caution && (
                      <div
                        className="px-3 py-2 text-sm"
                        style={{ background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 10, color: C.amber }}
                      >
                        ⚠ {research.caution}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ================= TAB 2: PIPELINE ================= */
          <div className="flex flex-col gap-6">
            {/* Today's desk */}
            <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 style={{ ...serif, fontSize: 19, fontWeight: 600, color: C.forestDark }}>Today’s desk</h2>
                <div className="flex items-center flex-wrap gap-2">
                  <button onClick={exportCsv} className="px-3 py-1.5 text-sm font-semibold" style={toolBtn}>
                    Export CSV
                  </button>
                  <button onClick={exportMarkdown} className="px-3 py-1.5 text-sm font-semibold" style={toolBtn}>
                    Export MD
                  </button>
                  <button
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    className="px-3 py-1.5 text-sm font-semibold"
                    style={toolBtn}
                  >
                    Import / Restore
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".md,.json,.txt"
                    style={{ display: "none" }}
                    onChange={onImportFile}
                  />
                  {fsSupported && vaultStatus === "off" && (
                    <button
                      onClick={connectVault}
                      className="px-3 py-1.5 text-sm font-semibold"
                      style={{ ...toolBtn, background: C.forest, color: "#F6F3E7", border: "none" }}
                    >
                      Connect Obsidian folder
                    </button>
                  )}
                  {fsSupported && vaultStatus === "resume" && (
                    <button
                      onClick={resumeVault}
                      className="px-3 py-1.5 text-sm font-semibold"
                      style={{ ...toolBtn, background: C.amberBg, border: `1px solid ${C.amberBorder}`, color: C.amber }}
                    >
                      Resume vault sync{vaultName ? ` (${vaultName})` : ""}
                    </button>
                  )}
                  {fsSupported && vaultStatus === "on" && (
                    <span
                      className="px-3 py-1.5 text-sm font-semibold"
                      style={{ background: C.panelDeep, borderRadius: 9, color: C.forestDark }}
                      title={`Auto-writing ${VAULT_DIR}/${VAULT_FILENAME} on every change`}
                    >
                      Vault sync ✓{vaultName ? ` ${vaultName}` : ""}
                    </span>
                  )}
                  {fsSupported && vaultStatus === "error" && (
                    <button
                      onClick={connectVault}
                      className="px-3 py-1.5 text-sm font-semibold"
                      style={{ ...toolBtn, background: C.redBg, border: `1px solid ${C.redBorder}`, color: C.red }}
                    >
                      Sync error — reconnect
                    </button>
                  )}
                </div>
              </div>
              {!fsSupported && (
                <p className="mt-2 text-xs" style={{ color: C.gray }}>
                  Auto vault sync needs Chrome or Edge on desktop — in this browser, use Export MD and save it into your Obsidian vault.
                </p>
              )}
              {importMsg && (
                <div className="mt-2 px-3 py-2 text-sm" style={{ background: C.panelDeep, borderRadius: 8, color: C.forestDark }}>
                  {importMsg}
                </div>
              )}
              {pendingImport && (
                <div
                  className="mt-2 px-3 py-2 text-sm flex items-center flex-wrap gap-2"
                  style={{ background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 8, color: C.amber }}
                >
                  <span>
                    Replace the current {records.length} record{records.length === 1 ? "" : "s"} with {pendingImport.length} from the file? Current data will be overwritten — Export MD first if unsure.
                  </span>
                  <button
                    onClick={confirmImport}
                    className="px-3 py-1 text-xs font-semibold"
                    style={{ background: C.forest, color: "#F6F3E7", borderRadius: 8, border: "none", cursor: "pointer" }}
                  >
                    Replace
                  </button>
                  <button
                    onClick={() => setPendingImport(null)}
                    className="px-3 py-1 text-xs"
                    style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.inkSoft, cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                </div>
              )}
              {desk.overdue.length + desk.dueToday.length + desk.next3.length === 0 ? (
                <p className="mt-3 text-sm" style={{ color: C.inkSoft }}>
                  Nothing due. Log touches on your prospects and reminders will surface here.
                </p>
              ) : (
                <div className="mt-3 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
                  {[
                    { title: "Overdue", items: desk.overdue, bg: C.redBg, border: C.redBorder, color: C.red },
                    { title: "Due today", items: desk.dueToday, bg: C.card, border: C.border, color: C.forestDark },
                    { title: "Next 3 days", items: desk.next3, bg: C.card, border: C.border, color: C.inkSoft },
                  ].map((g) => (
                    <div key={g.title} style={{ background: g.bg, border: `1px solid ${g.border}`, borderRadius: 12, padding: 12 }}>
                      <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: g.color }}>
                        {g.title} ({g.items.length})
                      </div>
                      {g.items.length === 0 ? (
                        <div className="text-xs" style={{ color: C.gray }}>—</div>
                      ) : (
                        <ul className="flex flex-col gap-1.5">
                          {g.items.map((r) => (
                            <li key={r.id}>
                              <button
                                onClick={() => jumpToRow(r.id)}
                                className="text-left w-full text-sm px-2 py-1"
                                style={{ background: "transparent", border: "none", borderRadius: 6, cursor: "pointer", color: C.ink }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(47,93,58,0.08)")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                              >
                                <span className="font-semibold">{r.company}</span>
                                <span style={{ color: C.inkSoft }}> — {r.dueInfo.action}</span>
                                <span className="text-xs" style={{ color: g.color }}> · {fmtDate(r.dueInfo.due)}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Assistant */}
            <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16 }}>
              <button
                onClick={() => setChatOpen((o) => !o)}
                className="w-full flex items-center justify-between px-5 py-4"
                style={{ background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
              >
                <span style={{ ...serif, fontSize: 19, fontWeight: 600, color: C.forestDark }}>Assistant</span>
                <span className="text-sm" style={{ color: C.inkSoft }}>
                  {chatMessages.length
                    ? `${chatMessages.length} message${chatMessages.length === 1 ? "" : "s"}`
                    : "drafts & pipeline questions"}{" "}
                  {chatOpen ? "▾" : "▸"}
                </span>
              </button>

              {chatOpen && (
                <div className="px-5 pb-5 flex flex-col gap-3">
                  {/* controls */}
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={chatProvider}
                      onChange={(e) => {
                        const p = e.target.value;
                        setChatProvider(p);
                        setChatModel((MODEL_SETS[p] && MODEL_SETS[p][0].id) || "");
                      }}
                      className="px-2 py-1.5 text-xs"
                      style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 9, color: C.ink, maxWidth: 230 }}
                    >
                      {PROVIDERS.map((p) => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                    <select
                      value={chatModel}
                      onChange={(e) => setChatModel(e.target.value)}
                      className="px-2 py-1.5 text-xs"
                      style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 9, color: C.ink, maxWidth: 230 }}
                    >
                      {(MODEL_SETS[chatProvider] || []).map((m) => (
                        <option key={m.id} value={m.id}>{m.label}</option>
                      ))}
                    </select>
                    <label
                      className="flex items-center gap-1.5 px-2 py-1.5 text-xs"
                      style={{
                        background: C.card,
                        border: `1px solid ${C.border}`,
                        borderRadius: 9,
                        color: chatProvider === "deepseek" ? C.gray : C.ink,
                        cursor: chatProvider === "deepseek" ? "not-allowed" : "pointer",
                      }}
                      title={chatProvider === "deepseek" ? "DeepSeek has no web search" : "Let the model search the web for this reply"}
                    >
                      <input
                        type="checkbox"
                        checked={chatProvider === "deepseek" ? false : chatSearch}
                        disabled={chatProvider === "deepseek"}
                        onChange={(e) => setChatSearch(e.target.checked)}
                      />
                      Web search
                    </label>
                    <select
                      value={chatFilter}
                      onChange={(e) => setChatFilter(e.target.value)}
                      className="px-2 py-1.5 text-xs"
                      style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 9, color: C.ink, maxWidth: 180 }}
                      title="Show only messages sent with this company in context"
                    >
                      <option value="all">All history</option>
                      {records.map((r) => (
                        <option key={r.id} value={r.id}>{r.company}</option>
                      ))}
                    </select>
                    {chatMessages.length > 0 && (
                      <button
                        onClick={() => setChatMessages([])}
                        className="px-2.5 py-1.5 text-xs font-semibold"
                        style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 9, color: C.inkSoft, cursor: "pointer" }}
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* context scope */}
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.inkSoft }}>
                      Context — pick companies to send their full detail
                    </div>
                    {records.length === 0 ? (
                      <p className="text-xs" style={{ color: C.gray }}>
                        Pipeline is empty — save a company in the first tab and it will show up here.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {records.map((r) => {
                          const on = chatScope.includes(r.id);
                          return (
                            <button
                              key={r.id}
                              onClick={() =>
                                setChatScope((prev) => (on ? prev.filter((x) => x !== r.id) : [...prev, r.id]))
                              }
                              className="px-2.5 py-1 text-xs font-semibold"
                              style={{
                                background: on ? C.forest : C.card,
                                color: on ? "#F6F3E7" : C.inkSoft,
                                border: `1px solid ${on ? C.forest : C.border}`,
                                borderRadius: 999,
                                cursor: "pointer",
                              }}
                            >
                              {r.company}{on ? " ✓" : ""}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* history */}
                  {visibleChat.length === 0 && !chatLoading ? (
                    <p className="text-sm" style={{ color: C.inkSoft }}>
                      {chatFilter === "all"
                        ? "No messages yet — ask for a first-line draft, next steps, or who to prioritise today."
                        : "No messages for this company yet."}
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2 overflow-y-auto pr-1" style={{ maxHeight: 400 }}>
                      {visibleChat.map((m) =>
                        m.role === "user" ? (
                          <div
                            key={m.id}
                            className="self-end px-3 py-2 text-sm"
                            style={{
                              background: C.forest,
                              color: "#F6F3E7",
                              borderRadius: "12px 12px 2px 12px",
                              maxWidth: "85%",
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {m.content}
                          </div>
                        ) : (
                          <div
                            key={m.id}
                            className="self-start px-3 py-2 text-sm"
                            style={{
                              background: m.error ? C.redBg : C.card,
                              border: `1px solid ${m.error ? C.redBorder : C.borderSoft}`,
                              color: m.error ? C.red : C.ink,
                              borderRadius: "12px 12px 12px 2px",
                              maxWidth: "92%",
                            }}
                          >
                            <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
                            {(m.actions || []).length > 0 && (
                              <div className="mt-2 flex flex-col gap-1.5">
                                {m.actions.map((a, i) => (
                                  <div
                                    key={i}
                                    className="px-2.5 py-2 text-xs"
                                    style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8 }}
                                  >
                                    <div style={{ color: C.ink }}>{describeChatAction(a)}</div>
                                    <div className="mt-1.5 flex items-center gap-2">
                                      {!a.state || a.state === "pending" ? (
                                        <>
                                          <button
                                            onClick={() => resolveChatAction(m.id, i, true)}
                                            className="px-2.5 py-1 text-xs font-semibold"
                                            style={{ background: C.forest, color: "#F6F3E7", borderRadius: 7, border: "none", cursor: "pointer" }}
                                          >
                                            Apply
                                          </button>
                                          <button
                                            onClick={() => resolveChatAction(m.id, i, false)}
                                            className="px-2.5 py-1 text-xs"
                                            style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 7, color: C.inkSoft, cursor: "pointer" }}
                                          >
                                            Dismiss
                                          </button>
                                        </>
                                      ) : a.state === "applied" ? (
                                        <span className="font-semibold" style={{ color: C.forest }}>Applied ✓</span>
                                      ) : a.state === "dismissed" ? (
                                        <span style={{ color: C.gray }}>Dismissed</span>
                                      ) : (
                                        <span style={{ color: C.red }}>Failed — {a.failReason || "couldn't apply"}</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            {!m.error && (
                              <div className="mt-1.5 flex justify-end">
                                <button
                                  onClick={() => copyChat(m)}
                                  className="px-2 py-0.5 text-xs"
                                  style={{
                                    background: "transparent",
                                    border: `1px solid ${C.borderSoft}`,
                                    borderRadius: 6,
                                    color: copiedId === m.id ? C.forest : C.gray,
                                    cursor: "pointer",
                                  }}
                                >
                                  {copiedId === m.id ? "Copied ✓" : "Copy"}
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      )}
                      {chatLoading && (
                        <div className="text-sm italic px-1" style={{ color: C.inkSoft }}>Thinking…</div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  )}

                  {/* input */}
                  <div className="flex gap-2">
                    <input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          sendChat();
                        }
                      }}
                      placeholder="Ask for a draft, next steps, prioritisation…"
                      className="flex-1 px-3 py-2 text-sm"
                      style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, color: C.ink }}
                    />
                    <button
                      onClick={sendChat}
                      disabled={chatLoading || !chatInput.trim()}
                      className="px-4 py-2 text-sm font-semibold"
                      style={{
                        background: C.forest,
                        color: "#F6F3E7",
                        borderRadius: 10,
                        border: "none",
                        cursor: chatLoading ? "wait" : "pointer",
                        opacity: chatLoading || !chatInput.trim() ? 0.6 : 1,
                      }}
                    >
                      Send
                    </button>
                  </div>
                  <p className="text-xs" style={{ color: C.gray }}>
                    Each message sends the pipeline overview plus full detail for the picked companies. Replies are drafts — a human always sends. History auto-deletes after 15 days.
                  </p>
                </div>
              )}
            </div>

            {/* table */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
              {records.length === 0 ? (
                <div className="p-8 text-center text-sm" style={{ color: C.inkSoft }}>
                  Pipeline is empty. Research and score a company in the first tab, then “Save / update in pipeline”.
                </div>
              ) : (
                <>
                <div className="flex items-center flex-wrap gap-2 px-4 py-3" style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
                  <input
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    placeholder="Filter — company, notes, status, contact…"
                    className="px-3 py-1.5 text-sm"
                    style={{
                      background: C.bg,
                      border: `1px solid ${C.border}`,
                      borderRadius: 9,
                      color: C.ink,
                      flex: "1 1 220px",
                      maxWidth: 380,
                    }}
                  />
                  {filterText.trim() && (
                    <>
                      <span className="text-xs font-semibold" style={{ color: C.inkSoft }}>
                        {filteredRows.length}/{records.length} shown
                      </span>
                      <button
                        onClick={() => setFilterText("")}
                        className="px-2 py-1 text-xs"
                        style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 7, color: C.inkSoft, cursor: "pointer" }}
                      >
                        Clear
                      </button>
                    </>
                  )}
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table className="w-full text-sm" style={{ borderCollapse: "collapse", minWidth: 900 }}>
                    <thead>
                      <tr style={{ background: C.panelDeep }}>
                        {[
                          { k: null, l: "Company" },
                          { k: "score", l: "Score" },
                          { k: null, l: "Band" },
                          { k: null, l: "Status" },
                          { k: null, l: "Client type" },
                          { k: null, l: "Touches" },
                          { k: null, l: "Last touch" },
                          { k: "nextDue", l: "Next due" },
                          { k: null, l: "Next action" },
                          { k: null, l: "" },
                        ].map((h, i) => (
                          <th
                            key={i}
                            className="text-left px-3 py-2.5 text-xs font-bold uppercase tracking-wide whitespace-nowrap"
                            style={{ color: C.forestDark, cursor: h.k ? "pointer" : "default", userSelect: "none" }}
                            onClick={h.k ? () => toggleSort(h.k) : undefined}
                          >
                            {h.l}
                            {h.k && sortKey === h.k ? (sortDir === "asc" ? " ↑" : " ↓") : h.k ? " ↕" : ""}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.length === 0 ? (
                        <tr style={{ borderTop: `1px solid ${C.borderSoft}` }}>
                          <td colSpan={10} className="px-4 py-6 text-center text-sm" style={{ color: C.inkSoft }}>
                            No prospects match “{filterText.trim()}” — clear the filter to see all {records.length}.
                          </td>
                        </tr>
                      ) : (
                      filteredRows.map((r) => {
                        const b = bandOf(r.score);
                        const d = r.dueInfo;
                        const overdue = d && d.due && daysBetween(todayStr(), d.due) < 0;
                        const open = expandedId === r.id;
                        return (
                          <React.Fragment key={r.id}>
                            <tr
                              ref={(el) => (rowRefs.current[r.id] = el)}
                              onClick={() => setExpandedId(open ? null : r.id)}
                              style={{
                                borderTop: `1px solid ${C.borderSoft}`,
                                background: open ? C.panel : overdue ? C.redBg : "transparent",
                                cursor: "pointer",
                              }}
                            >
                              <td className="px-3 py-2.5 font-semibold" style={{ color: C.forestDark }}>{r.company}</td>
                              <td className="px-3 py-2.5" style={{ ...serif, fontWeight: 700, color: b.color }}>{r.score}</td>
                              <td className="px-3 py-2.5">
                                <span className="px-2 py-0.5 text-xs font-bold" style={{ background: b.bg, color: b.color, borderRadius: 999 }}>
                                  {b.band}
                                </span>
                              </td>
                              <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                                <select
                                  value={r.status}
                                  onChange={(e) => updateRecord(r.id, { status: e.target.value })}
                                  className="px-2 py-1 text-xs"
                                  style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.ink }}
                                >
                                  {STATUSES.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: C.inkSoft }}>
                                {labelOf(CLIENT_TYPES, r.form.clientType)}
                              </td>
                              <td className="px-3 py-2.5" style={{ color: C.ink }}>{(r.touches || []).length}</td>
                              <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: C.inkSoft }}>{fmtDate(r.lastTouch)}</td>
                              <td className="px-3 py-2.5 whitespace-nowrap font-semibold" style={{ color: overdue ? C.red : d && d.due ? C.forestDark : C.gray }}>
                                {d && d.due ? fmtDate(d.due) : "—"}
                              </td>
                              <td className="px-3 py-2.5 text-xs" style={{ color: C.inkSoft, maxWidth: 190 }}>
                                {d
                                  ? d.start
                                    ? "Log Touch 1 to start cadence"
                                    : d.suggestNurture
                                      ? "Cadence complete — move to Nurture?"
                                      : d.action
                                  : "No reminders"}
                              </td>
                              <td className="px-3 py-2.5 text-center" style={{ color: C.inkSoft }}>{open ? "▾" : "▸"}</td>
                            </tr>

                            {open && (
                              <tr style={{ background: C.panel }}>
                                <td colSpan={10} className="px-5 py-4" style={{ borderTop: `1px solid ${C.border}` }}>
                                  {/* meeting brief generator */}
                                  <div className="flex items-center flex-wrap gap-2 mb-3">
                                    <button
                                      onClick={() => generateBrief(r)}
                                      disabled={briefState && briefState.status === "loading"}
                                      className="px-3 py-1.5 text-sm font-semibold"
                                      style={{
                                        background: C.forest,
                                        color: "#F6F3E7",
                                        borderRadius: 9,
                                        border: "none",
                                        cursor: briefState && briefState.status === "loading" ? "wait" : "pointer",
                                        opacity: briefState && briefState.status === "loading" ? 0.7 : 1,
                                      }}
                                    >
                                      {briefState && briefState.id === r.id && briefState.status === "loading"
                                        ? "Generating brief…"
                                        : "Generate meeting brief"}
                                    </button>
                                    <span className="text-xs" style={{ color: C.gray }}>
                                      Uses the Assistant's provider, model and web-search setting · draft only
                                    </span>
                                    {briefSaveMsg && briefSaveMsg.id === r.id && (
                                      <span className="text-xs font-semibold" style={{ color: C.forest }}>{briefSaveMsg.msg}</span>
                                    )}
                                  </div>
                                  {briefState && briefState.id === r.id && briefState.status === "error" && (
                                    <div
                                      className="mb-3 px-3 py-2 text-sm"
                                      style={{ background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 10, color: C.red }}
                                    >
                                      {briefState.msg}
                                    </div>
                                  )}
                                  {briefState && briefState.id === r.id && briefState.status === "done" && (
                                    <div className="mb-4" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
                                      <div
                                        className="flex items-center justify-between gap-2 px-3 py-2"
                                        style={{ borderBottom: `1px solid ${C.borderSoft}`, background: C.panelDeep }}
                                      >
                                        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: C.forestDark }}>
                                          Meeting brief — draft
                                        </span>
                                        <span className="flex gap-2">
                                          <button
                                            onClick={() => copyChat({ id: `brief:${r.id}`, content: briefState.text })}
                                            className="px-2.5 py-1 text-xs font-semibold"
                                            style={{
                                              background: C.card,
                                              border: `1px solid ${C.border}`,
                                              borderRadius: 7,
                                              color: copiedId === `brief:${r.id}` ? C.forest : C.inkSoft,
                                              cursor: "pointer",
                                            }}
                                          >
                                            {copiedId === `brief:${r.id}` ? "Copied ✓" : "Copy"}
                                          </button>
                                          <button
                                            onClick={() => saveBrief(r)}
                                            className="px-2.5 py-1 text-xs font-semibold"
                                            style={{ background: C.forest, color: "#F6F3E7", borderRadius: 7, border: "none", cursor: "pointer" }}
                                          >
                                            {vaultStatus === "on" ? "Save to vault (03-Briefs)" : "Download .md"}
                                          </button>
                                        </span>
                                      </div>
                                      <pre
                                        className="px-3 py-3 text-sm overflow-auto"
                                        style={{ ...sans, whiteSpace: "pre-wrap", maxHeight: 320, color: C.ink, margin: 0 }}
                                      >
                                        {briefState.text}
                                      </pre>
                                    </div>
                                  )}
                                  <div className="grid gap-5" style={{ gridTemplateColumns: "minmax(260px, 1fr) minmax(260px, 1fr)" }}>
                                    {/* left: summary + contacts + signals */}
                                    <div className="flex flex-col gap-3 text-sm">
                                      {r.summary ? (
                                        <p style={{ color: C.ink, lineHeight: 1.5 }}>{r.summary}</p>
                                      ) : (
                                        <p style={{ color: C.gray }}>No research summary saved for this prospect.</p>
                                      )}
                                      {r.caution && (
                                        <div className="px-3 py-1.5 text-xs" style={{ background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 8, color: C.amber }}>
                                          ⚠ {r.caution}
                                        </div>
                                      )}
                                      {(r.contacts || []).length > 0 && (
                                        <div>
                                          <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: C.inkSoft }}>Contacts</div>
                                          <ul className="flex flex-col gap-1">
                                            {r.contacts.map((p, i) => (
                                              <li key={i} className="text-sm">
                                                {p.url ? (
                                                  <a href={p.url} target="_blank" rel="noopener" className="font-semibold" style={{ color: C.forest, textDecoration: "underline" }}>{p.name}</a>
                                                ) : (
                                                  <span className="font-semibold" style={{ color: C.ink }}>{p.name}</span>
                                                )}
                                                <span style={{ color: C.inkSoft }}> — {p.title} ({p.persona})</span>
                                                {(p.email || p.phone) && (
                                                  <div className="text-xs">
                                                    {p.email && (
                                                      <a href={`mailto:${p.email}`} style={{ color: C.forest, textDecoration: "underline" }}>{p.email}</a>
                                                    )}
                                                    {p.email && p.phone && <span style={{ color: C.inkSoft }}> · </span>}
                                                    {p.phone && <span style={{ color: C.ink }}>{p.phone}</span>}
                                                  </div>
                                                )}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                      <div>
                                        <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: C.inkSoft }}>
                                          Persona coverage
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                          {PERSONAS.map((p) => {
                                            const has = (r.contacts || []).some((c) => c && c.persona === p);
                                            return (
                                              <span
                                                key={p}
                                                className="px-2 py-0.5 text-xs font-semibold"
                                                title={has ? `At least one ${p} contact saved` : `No ${p} contact yet`}
                                                style={{
                                                  background: has ? "#DCEAD9" : "transparent",
                                                  color: has ? C.forest : C.gray,
                                                  border: `1px solid ${has ? C.midGreen : C.border}`,
                                                  borderRadius: 999,
                                                }}
                                              >
                                                {p}{has ? " ✓" : ""}
                                              </span>
                                            );
                                          })}
                                        </div>
                                      </div>
                                      <div>
                                        <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: C.inkSoft }}>
                                          Qualification (MEDDPICC)
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                          {MEDDPICC_ITEMS.map(({ key, label }) => {
                                            const v = (r.meddpicc || {})[key] || "";
                                            const next = v === "" ? "partial" : v === "partial" ? "confirmed" : "";
                                            return (
                                              <button
                                                key={key}
                                                onClick={() => updateRecord(r.id, { meddpicc: { ...(r.meddpicc || {}), [key]: next } })}
                                                className="px-2 py-0.5 text-xs font-semibold"
                                                title={`${label}: ${v || "unknown"} — click to cycle unknown → partial → confirmed`}
                                                style={{
                                                  background: v === "confirmed" ? "#DCEAD9" : v === "partial" ? C.amberBg : "transparent",
                                                  color: v === "confirmed" ? C.forest : v === "partial" ? C.amber : C.gray,
                                                  border: `1px solid ${v === "confirmed" ? C.midGreen : v === "partial" ? C.amberBorder : C.border}`,
                                                  borderRadius: 999,
                                                  cursor: "pointer",
                                                }}
                                              >
                                                {label}{v === "confirmed" ? " ✓" : v === "partial" ? " ~" : ""}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                      {r.companyContact && (r.companyContact.email || r.companyContact.phone) && (
                                        <div className="text-xs" style={{ color: C.inkSoft }}>
                                          <span className="font-semibold" style={{ color: C.ink }}>Company general:</span>{" "}
                                          {r.companyContact.email && (
                                            <a href={`mailto:${r.companyContact.email}`} style={{ color: C.forest, textDecoration: "underline" }}>
                                              {r.companyContact.email}
                                            </a>
                                          )}
                                          {r.companyContact.email && r.companyContact.phone && " · "}
                                          {r.companyContact.phone || ""}
                                        </div>
                                      )}
                                      {(r.signals || []).length > 0 && (
                                        <div>
                                          <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: C.inkSoft }}>Signals</div>
                                          <ul className="flex flex-col gap-1">
                                            {r.signals.map((t, i) => (
                                              <li key={i} className="text-sm" style={{ color: C.ink }}>
                                                {t.event}
                                                {t.when ? <span style={{ color: C.inkSoft }}> · {t.when}</span> : null}
                                                {t.url && (
                                                  <>
                                                    {" "}
                                                    <a href={t.url} target="_blank" rel="noopener" style={{ color: C.forest, textDecoration: "underline" }}>
                                                      {t.source || "source"}
                                                    </a>
                                                  </>
                                                )}
                                                {t.implication && (
                                                  <div className="text-xs italic" style={{ color: C.forest }}>
                                                    ↳ {t.implication}
                                                  </div>
                                                )}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                      {(r.sources || []).length > 0 && (
                                        <div className="text-xs">
                                          <span style={{ color: C.inkSoft }}>Sources: </span>
                                          {r.sources.map((s, i) => (
                                            <span key={i}>
                                              {i > 0 && " · "}
                                              <a href={s.url} target="_blank" rel="noopener" style={{ color: C.forest, textDecoration: "underline" }}>
                                                {s.title || s.url}
                                              </a>
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>

                                    {/* right: touches + notes */}
                                    <div className="flex flex-col gap-3 text-sm">
                                      <div>
                                        <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: C.inkSoft }}>Touch history</div>
                                        {(r.touches || []).length === 0 ? (
                                          <div style={{ color: C.gray }}>No touches yet — log Touch 1 to start the cadence.</div>
                                        ) : (
                                          <ul className="flex flex-col gap-1">
                                            {r.touches.map((t, i) => (
                                              <li key={i} className="flex gap-2 items-baseline">
                                                <span className="text-xs font-bold px-1.5 py-0.5" style={{ background: C.panelDeep, color: C.forestDark, borderRadius: 6 }}>
                                                  T{t.n}
                                                </span>
                                                <span style={{ color: C.ink }}>
                                                  {t.channel} · {fmtDate(t.date)}
                                                  {t.note && <span style={{ color: C.inkSoft }}> — {t.note}</span>}
                                                </span>
                                              </li>
                                            ))}
                                          </ul>
                                        )}
                                      </div>

                                      {/* log touch */}
                                      <div className="flex flex-wrap gap-2 items-center px-3 py-2.5" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10 }}>
                                        <select
                                          value={logChannel}
                                          onChange={(e) => setLogChannel(e.target.value)}
                                          className="px-2 py-1 text-xs"
                                          style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.ink }}
                                        >
                                          {CHANNELS.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                          ))}
                                        </select>
                                        <input
                                          type="date"
                                          value={logDate}
                                          onChange={(e) => setLogDate(e.target.value)}
                                          className="px-2 py-1 text-xs"
                                          style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.ink }}
                                        />
                                        <input
                                          value={logNote}
                                          onChange={(e) => setLogNote(e.target.value)}
                                          placeholder="note (optional)"
                                          className="px-2 py-1 text-xs flex-1"
                                          style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.ink, minWidth: 120 }}
                                        />
                                        <button
                                          onClick={() => logTouch(r)}
                                          className="px-3 py-1 text-xs font-semibold"
                                          style={{ background: C.forest, color: "#F6F3E7", borderRadius: 8, border: "none", cursor: "pointer" }}
                                        >
                                          Log touch {(r.touches || []).length + 1}
                                        </button>
                                      </div>

                                      <div>
                                        <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: C.inkSoft }}>Notes</div>
                                        <textarea
                                          value={r.notes || ""}
                                          onChange={(e) => updateRecord(r.id, { notes: e.target.value })}
                                          rows={3}
                                          placeholder="Working notes for this prospect…"
                                          className="w-full px-3 py-2 text-sm"
                                          style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, color: C.ink, resize: "vertical" }}
                                        />
                                      </div>

                                      <div className="flex justify-end">
                                        {confirmDelete === r.id ? (
                                          <span className="flex gap-2 items-center">
                                            <span className="text-xs" style={{ color: C.red }}>Delete “{r.company}” for good?</span>
                                            <button
                                              onClick={() => deleteRecord(r.id)}
                                              className="px-3 py-1 text-xs font-semibold"
                                              style={{ background: C.red, color: "#FBF2EC", borderRadius: 8, border: "none", cursor: "pointer" }}
                                            >
                                              Confirm delete
                                            </button>
                                            <button
                                              onClick={() => setConfirmDelete(null)}
                                              className="px-3 py-1 text-xs"
                                              style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.inkSoft, cursor: "pointer" }}
                                            >
                                              Keep
                                            </button>
                                          </span>
                                        ) : (
                                          <button
                                            onClick={() => setConfirmDelete(r.id)}
                                            className="px-3 py-1 text-xs"
                                            style={{ background: "transparent", border: `1px solid ${C.redBorder}`, borderRadius: 8, color: C.red, cursor: "pointer" }}
                                          >
                                            Delete prospect
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                      )}
                    </tbody>
                  </table>
                </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* footer */}
        <div className="mt-8 pb-6 text-center text-xs" style={{ color: C.gray }}>
          Draft-only tooling — a human always sends. Verify names, roles and links before outreach.
        </div>
      </div>
    </div>
  );
}
