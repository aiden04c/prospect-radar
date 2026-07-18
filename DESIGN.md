# Prospect Radar 一体化销售系统设计稿（v4 Blueprint）

> 定位：把已建成的 Prospect Radar（研究 + 打分 + pipeline）升级为一个连通系统——会议准备（Meeting Prep）、销售方法论（Sales Methodology）、Obsidian 第二大脑（Second Brain）、外部软件（Calendar / Teams / CRM）四块协同工作。本文给出设计、数据架构、来源依据、分阶段路线，以及需要你拍板的 3 个问题。

---

## 0. 现状盘点（先明确起点）

| 状态 | 能力 |
|---|---|
| ✅ 已建成 | 多模型研究（Gemini / Claude / DeepSeek，联网搜索）、5 因子打分（/100 + Band）、pipeline 表 + 触达节奏（cadence）、CSV/MD 导出、Obsidian 单向镜像（pipeline.md，含 JSON 备份块）、Import/Restore、Cloudflare 部署 |
| 🔨 施工中 | Assistant 聊天面板（你勾选公司作上下文、AI 提议改动、你点 Apply 生效、按公司存 15 天）+ 表格筛选框 |
| 📋 本文新增设计 | 会议准备模块、方法论内嵌、Obsidian 双向数据流、Calendar/Teams/CRM 集成 |

关键判断：**施工中的 Assistant 就是整个系统的"引擎"**——会议准备、方法论问答、转录分析，本质都是"给 Assistant 换一套提示词模板 + 数据来源"，不需要另起炉灶。

---

## 1. 系统总览：数据怎么流

```
 外部世界                     核心应用                        第二大脑
┌──────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
│ Calendar     │─ICS─▶│     PROSPECT RADAR      │─自动─▶│ Obsidian 库             │
│ (Outlook/    │ 只读 │  (Cloudflare Pages)     │ 写入 │  ├ pipeline.md  ←App拥有 │
│  Google)     │      │                         │      │  ├ briefs/…     ←App拥有 │
├──────────────┤      │ · 研究 + 打分            │      │  ├ transcripts/…←人工放入│
│ Teams 会议    │─手动─▶│ · Pipeline + Cadence    │◀─读──│  ├ metrics.md   ←人工维护│
│ 转录/录音     │ 导出 │ · Assistant（引擎）      │ 取   │  └ 你的笔记 [[链接]]     │
├──────────────┤      │ · Meeting Prep 生成器    │      └───────────┬─────────────┘
│ AI 供应商     │◀经/api▶│                        │                  │
│ Gemini/Claude│ 代理  │  真源: localStorage      │◀──Import/Restore─┘
│ /DeepSeek    │      └─────────────────────────┘      Claude Code 直接读写整个库
└──────────────┘
```

三条铁律（数据所有权，防冲突的根基）：
1. **单一真源（single source of truth）**：pipeline 数据的真源是应用存储；Obsidian 里的 pipeline.md 和 briefs/ 是应用的**只写镜像**，人不改。
2. **人工拥有的文件应用只读**：transcripts/、metrics.md、你自己的笔记——应用和 AI 只读取、绝不覆盖。
3. **每个文件只有一个写入方**。双向同步冲突是这类系统最大的坑，用"所有权"直接绕开。

---

## 2. 模块一：会议与通话准备（Meeting & Call Prep）

### 工作方式
在 Pipeline 里选中一家公司 → 点 "Generate Meeting Brief" → Assistant 用专用提示词模板生成一页会议简报（brief）→ 展示在应用内 + 自动写入 Obsidian `briefs/<公司>-<日期>.md`。

### 输入 → 来源对照

| 输入 | 来源（系统内位置） |
|---|---|
| 公司档案：打分、分类、研究摘要、信号+HT 关联、联系人（含 persona） | Prospect Radar 记录（已有） |
| 触达历史 + 我方笔记 | 记录的 touches / notes（已有） |
| 上次会议说了什么 | Obsidian `transcripts/` 里的 Teams 转录（P4 接入） |
| 会议时间、参会人 | Calendar ICS（P3 接入）；接入前手动填 |
| 资格缺口（qualification gaps） | 记录新增的 MEDDPICC 检查清单（P2 新增字段） |

### 输出（简报固定结构）
1. **会议目标**（一句话 + 期望的下一步承诺）
2. **三条洞察**（Challenger 式"教"点：按客户类型 × 触发事件生成，见模块二）
3. **SPIN 提问库**（Situation / Problem / Implication / Need-payoff 各 2-3 条，从该公司信号定制）
4. **MEDDPICC 缺口清单**（八要素哪些未知 → 本次会议要补哪几个）
5. **异议预案（objection handlers）**：按客户类型的 3 个高频异议 + 应对
6. **下一步提案**（MAP 式：具体动作 + 日期 + 双方责任人）

技术实现：复用 Assistant 的 `/api/chat` 端点 + 一个 prep 提示词模板 + 一个"写入库"动作（复用 vault 文件夹句柄）。**不需要新后端**。

---

## 3. 模块二：驱动工具的五套销售方法论（含来源）

优先选了资深销售实际在用、且能直接落进工具功能的技术，排除纯理论框架。

### 3.1 MEDDPICC 资格审查（Qualification）
- **是什么**：八要素资格框架——Metrics（量化指标）、Economic Buyer（拍板人）、Decision Criteria（决策标准）、Decision Process（决策流程）、Paper Process（合同/采购流程）、Identify Pain（痛点）、Champion（内线）、Competition（竞争）。源自 1990 年代 PTC 的 MEDDIC，后扩展两要素。
- **为什么重要**：把"这个单子是不是真的"从直觉变成可核查的清单；八项答不全的地方，就是最可能卡死单子的缺口。托管类交易涉及合规审查和采购流程，Paper Process 和 Competition 这两个扩展项正中要害。
- **落进工具**：给每条 pipeline 记录加 8 项勾选清单（unknown/partial/confirmed）；Meeting Prep 自动把"未知项"转成本次会议的提问目标；Assistant 可按指令审查某家公司的 MEDDPICC 缺口；Band A 的进阶定义可要求"已识别 Champion"。
- **来源**：https://www.laxis.com/blog/meddpicc-explained/ · https://www.weflow.ai/blog/meddpicc · 官方站 https://meddpicc.net/understanding-the-meddpicc-sales-framework/

### 3.2 SPIN 提问法（Discovery Questioning）
- **是什么**：Neil Rackham 基于 35,000+ 通销售电话研究提炼的四类递进提问：Situation（现状）→ Problem（问题）→ Implication（后果放大）→ Need-payoff（价值自述）。研究发现顶尖销售的 Implication 类问题是普通销售的约 4 倍。
- **为什么重要**：复杂大额交易里"推销式收尾"会适得其反；让客户自己说出问题的代价和解决的价值，转化率显著更高。对 SDR 的发现型会议（discovery call）是最直接可用的技术。
- **落进工具**：Meeting Prep 按公司信号自动生成四类问题各 2-3 条（例：信号是"staking 扩张" → Implication 问题可指向"验证人密钥自管的运营与合规风险如果出事，对基金 LP 意味着什么"）；Assistant 支持"帮我为 X 公司准备 SPIN 问题"。
- **来源**：https://www.highspot.com/blog/spin-selling/ · https://blog.hubspot.com/sales/spin-selling-the-ultimate-guide · 原著 *SPIN Selling* (Rackham, 1988)

### 3.3 Challenger 式洞察销售（Teach – Tailor – Take Control）
- **是什么**：《The Challenger Sale》提出，复杂 B2B 里表现最好的不是"关系型"销售，而是能**教**给客户新视角（Teach）、按干系人**定制**信息（Tailor）、**掌控**推进节奏（Take Control）的销售。
- **为什么重要**：SDR 的第一封信、第一通电话拼的就是"有没有带来客户没想到的洞察"——纯自我介绍没人回。托管行业天然有洞察素材：监管变化、安全事件、TGE 前的运营坑，这正是"教"的弹药。
- **落进工具**：现有的"first-message angle"（按触发事件的一句话切入角度）已是雏形 → 升级为"洞察库"：每种 客户类型 × 触发事件 组合给 1-2 条可教的行业洞察；Tailor 由 persona 排序承担（给 finance 讲成本与审计、给 tech 讲密钥架构）；Take Control 由 MAP 式下一步提案承担。
- **来源**：官方 https://challengerinc.com/what-is-challenger-sales-methodology/ · https://www.salesforce.com/blog/sales/challenger-sales-methodology/ · 原著 *The Challenger Sale* (Dixon & Adamson, 2011)

### 3.4 多线接触（Multithreading）
- **是什么**：不依赖单一联系人，同时和目标机构内多个干系人建立关系。Gartner 口径下 B2B 采购平均涉及 6-10 个干系人；Gong 对 180 万个商机的分析显示，5 万美元以上的单子多线接触可将赢单率提升约 130%，成交单的买方联系人数量约是丢单的 2 倍。
- **为什么重要**：单线 = 内线一离职/失势，单子就死。托管决策横跨运营、合规、财务、技术——本来就不可能一个人拍板。
- **落进工具**：联系人 persona 排序（已有）之上加 **覆盖度视图（persona coverage）**：每家公司显示"已触达 persona / 目标 persona"，缺口高亮；cadence 支持对同一公司的不同联系人分别记触达；Assistant 可按指令建议"下一个该接触谁、用什么话题"。
- **来源**：https://prospeo.io/s/multi-threaded-sales-approach（Gong 数据） · https://www.landbase.com/blog/multi-threading-enterprise-deals-win-rate-2026（Gartner 干系人数据） · https://www.usergems.com/blog/how-much-is-multithreading-worth-to-your-pipeline-and-revenue

### 3.5 共同行动计划（Mutual Action Plan, MAP）
- **是什么**：卖方和买方共同维护的一份推进文档：里程碑、双方责任人、日期。每次互动以"写进 MAP 的具体下一步"收尾，而不是"保持联系"。
- **为什么重要**：40%+ 的复杂单子死于"买方内部无法对齐"而非输给对手；MAP 提供每一步的买方承诺检查点，也让预测（forecast）从感觉变成里程碑。对 SDR 的迷你版：**每次触达都必须以一个有日期的下一步收尾**。
- **落进工具**：cadence 引擎（已有）就是 MAP 的个人版；升级点：Meeting Prep 的"下一步提案"字段强制生成；对进入 Meeting 状态的公司，Assistant 可生成一份轻量 MAP 草稿（markdown 表格）写入 briefs/。
- **来源**：https://www.dock.us/library/mutual-action-plans · https://www.salesforce.com/blog/mutual-action-plan/ · https://qwilr.com/blog/mutual-action-plan/

> 五套的分工：MEDDPICC 管"这单值不值得追"，SPIN 管"会上怎么问"，Challenger 管"说什么才有人理"，Multithreading 管"和谁说"，MAP 管"说完之后推进"。Assistant 的系统提示词将内嵌这五套的操作要点，让每一次问答默认带着方法论。

---

## 4. 模块三：Obsidian 第二大脑（数据流设计）

### 应用从库里"拉"什么（读）
| 数据 | 库内位置 | 用途 |
|---|---|---|
| 会议转录 | `ProspectRadar/transcripts/<公司>-<日期>.md`（或 .vtt 转存） | Meeting Prep 的"上次聊了什么"；Assistant 总结承诺事项 |
| 销售指标/KPI | `ProspectRadar/metrics.md`（你手动维护：周触达数、回复率、会议数） | Assistant 回答"我这周节奏如何"、建议优先级 |
| 线索补充情报 | 你写的任意笔记，`[[公司名]]` 链接 | 经 Claude Code 读取汇总（浏览器应用不递归扫库） |

技术路径：浏览器应用通过**已有的文件夹句柄（File System Access handle）**可以读取所连接文件夹内的文件——所以 transcripts/ 和 metrics.md 放在已连接的文件夹里即可被 Assistant 读到，无需新授权。全库级的深度检索交给 **Claude Code**（它本来就能读整个库）。

### 应用往库里"写"什么（写）
| 数据 | 文件 | 触发 |
|---|---|---|
| Pipeline 全量镜像 + JSON 备份 | `pipeline.md`（已建成） | 每次改动自动 |
| 会议简报 | `briefs/<公司>-<日期>.md` | 点 Generate Brief |
| 通话结果、AI 代写笔记、状态变更 | 写入记录本身 → 随 pipeline.md 镜像 | Assistant 提议 + 你 Apply |

### 明确不做的事
不做"应用解析你手写笔记后回写修改"——违反所有权铁律，且解析人类自由笔记极易出错。人的笔记由人（或你指挥 Claude Code）维护。

---

## 5. 模块四：外部软件集成（Calendar / Teams / CRM）

| 集成 | 同步数据（方向） | 频率 | 触发的动作 | 可行性 |
|---|---|---|---|---|
| **Calendar**（Outlook/Google） | 未来 14 天的会议：标题、时间、参会人 →（单向拉入应用） | 打开应用时 + 手动刷新（无服务器常驻，暂不做定时轮询） | 会议标题匹配到 pipeline 公司 → 在 Today's desk 显示"今天有会：X 公司"并一键生成 Brief | 🟢 高：两家都支持"秘密 ICS 订阅链接"，只读、无需 OAuth；经 Pages Function 代理拉取解析 |
| **Teams**（会议 & 转录） | 转录/纪要 →（单向，人工导出后放入库 transcripts/） | 会后手动（约 1 分钟/次） | Assistant 读转录 → 提炼承诺事项 → 提议 log touch + 笔记 → 你 Apply | 🟡 中：Graph API 自动拉录音/转录需要**租户管理员授权**，公司账户大概率批不了个人工具；手动导出是务实解 |
| **CRM / Pipeline** | 现阶段：Prospect Radar **即** pipeline 系统（真源）；CSV/MD 随时可导出喂给任何 CRM | — | — | 🟢 现状即可用 |
| CRM（未来，若需要） | 双向：状态、触达 ↔ HubSpot Free 等（REST API，经 Pages Function） | 手动"Sync"按钮起步 | 推送状态变更、拉取邮件互动记录 | 🟠 低优先：等真实需要再做 |

### ⚠️ 合规红线（必须先说清）
你将是**受监管托管机构**的员工。把公司的 Calendar / Teams / CRM 数据接入**个人自建工具**，很可能触碰公司数据政策。设计上的对策：一切公司数据接入均为**只读、本地、手动**（ICS 只读、转录手动导出），且**在实际连接公司账户前，先向经理或 IT 确认是否允许**。个人研究层（公开信息的打分与研究）不受影响。

### 标注的不确定点（我不确定、需要验证或你拍板）
1. Teams 转录导出格式因租户设置而异（.docx / .vtt / 仅频道内查看）——拿到真实样本前，解析器先按两种都支持设计。
2. ICS 秘密链接在公司 Outlook 里可能被 IT 策略禁用——有 Plan B（手动导出 .ics 文件拖入应用）。
3. Cloudflare 定时轮询（Cron Triggers + KV 存储）会引入持久化后端，改变"无状态"架构——除非你明确要自动提醒，否则不上。

---

## 6. 分阶段路线图

| 阶段 | 内容 | 前置 | 工作量 |
|---|---|---|---|
| P1（施工中） | Assistant 聊天 + 筛选框 | 无 | 已过半 |
| P2 | Meeting Prep 生成器 + MEDDPICC 清单字段 + persona 覆盖度视图 + 方法论内嵌提示词 | P1 | 1 次构建会话 |
| P3 | Calendar ICS 接入（Today's desk 显示今日会议） | 你提供 ICS 链接 | 小 |
| P4 | 转录闭环（transcripts/ 读取 → Assistant 总结 → 提议记录） | P1 + 库文件夹已连接 | 中 |
| P5（可选） | Graph OAuth 自动化 / 真 CRM 双向同步 | 公司许可 + 真实需要 | 大，不急 |

---

## 7. 需要你决定的 3 个问题

1. **Calendar / Teams 账户性质**：你日常会议在公司 Microsoft 账户、个人账户，还是暂时没有 Teams 会议？→ 决定 P3 走 ICS 还是手动、P4 是否可行。
2. **CRM 定位**：Prospect Radar 就是你唯一的 pipeline 工具，还是（未来入职后）公司有 CRM 需要考虑对接？若有，是哪家？→ 决定 P5 是否进入计划。
3. **Obsidian 库现状**：你已有固定的库结构（告诉我文件夹约定，我来适配），还是新建一个按本文约定来？以及库和 Chrome 是否在同一台电脑？→ 决定文件夹命名与读取路径。
