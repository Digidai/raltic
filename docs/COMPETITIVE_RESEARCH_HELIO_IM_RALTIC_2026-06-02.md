# Helio.im vs Raltic 深度竞品研究与 GTM 策略

研究日期：2026-06-02
研究对象：Helio at `https://helio.im/` / `https://www.helio.im/`
对照对象：Raltic at `https://raltic.com/` and local repo state

> 重要更正：本报告只研究 `helio.im`。先前误把 `helio.so` 当作研究对象；该文件已删除，结论不沿用。

> 同名防混淆：不要把 `helio.im` 与 `helio-ai.com` / LinkedIn `helioai` / Crunchbase 或 PitchBook 上的 recruiting Helio.AI 混为一谈。后者是 AI 招聘/前线招聘公司，融资、团队、评测、客户信息均不能套用到本报告对象。

## 1. 一句话结论

Helio.im 是 Raltic 当前最接近的叙事竞品之一，不是因为它和 Raltic 使用完全相同的架构，而是因为它在抢同一个市场定义：**AI 不再是 sidebar、bot、plugin，而是进入团队频道、任务、代码会话和审批流的 AI colleague / AI workforce**。

Raltic 不应该正面复制 Helio 的泛化 “AI Native workforce” 叙事。Raltic 更合理的进入市场路径是先占住更尖锐、更可信、更容易转化的楔子：

**让 Claude Code / Codex / 本地或云端 agent 进入团队频道协作，但源代码、provider key 和本地文件不必上传到平台。**

换句话说：

- Helio 的强项是“AI 同事”叙事、低配置上手、多职能场景包装。
- Raltic 的强项应是“工程团队可接受的 agent team chat”：local-first、BYO runtime、provider-key 不经平台、开源/自托管路径、安全审查友好。
- Helio 更像 “AI workforce workspace”；Raltic 应先成为 “secure agent team chat for engineering teams”，再扩展到 PM、research、GTM、ops。

## 2. 研究方法与 Review 规则

本研究使用五类证据，并按强度区分：

1. **一手官方证据**：Helio 官网、产品页、场景页、品牌页、隐私政策、服务条款、app 入口、下载 feed；Raltic 官网、本地 README、架构设计文档、营销页源码。
2. **AI 二审**：调用 Grok 与 Claude Code 各自独立复核 Helio.im 信息，再用官方页面/条款重新验证可采纳项。
3. **半一手动态信号**：Helio LinkedIn/X 公司页更新、公开 app bundle/下载版本、Raltic GitHub/npm 动态。
4. **第三方观察**：TestingCatalog、WeFound、Donnie Chu、YAAT directory 等。
5. **市场压力源**：OpenAI Workspace Agents、Slack AI agents / Agentforce、其他 agent workspace 类产品目录。

2026-06-03 追加：再次调用 Grok 对本报告做 gap-finding。Grok 输出只作为线索生成器；可写入本报告的增量必须经过官网、可访问网页、app HTML/asset、第三方文章或本地 repo 复核。未能复核的 X 具体帖文只列入 watchlist，不作为强结论。

Review 原则：

- 官方网页宣称的 “Live today / In preview / Coming soon” 按官方状态记录，不自动等同于完整可用。
- 第三方文章如果标注 sponsored，只作为传播动作和市场叙事证据，不作为事实唯一来源。
- App bundle string / download feed 只能证明功能域、部署形态和版本信号，不能证明端到端用户体验。
- Raltic 能力以 repo/官网当前内容为准，不把设计文档中的未来能力当成已经上线能力。

## 3. 证据索引

### Helio.im 官方与产品证据

- Homepage: `https://www.helio.im/`
- Product: `https://www.helio.im/product/`
- Scenarios: `https://www.helio.im/scenarios/`
- Book a demo: `https://www.helio.im/book-a-demo/`
- Brand: `https://www.helio.im/brand/`
- Privacy: `https://www.helio.im/legal/privacy/`
- Terms: `https://www.helio.im/legal/terms/`
- Web app: `https://app.helio.im/`
- Download feed:
  - `https://downloads.helio.im/macos/stable-mac.yml`
  - `https://downloads.helio.im/windows/stable.yml`

### Helio.im 外部动态

- LinkedIn: `https://www.linkedin.com/company/helio-im`
- X: `https://x.com/helioim_ai`
- TestingCatalog: `https://www.testingcatalog.com/helio-launches-ai-powered-team-workspace-in-beta/`
- WeFound: `https://wefound.cc/p/2862.html`
- Donnie Chu: `https://donniechu.com/posts/helio-ai-dong-nghiep-trong-channel`
- 腾讯新闻 / 硅星人Pro: `https://news.qq.com/rain/a/20260531A03QP000`
- YAAT directory: `https://yaat.sh/`

### 同名排除项

- Recruiting Helio.AI: `https://helio-ai.com/`
- LinkedIn recruiting company: `https://www.linkedin.com/company/helioai`
- 任何 Helio.AI recruiting / frontline hiring 的融资、客户、评测、招聘资料均不用于本报告。

### Raltic 证据

- Homepage: `https://raltic.com/`
- Security: `https://raltic.com/security`
- Runtimes: `https://raltic.com/runtimes`
- Teams: `https://raltic.com/teams`
- Local files:
  - `README.md`
  - `docs/DESIGN_agent_platform_v2.md`
  - `apps/web/src/app/(marketing)/page.tsx`
  - `apps/web/src/app/(marketing)/security/page.tsx`
  - `apps/web/src/app/(marketing)/runtimes/page.tsx`
  - `apps/web/src/app/(marketing)/teams/page.tsx`

### 市场压力源

- OpenAI Workspace Agents: `https://help.openai.com/en/articles/20001143-chatgpt-workspace-agents-for-enterprise-and-business`
- Slack AI agents: `https://slack.com/ai-agents`
- Slack agent help: `https://slack.com/help/articles/33076000248851-Work-with-AI-agents-and-assistants-in-Slack`

## 4. Helio.im 是什么

Helio.im 的核心定位非常明确：

> AI colleague / AI Native workforce / AI-native team workspace.

它不是把 AI 包成一个聊天窗口，也不是只做自动化 workflow，而是把 AI 当成组织成员放进协作系统：

- AI 在同一个 channel 发言。
- AI 接同一个 task。
- AI 开 coding session 处理代码工作。
- AI 有角色、身份、记忆、审批边界。
- 人类保持 in the loop，并决定什么可以 ship。

Helio 首页第一屏文案强调：

- “Your AI colleague that works beside you.”
- AI colleagues sit in the same channels, take the same tickets, ship the same work.
- You stay in the loop and decide what ships.

这与 Raltic 首页的 “Your AI Agent. Or theirs. In the same team chat.” 高度重叠。两者都在反对“AI 被困在个人私聊/侧边栏/单点工具里”，都把团队频道作为 AI 协作的主界面。

## 5. Helio 的产品叙事拆解

### 5.1 核心敌人：AI 还没有真正进团队

Helio 的对立面不是某一个竞品，而是今天主流 AI 使用方式：

- Chat tool 是为人类设计的。
- AI 工具被加在 sidebar、bot、plugin、独立 tab 里。
- Copilot 不知道 Slack，Slack 不知道 PM 工具，PM 工具不知道代码上下文。
- 责任链不可见：谁起草、谁批准、谁执行、谁收尾。

这套叙事非常强，因为它直接击中 AI 工具 adoption 的真实断点：不是模型不够强，而是组织协作没有承接 AI 的工作过程。

### 5.2 核心主张：AI 是 colleague，不是 bot

Helio 反复使用 “colleague / teammate / workforce / team” 语言，而不是 “agent runtime / bridge / daemon / workflow builder”。

这降低了非工程用户理解成本：

- 不需要先理解 agent orchestration。
- 不需要先写配置。
- 不需要先区分 Claude Code、Codex、MCP、Docker。
- 先理解“多了几个同事在频道里干活”。

这也是 Helio 当前最值得 Raltic 学习的地方：它没有先解释架构，而是先解释组织形态变化。

### 5.3 六个产品表面

Helio Product 页列出六个 pillars：

| Pillar | 官方状态 | 核心说法 | 对 Raltic 的含义 |
|---|---:|---|---|
| Unified channels | Live today | One message plane for humans and AI | 与 Raltic 最直接重叠 |
| Tasks | Live today | AI claim ticket，人类 sign off | 与 Raltic task board 重叠，但 Helio 的“AI owns lane”更强 |
| Coding sessions | Live today | Claude Code or Codex, real terminal, real filesystem, reviewable diffs | 与 Raltic bridge/cloud runtime 直接竞争 |
| AI teammates | Live today | role-specific colleagues, channels/DM/memory/audit trail | Raltic 已有 agent 身份，但包装可加强 |
| Email | In preview | real inboxes, draft/approve, inbound projected into channel | Helio 在 GTM/ops 场景扩张更快 |
| Meetings | Coming soon | meeting bot, transcript to channel, decisions to tasks | 当前偏路线图，但叙事补全了“工作日闭环” |

官方 Product 页还出现了较硬的技术叙事：

- persistent runtime for long-running work
- per-workspace filesystem mounted at `/workspaces`
- JuiceFS-backed
- per-user dotfiles and MCP tools persist in `/root`
- vault-managed secrets with KMS envelope encryption and OpenFGA ACLs

这说明 Helio 并不只是轻量聊天 UI，它在努力把自己包装成可执行工作的平台。

### 5.4 场景叙事：Alice 的 10 人公司，Ada 与多个 AI 队友

Helio Scenarios 页不是按功能清单说服，而是按一天的工作流说服：

- 09:00：AI 总结当天注意事项。
- 10:30：AI engineer 从频道里的 dashboard idea 接任务并准备 PR。
- 12:00：Recruiting AI 处理候选人邮件并同步 hiring context。
- 14:00：Meeting AI 记录会议并生成 follow-up。
- 16:00：Social AI 根据团队语气起草发布内容。
- 23:00：AI 更新自己的 private wiki。

二审校正：Alice 是人类创始人 persona；Ada 是常驻 AI assistant。场景页还覆盖 Incident response、Recruiting loop、Launch day、New hire onboarding 等工作流，其中部分 live、部分 preview/coming soon。

这个叙事把 AI colleague 的“持续存在感”讲得很清楚：AI 不是某次对话，而是在工作日里持续接力。

Raltic 目前也有“agent roster”和 channel mock，但更偏工程、安全、运行时选择。Helio 的故事更 broad、更容易让非技术团队想象“我可以雇 5 个 AI 同事”。

## 6. Helio 的营销动作

### 6.1 官网动作

Helio 的官网很小，但每一页都服务同一个叙事：

- 首页：AI colleague in action，直接模拟频道 + 任务板。
- Product：六个 pillars，明确 live/preview/coming soon。
- Scenarios：按一天工作流包装场景。
- Book a demo：存在 founder-led / assisted selling 路径，页面承诺带上 repo 或瓶颈，现场把 team AI user 接入客户 stack，并展示客户 repo 上的真实 PR。
- Brand：提供 logo、wordmark、品牌色，降低媒体/目录/文章传播摩擦。
- Legal：隐私政策和条款已上线，说明他们至少准备公开 beta 或早期商业试用。

值得注意的是：Helio 目前没有公开 pricing page、comparison page、security page、docs page、developer docs、case studies，但它不是纯 PLG 或纯故事营销。`/book-a-demo/` 说明它已有高接触工程销售脚本：不是只展示“AI 同事”的想象力，而是试图在客户真实 repo 上跑出可见 PR。

### 6.2 App 与下载动作

`app.helio.im` 是一个独立 SPA，HTML 中预连：

- `https://api.helio.im`
- `https://clerk.helio.im`

这说明 Helio 使用 Clerk 做身份/组织入口，并有独立 API 服务。app bundle 里出现高频字符串：

- channel: 170
- email: 166
- workspace: 127
- task: 75
- assistant: 73
- approval: 21
- calendar: 18
- linear: 16
- memory: 13
- github: 7
- claude/codex 各 2

这不是功能证明，但与官网的产品域一致：频道、任务、assistant、email、approval、calendar 是真实应用域，而不是只存在于 marketing copy。

下载 feed 显示：

- macOS latest redirects to `Helio-0.3.16-arm64.dmg`
- Windows latest redirects to `Helio-Setup-0.3.16.exe`
- macOS `0.3.16` releaseDate: `2026-05-29T16:41:38.000Z`
- Windows `0.3.16` releaseDate: `2026-05-29T16:47:42.000Z`

这与早期第三方文章里 “Windows coming soon” 的说法有时间差：截至 2026-06-02，下载 feed 显示 Windows 安装包已经存在。

### 6.3 LinkedIn 动作

LinkedIn 公司页显示公司体量很小，但发布频率高，近一周围绕具体 use cases 连续发：

- Helio Task：从 conversation 到 task，到 thread 内 ship。
- room-aware replies：AI 发言前检查 conversation 是否已经变化，减少 stale/duplicate replies。
- Helio Calendar：定时扫描 AI news，给用户高信号 briefing。
- KOL campaign tracker：让 AI colleague 作为 GitHub/Vercel collaborator 构建 tracker。
- dedicated GitHub identity：AI 用独立 GitHub account，不共用 token，形成 audit trail。
- Demo Day: Managing Context for Agents：把 Claude Code learning log 整理成结构化 HTML。
- AI Channels：展示 AI teammates 之间的 channel/DM 协作痕迹。
- LinkedIn content pipeline：把 team context 转成可 review 的 LinkedIn drafts。
- team templates：Data、GTM、Academic Research、Industrial Research。
- Windows app：云端运行、全天候执行，不再依赖用户电脑常开。

这套动作有几个特点：

- 不是泛泛发布 feature，而是把每个 feature 放进一个具体 workflow。
- 工程、GTM、research、content、KOL、calendar 都覆盖，目标不是单一 devtool。
- 强调“AI 有自己的身份、自己的 task、自己的协作痕迹”，持续强化 colleague 叙事。

缺点也明显：

- LinkedIn follower 很少，早期触达有限。
- 社媒互动量低，当前更像 founder-led / small-team launch，而不是已验证大规模需求。
- 高频 use-case 发文可能会稀释核心 ICP，让产品显得“什么都能做”。

### 6.4 第三方传播动作

TestingCatalog 文章称 Helio 进入 beta，但同页出现 invite-only、public beta、Discord early-access 等混合表述；页面带 sponsored 标记，因此更像付费/合作传播。它仍然有价值，因为说明 Helio 已经在买或推动目录/媒体曝光，但不应把它当作“完全无门槛 public beta”的强证据。

WeFound 中文文章在 2026-05-19 左右收录 Helio，并准确提到：

- 不是 AI 侧边栏，而是 AI colleague 进入工作空间。
- Live surfaces 包括 unified channels、tasks、coding sessions、AI teammates。
- Email preview、Meetings coming soon。
- 集成方向偏工程团队：Slack/Lark/Teams/Discord，Claude Code/Codex/Custom MCP/Docker，Linear/GitHub/Vercel/Gmail/Zoom/Meet。

Donnie Chu 的文章更像实测/观察，给出两个可参考信号：

- 用户感受到 Helio 相比 Claude Code/Codex/OpenClaw 的优势是减少配置开销。
- 场景包括 content pipeline 和 AI product team discussion。

需要注意：第三方文章中关于 founder、public beta、pricing、BYOK、Dream Cycle、permission granularity 等说法不都能在官方页面完整确认。报告中将它们作为“外部观察”，不作为一手事实。

### 6.5 二审新增：条款、Demo 与工程楔子

Grok 和 Claude Code 的独立二审都指出同一个关键遗漏：Helio 的公开叙事虽然 broad，但 GTM 楔子并不弱于工程场景。`book-a-demo` 页的销售脚本是“walk out with an AI colleague”，并承诺把 team AI user 接入客户 stack，展示真实 PR。这个信号改变了一个判断：Raltic 不能只说“我们更懂工程”；Helio 也在把 Claude Code / Codex / GitHub PR 当作第一批可演示价值。

二审还补充了两个 trust 信号：

- Privacy：Helio 隐私政策更新于 2026-05-15，明确把 “conduct research (including model training)” 写进服务改进用途；同时公开 subprocessor 主要是 PostHog 与 Plausible，并称这些分析服务不接触姓名、邮箱或 message contents。Raltic 的攻击点应精确，不要泛泛说“Helio 一定拿客户代码训练”，而应说“Helio 条款保留 research/model-training 用途，且 coding session 在 Helio 云端 workspace/runtime 中执行”。
- Terms：Helio 条款禁止用户用输出开发与 Helio 竞争的模型/网站/app，并给用户 content 授予非常宽的全球、可转让、可再许可、永久许可。这对 CISO/legal review 是潜在摩擦点。

## 7. Helio 的核心优势

### 7.1 叙事压缩能力强

Helio 的一句话足够明确：

**Your AI colleague that works beside you.**

这比 “multi-agent orchestration platform” 更容易传播，也比 “Slack for AI agents” 更不依赖用户理解 Slack + agent 的拼接。

### 7.2 场景横向覆盖广

Helio 不只讲 coding：

- engineering incident
- coding tickets
- recruiting emails
- meetings
- social/content
- KOL campaign
- daily intelligence scan
- product team discussion

这让它更像“公司运营层”的产品，而不是只卖给开发者。

### 7.3 把 agent 配置隐藏成 teammate creation

第三方观察和 LinkedIn 发文都在强调：

- 不需要写复杂 config。
- 不需要先懂 Docker/terminal。
- 选 team template 或描述目标就能开始。

这是 Helio 对 Raltic 的最大威胁之一。Raltic 如果继续以 runtime/daemon/bridge 为主要入口，会在非技术用户面前显得更难。

### 7.4 “身份”叙事很强

Helio 强调 AI colleague：

- 出现在 member list。
- 有 email。
- 有 GitHub account。
- 有 task ownership。
- 有 approval surface。
- 有 memory/private wiki。
- 有可见的 AI channel / DM trace。

这会让用户更容易把 AI 当成组织角色，而不是把 AI 当成一次性工具。

## 8. Helio 的弱点与可攻击面

### 8.1 Trust / security 还不够具体

Helio 说有 audit trail、approval、KMS、OpenFGA，但它没有明显独立 security page，也没有像 Raltic 一样强调：

- bridge mode 下源代码不上传。
- provider key 不经过平台。
- 机器级 revoke。
- 本地文件只由本地 runtime 读取。
- 自托管/开源路径。

Helio 隐私政策还写到可能为了改进服务进行 research including model training。这对工程团队、企业安全、客户代码场景会是一个销售阻力。需要精确表达：官方同时说明 PostHog/Plausible 等分析服务不接触姓名、邮箱或 message contents，所以不能粗暴断言“Helio 必然拿客户代码训练”。更专业的攻击面是：Helio coding session 的公开技术叙事指向云端 workspace/runtime，而隐私条款保留 research/model-training 用途；Raltic 可以用 local bridge path 明确证明 repo/key 不进平台。

### 8.2 叙事 broad，但工程楔子也很强

Helio 同时讲：

- coding
- email
- meetings
- recruiting
- social
- KOL campaigns
- intelligence brief
- daily reports
- private wiki

这很适合传播早期想象力，但采购时会遇到问题：用户不知道先用哪一个 workflow 落地，也不知道谁是第一买家。

但二审补充说明，不能把 Helio 简单判断成“非工程优先”。它的 demo 页直接承诺在客户 repo 上展示真实 PR，Product 页也把 Coding sessions 列为 Live today，并强调 Claude Code / Codex、real terminal、filesystem、reviewable diffs。Raltic 可以反过来更窄，但不能只靠“我们更工程”区分；必须靠更硬的边界：local execution、provider key locality、open/self-host path、断网仍可证明的执行位置。

### 8.3 当前社会证明仍弱

可观察信号显示 Helio 仍处早期：

- LinkedIn follower 只有十几人级别。
- 三方收录多，但多数是目录/工具媒体/个人观察。
- 没看到公开客户 logo、case study、pricing、enterprise security docs。

这给 Raltic 留出窗口期：Helio 叙事抢得快，但还没有形成强品牌护城河。

### 8.4 开源/本地/自托管缺位

Helio 目前看起来是 hosted SaaS + desktop/web。它说能用 Claude Code/Codex、Docker、Custom MCP，但公开叙事的默认路径是 cloud-operated AI colleagues。

Raltic 可以明确占住：

- local-first agent execution
- BYO daemon
- no provider markup
- code stays local
- self-hosting path
- open repo / inspectable architecture

这是 Helio 很难短期复制并同时保持“零配置 broad workforce”体验的地方。

## 9. Raltic 当前定位

Raltic 官网和 README 当前定位是：

**team chat where AI agents are first-class teammates**

当前可见叙事重点：

- Your AI Agent. Or theirs. In the same team chat.
- Raltic cloud Agent 零安装。
- Bring your own daemon：Claude Code、Codex、OpenClaw、Hermes。
- Mix runtimes in the same workspace.
- Source code stays local in bridge mode.
- Provider keys never leave the machine.
- Messages, threads, search, tasks in cloud chat.
- Free private beta.

本地 README 还强调：

- local runtimes through bridge on laptop
- cloud-native `RalticAgent` workers backed by Cloudflare Durable Objects and sandbox containers
- agents communicate over chat, DMs, threads, semantic search, task board

Raltic 的真实优势是：它不是只做 “AI colleague” 的美好界面，而是能讲清楚 AI runtime 在哪里、代码在哪里、key 在哪里、消息在哪里。

但 Raltic 的短板也明显：

- Marketing 更偏工程和安全，colleague/teamwork 想象力不如 Helio。
- “bridge / daemon / runtime” 对非开发者有理解成本。
- Teams page 目前还明确是 private beta/waitlist，audit log、seat management、shared agents 等还在 roadmap。
- Raltic 首页已经提 cloud Agent，但用户可能仍然首先记住 local bridge，需要更清楚区分“零安装 cloud agent”和“安全本地 bridge”的两条路径。

## 10. Helio vs Raltic：真实竞争图谱

| 维度 | Helio.im | Raltic | 判断 |
|---|---|---|---|
| 核心叙事 | AI colleague / AI Native workforce | Your AI Agent or theirs in same team chat | Helio 更情绪化、更 broad；Raltic 必须更安全/locality 可信 |
| 首屏理解 | AI 同事一起工作 | AI agent 进入 team chat，cloud 或 local | Helio 更快；Raltic 信息密度更高 |
| 目标用户 | 小团队、GTM、ops、engineering、research；book-a-demo 明确打 repo/PR | AI-native engineering teams, indie/dev teams, security-sensitive teams | Raltic 应先更窄，但不能低估 Helio 的工程楔子 |
| Runtime | Claude Code, Codex, Custom MCP, Docker | Claude, Codex, OpenClaw, Hermes, Raltic cloud agent | Raltic runtime pluralism 更强，需讲得更简单 |
| 执行位置 | 倾向 cloud / workspace runtime | cloud agent + local bridge | Raltic local-first 是差异化核心 |
| 代码安全 | 提 audit / KMS / OpenFGA 等；cloud workspace/runtime 叙事更强 | 明确 code/key 不经 Raltic bridge path | Raltic 可强攻 locality + security wedge |
| 任务 | AI claims tickets, human closes | built-in task board | Helio 的 task ownership 叙事更强 |
| 审批 | high-stakes approval card | 目前需进一步产品化和营销化 | Raltic 应补 approval cards |
| Email/Meetings | Email preview, meetings coming soon | 不是当前核心 | Helio 横向场景更广 |
| 开源/自托管 | 未见明确公开路径 | MIT repo, self-host docs/roadmap | Raltic 可打 regulated / devtool trust |
| 社媒动作 | LinkedIn 高频 use-case 发布 | Raltic 暂无同等公开节奏 | Raltic 应立即补内容节奏 |
| 传播资产 | Brand page, directory/press/articles | 官网深、但 brand assets/comparison 少 | Raltic 应补 comparison + use-case assets |

## 11. 更大的市场背景

Helio 和 Raltic 的真正竞争不只来自彼此。

### 11.1 OpenAI Workspace Agents 是平台级默认入口

OpenAI Workspace Agents 已经覆盖：

- create agent from template or builder
- team directory
- tools/apps/custom MCPs/skills/files
- Slack channel
- schedules
- write approvals
- connector action constraints
- version history
- analytics
- admin controls

这说明“workspace agent”正在变成 ChatGPT Enterprise/Business 的内置能力。Raltic 不应试图和 OpenAI 比“谁的 agent builder 更通用”。Raltic 应聚焦 OpenAI 不会自然拥有的边界：

- Claude Code / Codex / OpenClaw / Hermes 并存。
- 本地代码和 provider key 不经平台。
- agent output 进入 Slack-like shared team chat，而不是只在 ChatGPT/Slack channel adapter 里跑。
- 可自托管/可审计/可替换 runtime。

### 11.2 Slack/Agentforce 是协作入口压力

Slack 正在把 AI agents 变成 Slack 内部协作的一部分。它拥有默认团队沟通入口和企业关系。

这对 Helio/Raltic 都是压力：

- 如果用户只想在 Slack 里 @ 一个 agent，Slack/OpenAI/Salesforce 会越来越够用。
- 新 workspace 只有在“AI 工作的核心形态不适合传统 Slack”时才有机会。

Raltic 不能只说“Slack + AI”，必须说清楚：

- Slack bot 看不到本地 repo 和本地 CLI。
- Slack 不是 agent runtime control plane。
- Slack 不天然解决 provider key / local execution / multi-runtime audit。
- Raltic 是 agent 的工作现场，不只是消息接收器。

### 11.3 Agent workspace 已经拥挤

YAAT 目录里已有一批相邻产品：

- Slock：humans and agents in shared channels/DMs, local execution/privacy angle.
- Cumora：desktop AI teammate workspace.
- Kollab：AI-native workspace for teams and agents.
- VM0：AI teammate across tools.
- SureThing：Slack-native multi-agent platform.
- Paperclip：agent company / control plane.

这说明“AI teammate/workspace”不是空白市场。Raltic 必须避免泛泛地说 “AI teammates”，否则会被目录化、同质化。

## 12. Raltic 应该怎么差异化

### 12.1 不要跟 Helio 抢泛化 AI workforce

Helio 已经把 “AI colleague / AI workforce” 讲得很顺。Raltic 如果也直接说“AI 同事帮你 coding、email、meeting、social、hiring”，会显得像追随者。

Raltic 应该选择一个 Helio 难以直接防守的叙事：

**Your AI agents can join the team without your code joining someone else's cloud.**

中文表达：

**让 AI Agent 进入团队，不让代码和密钥离开你的机器。**

这句话把 Raltic 和 Helio/OpenAI/Slack 都区分开：

- Helio：AI colleague 想象力强，但默认 cloud trust 问题需要解释。
- OpenAI/Slack：agent directory 和 approvals 强，但 runtime/provider/local code 不可控。
- Raltic：现有 Claude Code/Codex 直接进团队频道，安全边界更清楚。

### 12.2 先服务一个最痛 ICP

建议第一 ICP：

**5-50 人 AI-native engineering/product teams，已经在用 Claude Code/Codex/Cursor，但 AI 结果困在个人本地/私聊里，且安全/客户/合规不允许把 repo 全量上传到新平台。**

典型画像：

- devtool / B2B SaaS startup
- AI-native agency / product studio
- security-sensitive engineering team
- founder-led engineering org
- 已有 Claude/Codex 付费
- 有 Slack/Discord/Lark，但 AI 工作没有团队可见性
- 对“再买一个 AI seat”抗拒，但愿意买协作层

不建议第一阶段主攻：

- 大企业通用 knowledge worker：OpenAI/Slack 入口太强，Raltic compliance 还未完整。
- 纯 GTM/content 团队：Helio 的场景包装更强，Raltic 暂时缺 email/calendar/meeting story。
- 只想要个人 AI assistant 的用户：Raltic 的 team value 不明显。

### 12.3 核心 positioning

建议英文：

> Raltic is the secure team chat for AI agents. Bring Claude Code, Codex, or your own daemon into shared channels while your code and provider keys stay where they belong.

建议中文：

> Raltic 是给 AI Agent 用的安全团队频道。把 Claude Code、Codex 或你自己的 daemon 拉进团队协作，但代码和模型密钥留在你自己的环境里。

更短的 landing message：

> Your coding agents, in team chat. Code stays local.

### 12.4 与 Helio 的公开对比角度

不要攻击 Helio；承认它是同类产品，然后定义不同选择：

| 用户问题 | Helio 角度 | Raltic 角度 |
|---|---|---|
| 我想最快组一个 AI team | Helio 更适合 broad no-config teammate creation | Raltic 适合已有 Claude/Codex 工作流的团队 |
| 我想让 AI 做 GTM/email/meeting | Helio 叙事更完整 | Raltic 先不抢 |
| 我不能上传 repo/key | Raltic 更清楚 | 这是 Raltic 主战场 |
| 我想混合多个 runtimes | Raltic 更强 | Claude/Codex/OpenClaw/Hermes/cloud agent in one chat |
| 我想自托管/审计架构 | Raltic 更强 | open/self-host path |
| 我想要最像“同事”的 UI | Helio 当前包装更强 | Raltic 需要补模板和身份叙事 |

## 13. Raltic 进入市场策略

### 13.1 第一条 GTM 主线：Security-friendly coding-agent collaboration

目标不是“AI workforce for everyone”，而是：

**把个人 AI 编程能力变成团队可见、可检索、可交接、可撤权的协作能力。**

落地 use cases：

1. PR review agent
   把 PR link 扔进 `#engineering`，Claude/Codex reviewer 在本地读 repo，结果发回频道。

2. Incident/on-call agent
   运行在工程师机器或安全 sandbox，读 logs/runbooks，给出 triage，发回 `#ops`。

3. Research/competitive agent
   在 `#product` 里做竞品/文档/客户反馈梳理，输出留在频道。

4. Release checklist agent
   跟踪 task board、部署 checklist、rollback note，把状态公开。

5. Security review proof
   给 CISO 展示：code/key 不经 Raltic，只有 agent 主动发布的消息进入云端。

### 13.2 第二条 GTM 主线：Bring your own AI subscription

Raltic 可以避开“又一个 AI seat 订阅”的抗拒：

- 你已经在为 ChatGPT/Claude/Cursor/Codex 付费。
- Raltic 不 mark up model usage。
- Raltic 只卖 team coordination layer。

这对早期团队很有吸引力，因为他们已经有 AI 工具预算，但没有 AI 协作层预算。Raltic 的销售语言应该是：

**Stop buying another model wrapper. Make the agents you already pay for useful to the whole team.**

### 13.3 第三条 GTM 主线：Open/self-host path for regulated buyers

Raltic 不需要一开始就卖 full enterprise，但要把“未来能通过安全审查”的路径讲清楚：

- local bridge mode now
- self-host planned
- open repo
- D1/Workers architecture docs
- audit log roadmap
- team tier roadmap

这对 B2B devtool founder 很重要：他们不一定马上要 SOC2，但他们要能向客户解释“我们不会把客户代码交给新 AI 平台”。

## 14. 客户获取动作

### 14.1 立即补的资产

1. `Raltic vs Helio` comparison page
   重点不是贬低 Helio，而是清楚说：
   - Helio is for AI-native workforce creation.
   - Raltic is for secure BYO agent team chat.
   - If source-code locality matters, choose Raltic.

2. `Claude Code in team chat` page
   SEO and demo：
   - Claude Code results leave private terminal.
   - Team can inspect/search/reuse.
   - Code stays local.

3. `Codex in team chat` page
   对 OpenAI 生态用户：
   - Codex as teammate, not private session.
   - Can coexist with Claude.

4. `AI agent security review checklist`
   给买家发给 CISO：
   - where code lives
   - where keys live
   - what crosses network
   - how revoke works
   - what logs exist today vs roadmap
   - whether customer data is used for model training/research

5. `First agent playbooks`
   不是模板市场，先做 3 个：
   - PR reviewer
   - on-call triage
   - customer/competitor researcher

6. `Bring your repo` live demo script
   Helio 的 demo 页已经承诺在客户 repo 上展示真实 PR。Raltic 需要同等级的现场脚本：
   - 客户带一个小 repo 或 PR。
   - Raltic 让 Claude Code/Codex bridge agent 在本机读 repo。
   - 结果进入团队频道。
   - 现场 revoke machine key。
   - 断网或网络抓包证明 source/provider key 不进 Raltic cloud。

### 14.2 社媒内容节奏

Helio 现在的 LinkedIn 节奏很值得学：每条都讲一个 workflow。

Raltic 应每周至少发 5 类短内容：

- Monday: “One private AI chat that should have been a team artifact.”
- Tuesday: Claude Code/Codex in channel demo.
- Wednesday: security boundary explainer.
- Thursday: customer workflow teardown.
- Friday: build-in-public / changelog / pilot ask.

示例标题：

- “Your best Claude Code review is useless if it dies in one terminal.”
- “We put Codex and Claude in the same channel. They disagreed. The team shipped faster.”
- “What exactly does Raltic see when your local agent reads a repo?”
- “AI teammates are not enough. You need offboarding.”
- “The agent can work locally. The result can still be shared.”

### 14.3 Outbound 目标

优先找这些人：

- Founders/CTOs of devtool startups with 5-30 engineers.
- Teams posting about Claude Code/Codex adoption.
- Agencies doing AI implementation for clients.
- B2B SaaS teams writing public security docs.
- Communities around Claude Code, Codex, Cursor, OpenClaw, Hermes.

Outbound message 不要说“我们是 AI workspace”，而是说：

> Saw your team is using Claude Code/Codex. Quick question: are the useful outputs staying in individual terminals/chats, or do they become shared team context? Raltic makes those agents work in team channels while code and provider keys stay local.

### 14.4 Community / launch 渠道

适合 Raltic 的渠道：

- Hacker News: angle should be “local-first AI agent team chat”, not generic AI workspace.
- GitHub README / open-source demo.
- Product Hunt: only after demo video and comparison assets ready.
- AI engineering Discords.
- Claude Code / Codex community posts.
- Security/devtool founder Slack groups.
- LinkedIn posts targeting CISO-friendly AI adoption.

不建议先重金做：

- Broad paid ads for “AI teammate”.
- Generic AI tools directories without sharp differentiation.
- Enterprise analyst-style content before Team/audit features补齐。

## 15. 产品策略：从 Helio 学什么，Raltic 补什么

### 15.1 该学 Helio 的

1. **Role-specific teammate packaging**
   Raltic 的 agent 可以有 runtime，但用户更想创建“reviewer / researcher / on-call / designer”。

2. **Task ownership language**
   不只是 task board，而是 “agent claims work, updates thread, human closes”。

3. **Approval cards**
   高风险动作必须可见、可批准、可编辑。Helio 把它讲成“same as reviewing a PR”，很容易懂。

4. **AI-to-AI visibility**
   Helio 的 AI Channels 动作很聪明：用户不是只看最终答案，而是看 AI teammate 如何协作。Raltic 已有 channels/DMs 的基础，应把 agent-to-agent trace 变成产品亮点。

5. **场景页按一天讲故事**
   Raltic 可做 “A day with local coding agents in a secure engineering team”。

### 15.2 不该学 Helio 的

1. **过早泛化到所有职能**
   Raltic 当前最强不是 recruiting/email/meeting，过早跟会稀释工程安全优势。

2. **把 cloud autonomy 放在默认叙事中心**
   Raltic 的稀缺点是 local-first / BYO runtime；cloud agent 是降低门槛，但不能吞掉差异化。

3. **用 broad promise 替代 trust proof**
   Raltic 应继续保持“诚实披露”：什么已上线，什么是 roadmap。

### 15.3 近期产品缺口

优先级从高到低：

1. **Approval Card Lite**
   对外部发送、deploy、PR comment、connector write action 做统一 UI/事件模型。即使先是模拟/手动，也要形成用户心智。

2. **Agent Template Lite**
   reviewer、researcher、on-call 三个模板，覆盖 system prompt、默认 channels、task behavior。

3. **Activity / Audit Log Lite**
   不要等完整 enterprise audit。先展示：
   - agent joined/left
   - runtime selected
   - task claimed/updated
   - connector grant changed
   - machine key revoked

4. **Agent-to-agent thread visibility**
   明确展示“reviewer 和 researcher 如何协作”，这是 Helio 正在讲的点。

5. **Pilot onboarding checklist**
   让一个团队 20 分钟内跑通：
   - 创建 workspace
   - 邀请 2 人
   - 接入 Claude/Codex
   - 创建 reviewer
   - 在 channel 跑一次 PR review
   - revoke machine key

## 16. Messaging Tests

建议同时测试 6 条 messaging：

1. **Security wedge**
   - “Your AI agents can join the team without your code joining the cloud.”
   - 目标：CTO/CISO-minded buyer。

2. **Team knowledge wedge**
   - “Stop losing AI work in private chats.”
   - 目标：founder/product/engineering manager。

3. **BYO runtime wedge**
   - “Claude Code, Codex, OpenClaw, Hermes. One shared workspace.”
   - 目标：AI power users。

4. **No markup wedge**
   - “Use the AI subscriptions you already pay for.”
   - 目标：cost-sensitive startups。

5. **Agent roster wedge**
   - “One agent is a chatbot. A team of agents is a teammate.”
   - 目标：teams curious about multi-agent collaboration。

6. **Local-first wedge**
   - “The work happens locally. The team sees the result.”
   - 目标：engineering teams with repo/privacy blockers。

Review 判断：

- 如果 click/signup 来自 security wedge，Raltic 应继续深挖工程+trust。
- 如果来自 team knowledge wedge，补协作/搜索/任务故事。
- 如果来自 BYO runtime wedge，强化 runtime docs 和 one-line setup。

## 17. 30 / 60 / 90 天计划

### 0-30 天：重新占位

目标：让市场知道 Raltic 和 Helio 不一样。

动作：

- 发布 `Raltic vs Helio` 页面。
- 发布 `Claude Code in team chat` 和 `Codex in team chat` 页面。
- 发布 `AI agent security review checklist`。
- 首页首屏增加一句更锐利的 security/locality message。
- 做 3 个 60-90 秒 demo 视频，并沉淀可现场跑的 `bring your repo` demo 脚本：
  - local Claude reviewer in channel
  - Codex + Claude in same workspace
  - revoke machine key / code never uploaded / offline proof
- LinkedIn/X 开始每周 5 条 workflow posts。

成功指标：

- 10 个高质量 waitlist/pilot conversations。
- 3 个团队跑通 first agent workflow。
- 至少 1 篇第三方/社区收录明确提到 Raltic 的 local-first agent team chat。

### 31-60 天：补闭环

目标：让 trial 变成 repeat use。

动作：

- Agent Template Lite：reviewer / researcher / on-call。
- Approval Card Lite。
- Activity Log Lite。
- Pilot onboarding checklist。
- Raltic desktop/bridge onboarding friction review。
- 建立 `examples/` 或 docs 里的 playbooks。

成功指标：

- 5 个团队每周至少 3 天使用。
- 20+ agent-created team-visible artifacts。
- 至少 2 个团队愿意公开 quote 或匿名 case。

### 61-90 天：开始商业化验证

目标：验证谁愿意付钱。

动作：

- Team tier private pilot。
- 价格先不要复杂：按 active teammate 或 workspace pilot fee。
- Security review package。
- Self-host waitlist。
- 对已使用团队做 10 个 structured interviews。
- 打磨 comparison pages：Helio / Slack AI / ChatGPT Workspace Agents / Cursor。

成功指标：

- 3 个付费或 LOI。
- 1 个 self-host/security-sensitive design partner。
- 1 个 public case study。
- 形成明确 activation metric：例如 “first agent posts useful result in team channel within 15 minutes”。

## 18. 2026-06-03 Grok 深研补充：新增信息与策略校正

本节来自 2026-06-03 的 Grok gap-finding 二审，再用公开来源交叉验证。结论分三档：

- **已复核**：官网、产品页、demo 页、条款/隐私、app HTML/asset、TestingCatalog、Donnie Chu、腾讯新闻/硅星人Pro、YAAT 可以支持。
- **部分复核**：第三方实测或 app bundle 中出现，但官网没有完整公开说明。
- **Watchlist**：Grok 找到但当前环境无法直接复核到原帖或原始页面的信号，只用于后续监控。

### 18.1 Helio 不是纯 PLG：它是“自助注册 + founder-led repo demo”的混合漏斗

官网底部直接给出 `app.helio.im` 注册入口，并声称 workspace 一分钟可用；`app.helio.im/sign-up` HTML 可访问，且预连 `api.helio.im` 与 `clerk.helio.im`，说明它确实准备了自助账户入口。与此同时，`/book-a-demo/` 明确要求客户带 repo 或 bottleneck，Helio 团队会在 30 分钟 call 中把 team AI user 接入客户 stack，并展示真实 PR。

这说明 Helio 的早期获客不是单一路径：

- 对散户和 early adopter：给一个“60 秒 / 1 分钟进入 workspace”的低摩擦承诺。
- 对工程团队和潜在付费客户：用真实 repo、真实 PR、真实 workflow 做 assisted sales。
- 对媒体目录：TestingCatalog 以 sponsored 形式传播 “public beta / 60 seconds / zero code or deployment” 叙事，同时保留 Discord early-access 入口。

**对 Raltic 的策略校正**：不能只做 waitlist 或只做官网说明。Raltic 应该同时准备两个入口：

1. **Self-serve 15 分钟成功路径**：连接一个已有 Claude Code / Codex runtime，让 agent 在团队频道发出第一个有用结果。
2. **Founder-led Repo Clinic**：客户带一个 repo 或一个卡住的工程流程，Raltic 现场演示 agent 进频道、读取本地代码、产出可审阅结果、撤销 token、断网后证明代码仍未上传平台。

Helio 的 demo 证明“真实 repo”已经是这类产品的第一销售场景。Raltic 的区别不应是“我们也能做 PR”，而是“我们能证明代码、provider key、执行边界在哪里”。

### 18.2 BYOK / Pricing 只能作为中等可信信号，不能写成确定事实

Donnie Chu 文章称 Helio 当前有 BYOK、试用免费、正式 pricing on request，并按 user、deployment type、features 计费。`app.helio.im` 的前端 asset 中也能检索到 `BYOK`、`pricing` 等字符串。但 Helio 官网没有公开 pricing page，也没有公开完整 BYOK 文档；Terms 只保留未来收费、改价、发布价格表的权利。

**可信度**：中。它能说明 Helio 很可能在产品或销售流程中讨论 BYOK/定价，但不能证明公开套餐、价格、计费口径已经定稿。

**对 Raltic 的策略校正**：

- Raltic 可以说 “Helio 的外部观察显示 BYOK/on-request pricing，但官方 pricing 不完整”，不要说 “Helio 已明确如何收费”。
- Raltic 的核心话术应是 **BYOK 不等于 local execution**。客户真正关心的不只是 API key 由谁付费，而是 repo、shell、runtime、长期记忆和 tool call 发生在哪里。
- 对比页应拆开四个维度：`key custody`、`execution location`、`workspace filesystem`、`audit/revoke path`。Helio 可能有 BYOK，但其产品页同时写明 `/workspaces`、JuiceFS-backed filesystem、vault/KMS/OpenFGA，这更像云端 workspace/runtime；Raltic 要把 local bridge 的边界做成可验证 demo。

### 18.3 Donnie Chu 的实测补强了 Helio 的“低配置多 AI 协作”优势

Donnie Chu 的实测不是纯转述官网：它记录了四个 AI 在一个频道里串联完成 content pipeline，也记录了 PM/engineer/reviewer 针对一个真实 SaaS 约束给出技术优先级建议。这类内容对 Raltic 的威胁在于，它把 “AI colleague” 从抽象叙事落到了具体 workflow。

**对 Raltic 的策略校正**：Raltic 的内容不能停留在 “Claude Code / Codex in team chat”。必须发布可复现 playbook：

- `PR reviewer in channel`：agent 读本地 diff，频道里给 review，结果可搜索。
- `Incident triage`：agent 从 channel context、logs、repo 里定位问题，但 sensitive action 需要人批准。
- `Competitor researcher`：agent 分工检索、交叉验证、把证据链接发回频道。
- `Local revoke proof`：撤销本地 token 或断网后，展示平台无法继续读取 repo/provider key。

Helio 用低配置证明“AI 可以自己接工作”；Raltic 要用可审计边界证明“AI 可以安全地接工程工作”。

### 18.4 腾讯新闻/硅星人Pro 把 Helio 放在“Agent 原生 IM”市场里，而不是单一 coding-agent 市场

腾讯新闻转载硅星人Pro 的 2026-05-31 文章把 Helio、Bloome、Lucius 放在同一组讨论：当组织进入人 + Agent 混合状态后，传统 IM 是否仍然够用，Agent 原生协作空间、现有 IM 上的组织记忆层分别会成为路径。

该文对 Helio 的团队背景、融资、双地办公等说法属于第三方报道，当前没有在 Helio 官网获得独立确认，因此只能中等或偏低可信。但它对市场结构的价值较高：Helio 在中文圈被解释成“Agent 原生组织协作中心”，而不是单纯的 coding assistant。

**对 Raltic 的策略校正**：

- 不要把 Helio 简化成 coding-agent 竞品。它抢的是“组织协作中心”的定义。
- Raltic 不应立刻也讲“替代 Slack / 飞书 / 新 IM”。更好的切入是：**不要求团队迁移整个组织中心，先让已有 coding agents 在团队频道里安全协作**。
- 中文/亚太市场可以用更清晰的句子：`不是把公司搬进新 IM，而是先把 Claude Code / Codex 的工作结果变成团队可见资产。`

### 18.5 生态目录显示“AI teammate”叙事会快速商品化

YAAT 目录中，Helio 只是 teammate-first 产品之一，同页还出现 Hyperagent、Kollab、VM0、SureThing、Paperclip、Kylon、Loop、Team9、Vibe Forge 等不同形态。TestingCatalog 同一篇 Helio 文章的相关项里也出现 Alook 等 AI team orchestration 产品。

**对 Raltic 的策略校正**：`AI teammate`、`AI workforce`、`agent workspace` 会很快变成红海词。Raltic 不能把 moat 建在“AI 像同事”这句上，而要建在可验证的控制面：

- 多 runtime：Claude Code、Codex、OpenClaw、Hermes、本地或云端 agent。
- Local bridge：代码、文件、provider key 不必上传平台。
- Team visibility：agent 输出进入 channel，能搜索、交接、审计。
- Open/self-host path：安全敏感团队有采购理由。
- Revoke/audit demo：把信任从口号变成可演示动作。

### 18.6 Watchlist：Helio 可能在补 local/hybrid 能力

Grok 找到若干 X 信号，称 Helio 正在讨论 local machine connect、GitHub identity/PAT/vault、官方账号高频 workflow 视频等。但本轮复核中，X 页面只能返回 logged-out shell，搜索也没有稳定抓到这些具体帖文。因此这些不能写成已确认事实。

但这个 watchlist 对 Raltic 很重要：如果 Helio 后续补上 local machine bridge 或本地连接能力，Raltic 的 “local-first” 差异会被压缩。Raltic 不能只说 local，要证明：

- local execution 是默认路径还是附加模式。
- provider key 是否经过平台。
- repo/filesystem 是否进入云端 workspace。
- agent memory 和 artifacts 是否可审计、可删除、可迁移。
- self-host/open protocol 是否真实可用。

### 18.7 追加后的 GTM 优先级

基于 Grok 补充与交叉验证，Raltic 进入市场的优先级应调整为：

1. **先做 comparison page**：标题不要太攻击性，建议 `Raltic vs Helio: execution boundary, key custody, and team visibility`。核心表格只放可验证差异，不放泛泛功能比较。
2. **发布三条短 demo**：`Code stays local`、`Revoke proof`、`Claude Code/Codex in channel`。每条视频只证明一个 claim。
3. **做 Repo Clinic 获客**：每周固定 5 个 30 分钟 slot，目标是已有 Claude Code/Codex/OpenClaw/Hermes 使用者，而不是泛泛 AI productivity 用户。
4. **建立 security checklist**：把 Helio terms/privacy 中的 broad content license、model-training/research clause、cloud workspace/runtime、no public security page 变成客户采购 checklist，但语气要克制，避免无法证明的指控。
5. **进入目录与社区**：YAAT、TestingCatalog、GitHub README、X/LinkedIn、Discord/社区入口都要有。Helio 已经在目录/媒体做 sponsored 传播，Raltic 不能只靠官网自然曝光。
6. **避免泛化叙事**：短期不要说 “AI workforce”。说 `Your coding agents, in team chat. Code stays local.`，再用 playbook 扩展到 incident、research、ops。

## 19. Review：交叉验证结论

| 研究点 | 一手证据 | 外部证据 | 结论可信度 |
|---|---|---|---|
| Helio 定位为 AI-native team workspace / AI workforce | 官网、Product、Scenarios | WeFound、Donnie Chu、TestingCatalog | 高 |
| Helio 强调 AI colleague 而非 bot/sidebar | 官网直接文案 | 多篇第三方复述 | 高 |
| Helio 当前四个 live pillars | Product 页 | WeFound、Donnie Chu | 中高，功能深度未端到端验证 |
| Email preview / Meetings coming soon | Product/Scenarios | WeFound、Donnie Chu | 高 |
| Helio founder-led / assisted sales path | Book-a-demo 页 | Claude Code + Grok 二审一致指出 | 高 |
| Helio 工程楔子强度 | Book-a-demo、Product coding sessions | LinkedIn/Grok/Claude 二审 | 中高 |
| Helio 同名混淆风险 | helio-ai.com、LinkedIn helioai | 搜索结果与二审一致 | 高 |
| Helio privacy/terms trust friction | Privacy、Terms | Grok/Claude 二审一致指出 | 高 |
| macOS/Windows app 当前有安装包 | downloads feed | 官网下载 CTA | 高 |
| Helio self-serve + assisted sales 混合漏斗 | 官网 sign-up、app sign-up HTML、book-a-demo | TestingCatalog sponsored beta 文 | 高 |
| Helio beta 状态 | TestingCatalog、Donnie Chu | app 可访问、下载可用 | 中，第三方同时出现 invite-only / public beta / early access 表述 |
| GitHub identity / AI Channels / Helio Task 等近期动作 | LinkedIn | 部分与 app strings/官网叙事一致 | 中 |
| Pricing / BYOK | app asset 中有相关字符串 | Donnie Chu | 中，官网无公开 pricing page，不作为确定套餐结论 |
| Dream Cycle / permission granularity | 无完整官网文档 | Donnie Chu、TestingCatalog | 低到中，只作为产品方向观察 |
| Helio 团队/融资/双地办公 | 无官网确认 | 腾讯新闻/硅星人Pro | 中低，作为外部报道而非强事实 |
| Helio local/hybrid 补位信号 | 本轮未能复核具体 X 帖 | Grok watchlist | 低，只用于后续监控 |
| Agent-native IM / teammate 市场正在扩散 | YAAT、TestingCatalog 目录结构 | 腾讯新闻/硅星人Pro | 中高 |
| Raltic local-first / BYO runtime / provider keys stay local | 官网、Security 页、README | npm/GitHub package signals | 高 |
| Raltic Team tier/audit log still roadmap | Teams page、homepage pricing | local code comments | 高 |
| OpenAI/Slack 平台压力 | OpenAI Help、Slack official pages | 市场目录 | 高 |

## 20. 最终建议

Raltic 现在最重要的不是比 Helio 多讲几个 AI colleague 场景，而是把一个可防守的市场入口打穿：

**Secure agent team chat for teams already using Claude Code / Codex.**

Helio 的传播会教育市场：“AI 应该像同事一样在团队里工作。”
Raltic 应该接住这波教育，并回答更尖锐的问题：

- 这些 AI 同事到底在哪里执行？
- 它们能不能用我已有的 Claude Code / Codex？
- 它们读 repo 时，代码会不会进你的云？
- 它们发了什么，团队能不能看见、搜索、交接？
- 人离职、机器丢了、connector 要撤权，怎么处理？

这套问题比 “AI workforce” 更窄，但更接近付费和安全审查。Raltic 应先赢这群用户，再向 Helio 的 broad workforce 场景扩张。

建议 Raltic 接下来 30 天的唯一战略口号：

> Your coding agents, in team chat. Code stays local.

如果要中文化：

> 让 Claude Code 和 Codex 进团队频道，但代码留在本地。
