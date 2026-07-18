# Prospect Radar → Claude Code 交接文档（Handoff）

> 用途：把这个对话里构建的一切完整交接给 Claude Code 继续开发——不丢上下文、不丢功能、不重来。本文件已同时打包进项目根目录（`HANDOFF.md`），Claude Code 打开项目就能读到；配套的 `CLAUDE.md`（项目规范，Claude Code 自动读取）和 `DESIGN.md`（系统蓝图）也在包里。

---

## 一、核心上下文摘要（Claude Code 开工前必读）

**产品是什么**：Prospect Radar——Hex Trust（受监管数字资产托管机构，持牌于香港/新加坡/迪拜）SDR 的个人工作台。三大块：① AI 公司研究（联网搜索 + 结构化 JSON 输出）+ 5 因子打分（/100，Band A–D）；② Pipeline 迷你 CRM（触达节奏引擎 cadence、Today's desk、CSV/MD 导出）；③ Obsidian 单向镜像（含完整 JSON 备份块 + Import/Restore 还原闭环）。

**技术栈与部署**：Vite + React 18，单文件组件 `src/ProspectRadar.jsx`（约 1600 行，含全部 UI 和逻辑）；Tailwind v4 核心类 + 内联样式色板（奶油/鼠尾草/森林绿，Fraunces 衬线标题 + Source Sans 3 正文）；持久化经 `src/storage-shim.js`（localStorage 模拟 artifact 的 window.storage）；后端为两个 Cloudflare Pages Functions：`functions/api/research.js`（研究）和 `functions/api/chat.js`（助理，刚建好、前端还没接）。部署目标 Cloudflare Pages，密钥只放 Cloudflare Secrets / 本地 `.dev.vars`。

**AI 供应商**：Gemini（默认，Google Search grounding 联网）、DeepSeek v4（最便宜、**无联网**，提示词强制"宁缺勿假"；模型名必须用 `deepseek-v4-flash` / `deepseek-v4-pro`，旧名 2026-07-24 弃用）、Claude（可选，用户暂无密钥）。

**已定的关键决策（不要推翻）**：研究结果绝不自动填表（审阅后点 Apply）；重复保存按公司名合并（保留触达和笔记）；cadence 用自然日；联系人邮箱/电话**绝不猜测**（只收录公开发布的，空即未知）+ 公司总机兜底；AI 对数据的任何改动 = **提议 + 用户点 Apply**，绝不自动执行；聊天记录按公司标记、15 天自动清理；上下文由用户手动勾选公司（总览表始终附带）；数据所有权铁律——localStorage 是唯一真源，应用写的库文件是单向镜像，人写的文件应用只读。

**用户画像**：开发新手，macOS + Chrome，依赖 AI 完成改动，需要每步验证（`npm run build` 必须通过）和简明解释。Obsidian 库在 `/Users/aidenlin/Documents/Sales OS`。

**未完成 / 遗留问题**：
1. **Assistant 前端未建**（后端 `chat.js` 已就绪）——这是 Prompt 1 的任务。
2. **P2 功能未建**（MEDDPICC 清单、persona 覆盖度、会议简报生成器、方法论内嵌）——Prompt 2 的任务。
3. 库路径不一致：应用现在把镜像写到所连文件夹根部的 `prospect-radar-pipeline.md`，而库文档约定是 `_ProspectRadar/pipeline.md` —— Prompt 1 中修正。
4. 用户侧环境残留问题：本地 `.dev.vars` 曾有文件名尾随空格（已教修复，未确认完成）；Gemini 密钥曾复制错对象（`AQ.` 开头的不是 API key，需 `AIza` 开头的重新生成）；git 首次 push 未完成；Cloudflare 线上部署未完成。
5. 合规提醒：未来接公司 Calendar/Teams/CRM 前必须先获公司 IT/经理许可（用户即将入职受监管机构）。

---

## 二、需要下载并交给 Claude Code 的文件清单

| 文件（本对话可下载） | 是什么 | 为什么需要 |
|---|---|---|
| **prospect-radar-ready.zip** | 完整项目（最新代码 + CLAUDE.md + HANDOFF.md + DESIGN.md） | **唯一必传项**。解压后就是 Claude Code 的工作目录，全部上下文都在包内三个 md 里 |
| obsidian-vault-starter.zip | Obsidian 库起步包（26 个文件：新手指南、5 套方法论 playbook、3 个模板、文件夹说明） | 解压其**内容**到 `/Users/aidenlin/Documents/Sales OS`（见第三节），是工具的"第二大脑" |
| 部署指南-deploy-guide.md | 面向用户本人的部署手册（中文） | 用户自己留着照做，Claude Code 不需要 |
| integrated-sales-system-design.md | 系统蓝图 | 已复制进项目为 `DESIGN.md`，无需单独上传 |

不需要的：聊天里的截图、旧版单文件（zip 里已是最新）、CSV 样例（还没有真实数据）。

**给 Claude Code 的启动方式**：解压 zip → 终端 `cd prospect-radar` → `npm install` → 运行 `claude` → 第一句话发 Prompt 1（见第五节）。

---

## 三、Obsidian 结构（应用于 `/Users/aidenlin/Documents/Sales OS`）

把 obsidian-vault-starter.zip 里 `vault/` 文件夹的**内容**（不是 vault 文件夹本身）拷入 `Sales OS`，得到：

```
/Users/aidenlin/Documents/Sales OS/
├── START-HERE.md            ← 新手指南，先读
├── 00-Inbox/                ← 未分类随手记（人写）
├── 01-Prospects/            ← 每家公司一篇：你的判断、情报、干系人地图（人写）
├── 02-Transcripts/          ← 会议转录，命名 <公司slug>-YYYY-MM-DD.md（人放入）
├── 03-Briefs/               ← 会议简报 ⚠️ 应用自动写入，别手改
├── 04-Metrics/              ← metrics.md + 周复盘 YYYY-Wnn.md（人写）
├── 05-Playbook/             ← 方法论手册（MEDDPICC/SPIN/Challenger/多线/MAP/异议）——AI 生成话术时的知识底座
├── 06-Templates/            ← prospect-note / meeting-note / weekly-review 三个模板
├── 99-Archive/              ← 关闭的线索归档
└── _ProspectRadar/          ← ⚠️ 应用自动创建并独占写入
    └── pipeline.md          ← 全量镜像 + 底部 JSON 备份块（可 Import/Restore 还原）
```

**命名约定**：公司 slug 用小写连字符（`meridian-labs`）；带日期的文件一律 `<slug>-YYYY-MM-DD.md`；周复盘 `2026-W30.md`。**frontmatter 约定**：每个文件头部 `company:` / `date:` / `type:`（prospect | meeting | brief | review | playbook | guide），这是人和 AI 检索的统一钩子。

**三类数据如何"分离但互链"**：研究输入（transcripts、prospects、metrics——人拥有）↔ 工具配置与规范（项目仓库里的 CLAUDE.md/DESIGN.md——不进库）↔ 输出日志（pipeline.md、briefs——应用拥有）。互链靠 `[[双向链接]]`：在 `01-Prospects/meridian-labs.md` 里写 `[[pipeline]]`、在任何笔记提 `[[meridian-labs]]`，Obsidian 的 Backlinks 面板自动把同一家公司的所有材料串起来。

---

## 四、自动同步机制（工具 → 库）

**机制选型：File System Access API（浏览器文件夹句柄），不用 webhook / 文件监听 / 服务器。** 理由：应用是无状态静态站，真源在浏览器 localStorage；库就在同一台电脑上——浏览器直写文件是最短路径，零基础设施、零凭证、离线可用。webhook 需要常驻服务端接收方，file watcher 需要本机常驻进程，对个人工具都是过度设计。

| 同步内容 | 目标文件 | 触发 | 方向 |
|---|---|---|---|
| Pipeline 全量（总览表 + 每公司档案 + JSON 备份块） | `_ProspectRadar/pipeline.md` | 任何数据变动后 ~0.8 秒防抖自动写 | 应用 → 库（单向覆盖） |
| 会议简报 | `03-Briefs/<slug>-<日期>.md` | 用户点 Generate Brief 后点 Save | 应用 → 库（新增文件） |
| 转录 / 指标 / 人写笔记 | 02/04/01 各文件夹 | 人工放入 | 库 → AI 只读（应用经同一句柄读取；全库级检索交给 Claude Code） |

**可靠性设计（已实现）**：首次在 Pipeline 页点 Connect Obsidian folder 选中 `Sales OS`；句柄存入 IndexedDB，浏览器整重启后一键 Resume 恢复授权（Chrome 安全要求）；写失败降级为界面警告 + 手动 Export MD 兜底；数据丢失时 Import/Restore 读 pipeline.md 底部备份块整体还原。**已知限制**：仅 Chrome/Edge 桌面版；单向同步——人在库里改 pipeline.md 会被下次覆盖。可选加固：给 `Sales OS` 跑 `git init`，让 Claude Code 定期 commit，获得全库版本历史。

---

## 五、Claude Code 执行计划（两个 Prompt，逐个发送）

分两步的原则：Prompt 1 打通"助理聊天"主干（后端已就绪，纯前端接入），Prompt 2 在其上叠加销售方法论功能。每步都以 `npm run build` 通过为完成标准，互不依赖等待你确认后再发第二条。

---

### 📋 PROMPT 1（复制以下全文发给 Claude Code）

```text
Read CLAUDE.md, HANDOFF.md and DESIGN.md first. Then implement Task 1 below in
src/ProspectRadar.jsx only. The backend functions/api/chat.js already exists and
works — do NOT modify it or functions/api/research.js.

TASK 1 — Assistant chat panel + table filter + vault path fix

A) Vault path fix (small): the vault auto-write currently writes
"prospect-radar-pipeline.md" at the connected folder root (see writeVaultNow and
the auto-write useEffect). Change both places to write into a "_ProspectRadar"
subdirectory (getDirectoryHandle("_ProspectRadar", { create: true })) with
filename "pipeline.md". Keep the manual "Export MD" download filename unchanged.

B) Table filter: add a text input above the pipeline table that live-filters
rows (case-insensitive substring match over company, notes, summary, status,
client-type label, and contact names/titles). Show "X/Y shown" when active, and
an empty-state row when nothing matches. Sorting must still apply.

C) Assistant chat panel: a collapsible "Assistant" section on the Pipeline tab,
between Today's desk and the table, styled with the existing C color tokens.

Controls: its own provider select (gemini | deepseek | anthropic, reusing
PROVIDERS/MODEL_SETS), model select for that provider, a "Web search" checkbox
(forced off + disabled when provider is deepseek), a history filter select
("All" or one company), and a Clear button.

Context scope: a row of toggle chips, one per pipeline company — the user
manually picks which companies' FULL detail is sent. Build the system prompt
with a helper buildChatSystem(records, scopeIds) that always includes a compact
one-line-per-company overview (company | score/band | status | client type |
touches | next due+action) plus, for picked companies only, a full detail block
via a helper buildRecordDetail(r) (classification, next due, summary, caution,
contacts incl. email/phone/url, company contact, signals with implications,
touch history, notes). The system prompt must state: assistant for Hex Trust
SDR outreach; concise and practical; drafts only — a human always sends.

Edit proposals (critical): the system prompt instructs the model to propose
pipeline edits ONLY when the user explicitly asks, by ending its reply with one
fenced block:
```json actions
[{"type":"add_note","company":"<exact name>","text":"..."},
 {"type":"set_status","company":"...","status":"<one of the STATUSES>"},
 {"type":"log_touch","company":"...","channel":"<one of CHANNELS>","date":"YYYY-MM-DD","note":"..."}]
```
Client-side: extractChatActions(text) finds a fenced json block that parses to
an array where every item has one of those three types; strip it from the
displayed reply and render each action as a card with the action described in
plain words + Apply / Dismiss buttons. Apply mutates via the existing
updateRecord (add_note appends "[AI <date>] ..." to notes; set_status validates
against STATUSES; log_touch validates channel/date, computes touch n, and
auto-moves Researched→Contacted on first touch — mirror the existing logTouch
logic). Mark applied ✓; mark failed if the company name doesn't match any
record. NEVER auto-apply anything.

Networking: POST /api/chat with { provider, model, system, messages,
max_tokens: 2000, search } where messages is the last 12 chat turns as
{role, content}, trimmed so the first message has role "user". Response is
{ text } or { error }; show errors as red assistant bubbles.

History: messages are {id, role, content, actions, companies (scope ids at send
time), ts}. Persist to window.storage under key "prospect_radar_chat_v1"; load
on mount and prune anything older than 15 days; save on every change (guard
with a loaded flag like the existing pipeline storage effects). Each assistant
bubble gets a small Copy button (clipboard with textarea fallback). Input sends
on Enter or a Send button; show a "Thinking…" line while loading; include a
one-line footnote that each message sends the overview + picked companies'
detail, replies are drafts, and history auto-deletes after 15 days.

Constraints: single-file component, no <form> tags, Tailwind core classes +
inline C tokens, don't break ANY existing feature (research, scoring, cadence,
drawer, CSV/MD export, vault sync, import/restore). Finish by running
`npm run build` and fixing anything until it passes, then summarize what
changed in simple terms.
```

---

### 📋 PROMPT 2（等 Prompt 1 完成并验证后再发）

```text
Task 1 (Assistant panel) is done. Now implement Task 2 in src/ProspectRadar.jsx
— methodology features on top of it. Do not modify the functions/ directory.

TASK 2 — MEDDPICC checklist + persona coverage + meeting brief generator

A) MEDDPICC qualification on every record: add a `meddpicc` object field
(keys: metrics, eb, dc, dp, pp, pain, champion, competition; values "" |
"partial" | "confirmed"). New records start {}; merge-on-resave keeps the old
value; sanitizeRecord preserves it on import. In the row drawer add a
"Qualification (MEDDPICC)" section: 8 pill buttons (Metrics, Economic Buyer,
Decision Criteria, Decision Process, Paper Process, Pain, Champion,
Competition) that cycle unknown → partial (amber, "~") → confirmed (green, "✓")
on click. Add one line per company to buildMarkdown when any item is set:
"- MEDDPICC: confirmed [...] · partial [...] · unknown [...]".

B) Persona coverage in the drawer: chips for ops, finance, compliance, tech,
exec, bd — filled/green when at least one contact has that persona, outlined
gray otherwise.

C) Methodology block in buildChatSystem: insert a METHOD paragraph instructing
the assistant to silently apply: MEDDPICC (unknown items = what to ask next),
SPIN discovery in order Situation→Problem→Implication→Need-payoff weighted
toward Implication, Challenger (open outreach with a taught insight tied to the
company's trigger, never a self-intro; tailor per persona: finance→cost/audit/
LP, ops→process & key-person risk, compliance→evidence for regulators,
tech→architecture/integration, exec→growth & institutional clients),
multithreading (flag single-threaded companies, suggest next persona), and MAP
(every draft/plan ends with one specific dated next step). Also include each
selected company's MEDDPICC summary and persona coverage in buildRecordDetail.

D) Meeting brief generator: a "Generate meeting brief" button at the top of the
drawer. It calls POST /api/chat using the Assistant's currently selected
provider/model/search setting, system = buildChatSystem(records, [thisRecordId]),
and a single user message asking for a <450-word markdown brief with EXACTLY
these sections: "## Objective" (one sentence + the dated next step to ask for),
"## Insights to teach" (3 Challenger-style insights for this client type ×
trigger), "## SPIN question bank" (2 Situation, 2 Problem, 3 Implication,
2 Need-payoff — specific to this company's signals), "## Qualification gaps"
(the company's unknown MEDDPICC items turned into natural questions),
"## Likely objections" (3 + one-line responses), "## Proposed next step"
(one concrete dated ask). Tell it NOT to output an actions block. Render the
result in the drawer (pre-wrap, scrollable) with Copy and a save button: if
vault sync is on, write to a "03-Briefs" subdirectory of the connected folder
as "<company-slug>-<YYYY-MM-DD>.md" with frontmatter (company, date, type:
brief); otherwise download the same file. Show loading and error states.

Same constraints as Task 1. Finish with `npm run build` passing and a plain-
language summary. Then update README.md's feature list to match reality.
```

---

## 六、交接检查清单（用户照做）

1. ☐ 下载 **prospect-radar-ready.zip**，解压到工作目录（如 `~/Desktop/Personal Work/`，可直接覆盖旧的 prospect-radar 文件夹——注意先备份你已建好的 `.dev.vars` 文件，解压后放回项目根目录）
2. ☐ 下载 **obsidian-vault-starter.zip**，把其中 `vault/` 的内容拷入 `/Users/aidenlin/Documents/Sales OS`，用 Obsidian "Open folder as vault" 打开它，读 START-HERE.md
3. ☐ 终端：`cd prospect-radar` → `npm install` → `claude`
4. ☐ 发送 Prompt 1 → 完成后 `npm run build && npx wrangler pages dev dist` 本地验证聊天功能
5. ☐ 发送 Prompt 2 → 同样验证简报生成
6. ☐ 回到《部署指南》完成 git push 与 Cloudflare 上线（记得：Gemini 密钥要 `AIza` 开头的新密钥；`.dev.vars` 不进 git）
