# Future Workspace, AI-Native Teams, and Raltic Positioning

研究日期：2026-06-04
研究问题：面向未来的 Workspace 是否还需要 IM / chat？Raltic 是否应该定位为 AI-native 团队用 agent 构建业务流程的 workspace？

## 1. 结论

用户的修正是对的：Raltic 不应该被窄化成“工程团队 chat”，更合理的第一性定位是：

**Raltic 是 AI-native 团队构建、运行、协作和治理 agent workflow 的 workspace。**

但是，这不意味着 IM / chat 形态会消失。更准确的判断是：

**未来 Workspace 仍需要 chat，但 chat 不再是产品本体；它会变成 workflow room、agent run log、human approval、exception handling 和团队语境同步的界面之一。**

也就是说：

- 旧形态：team chat 是工作发生的地方。
- 过渡形态：AI agent 进入 team chat。
- 未来形态：agent workflow 是工作本体，chat/channel 是人类监督、协作、决策和例外处理的房间。

Raltic 如果继续只说 “team chat where AI agents are first-class teammates”，会低估未来 Workspace 的重心。更好的叙事是：

> The workspace where AI-native teams design, run, and govern agent workflows.

中文：

> 给 AI-native 团队构建、运行和治理 Agent 工作流的 Workspace。

## 2. 外部证据：大平台都在从 chat 走向 agent workflow

### OpenAI：Workspace Agents 是 workflow，而不是单纯聊天

OpenAI 的 Workspace Agents 页面直接说 agents 可以 “take on entire workflows”，帮助团队运行 long-running、multi-step workflows，并提供 role-based access control、audit logs、monitoring。

Help Center 也说明 Workspace Agents 可以连接 apps/tools/custom MCP/files、发布到 team directory、接入 Slack channel、按 schedule 运行。

证据：

- `https://openai.com/business/workspace-agents/`
- `https://help.openai.com/en/articles/20001143-chatgpt-workspace-agents-for-enterprise-and-business`

判断：OpenAI 没有把未来 workspace 定义成“聊天更智能”，而是把 ChatGPT sidebar、team directory、Slack channel、schedule、tools、audit log 组合成 agent workflow surface。

### Slack：chat 仍是入口，但 agent 嵌入 flow of work

Slack 的 AI agents 页面强调 custom Slack AI assistants、third-party assistants 和 Slack API。Slack Help 明确用户可以像给人或 Slackbot 发消息一样和 agent/assistant 对话，并在 split view 或 app messages tab 中使用。

证据：

- `https://slack.com/ai-agents`
- `https://slack.com/help/articles/33076000248851-Work-with-AI-agents-and-assistants-in-Slack`

判断：Slack 证明 chat 不会立刻消失，因为它已经是企业用户的协作肌肉记忆、权限边界和通知/审批场。但 Slack 也在把 chat 变成 agent 的 conversational surface，而不是完整 workflow system。

### Microsoft：未来组织是 human-agent teams，核心是 workflow redesign

Microsoft 2025 Work Trend Index 把未来组织称为 Frontier Firm：phase 2 是 agents 作为 digital colleagues 加入团队，phase 3 是 humans set direction for agents that run entire business processes and workflows。

Microsoft 2026 Work Trend Index 更进一步：Frontier Professionals 的特征包括使用 agents 做 multi-step workflows、构建 multi-agent systems、重新设计 workflow，并把 agent workflows、human handoffs、quality standards 文档化和可重复化。

Microsoft 官方博客还把工作模式分为 Author / Editor / Director / Orchestrator，其中 Orchestrator 是 humans 设计多个 agent 并行运行的 workflow，由系统标记 exceptions 和 escalations。

证据：

- `https://www.microsoft.com/en-us/worklab/work-trend-index/2025-the-year-the-frontier-firm-is-born`
- `https://www.microsoft.com/en-us/worklab/work-trend-index/agents-human-agency-and-the-opportunity-for-every-organization`
- `https://blogs.microsoft.com/blog/2026/05/05/how-frontier-firms-are-rebuilding-the-operating-model-for-the-age-of-ai/`
- `https://blogs.microsoft.com/blog/2026/04/21/accelerating-frontier-transformation-with-microsoft-partners/`

判断：Microsoft 的方向不是“更好的 Teams 聊天”，而是 identity、governance、observability、agent control plane、workflow orchestration。chat 是 flow of work 的一部分。

### Atlassian：真正的 moat 是 Teamwork Graph

Rovo 文档把产品分成 Find / Learn / Act：search、chat、agents。Teamwork Graph 新闻稿明确说 agentic work 的基础是连接 people、work、goals、code、content 的 context engine，并通过 MCP / CLI 给 Claude Code、Codex 等 coding agents 使用。

证据：

- `https://support.atlassian.com/rovo/docs/what-is-rovo/`
- `https://www.businesswire.com/news/home/20260506556902/en/Atlassian-Opens-Up-Its-Teamwork-Graph-to-Power-Agentic-Work-Across-the-Enterprise`

判断：Atlassian 的底层逻辑不是 IM，而是 work graph。chat 是对 work graph 的一种访问方式，agent 是执行方式。

### Asana：AI Studio + AI Teammates 是 workflow-first

Asana AI Studio 是 no-code builder，用来 design AI-powered workflows，并直接部署到 Asana 工作流里。Asana 明确说 AI Studio automates workflows，AI Teammates collaborate on complex projects。

证据：

- `https://asana.com/product/ai/ai-studio`
- `https://help.asana.com/s/article/ai-teammates`

判断：Asana 对未来 workspace 的定义更接近“AI 增强的 work management system”，而非 chat。

### Notion：Agent 运行在 docs/databases/workspace context 里

Notion Custom Agents 页面强调 recurring work、triggers/schedules、existing docs/databases as context、Slack/Mail/Calendar/MCP integrations、agent permissions、audit trails、reversible changes。

证据：

- `https://www.notion.com/en-gb/product/agents`

判断：Notion 的 agent workspace 不是 IM，而是 docs + databases + workflow + connected tools。Slack 是连接项之一，不是本体。

### Google Workspace Studio：用自然语言创建流程，输出进入 Chat/Gmail/Drive

Google Workspace Studio 的定位是 “AI-powered automation”，让用户用自然语言创建 flows，管理活动，不离开 Gmail、Chat、Drive。示例包括将 meeting action items 发到 Chat、在 Gmail 中保存附件到 Drive、处理邮件优先级。

证据：

- `https://workspace.google.com/studio/`

判断：Google 也把 Chat 作为 workflow 的一个 output/notification surface，而不是唯一 workspace。

## 3. 为什么未来仍然需要 chat / IM

Chat 不会消失，原因不是“人喜欢聊天”，而是它承担了其他工作流界面很难替代的功能。

### 3.1 Chat 是最低摩擦的人类意图输入

人类很多工作一开始不是结构化任务，而是模糊意图：

- “帮我看下这个客户是不是值得跟进。”
- “这个 PR 有没有风险？”
- “这周哪些 launch 风险最大？”
- “这件事交给谁？”

Agent 可以把模糊输入转成 workflow spec，但初始入口仍然很适合 chat。

### 3.2 Chat 是团队共享语境和承诺场

工作不只是执行任务，还包括：

- 谁知道什么？
- 谁认可这个方向？
- 谁做了判断？
- 为什么这个决定被接受？
- 哪个 agent 的输出被人类确认？

这些语境天然适合在 channel / thread 中出现。未来的 channel 不只是聊天流，而是 decision log + context room。

### 3.3 Chat 是 human-in-the-loop 的自然界面

Agent workflow 会经常遇到：

- approval
- exception
- escalation
- ambiguity
- policy violation
- low-confidence output

这些节点需要人类介入。Chat/channel 是最自然的 interrupt surface。

### 3.4 Chat 是跨工具通知和状态同步层

即便 workflow 本体在 task graph / database / code repo / CRM 里，团队也需要一个地方知道：

- agent 开始了什么 run
- 哪一步失败了
- 哪个 action 等待批准
- 哪个客户/PR/incident 有变化
- 哪个 agent 需要上下文

这不是传统聊天，而是 activity stream + notification + exception queue。

## 4. 为什么纯 IM 形态不够

虽然需要 chat，但如果 Raltic 只是“Slack for agents”，会不够。

### 4.1 Chat 流无法表达 workflow state

Agent-native 团队需要看到：

- run status
- step trace
- SLA
- owner
- retry
- approval state
- tool calls
- artifact
- cost
- policy violations

这些不适合埋在消息流里，必须有 run table、workflow canvas、task graph、approval queue。

### 4.2 Chat 不能替代 repeatable workflow

AI-native 团队不是每天重复 prompt，而是把 prompt 固化成 workflow：

- trigger
- context
- agent role
- tool permission
- output format
- human handoff
- quality bar
- audit log

所以 Raltic 的核心不应是“agent 可以在频道里说话”，而是“频道里的协作可以沉淀成可复用 workflow”。

### 4.3 Chat 对 agent 来说不是最佳工作界面

Microsoft 的观点很关键：软件以前假设 primary user 是人，所以 UI 要 discoverable / learnable。Agent 不需要菜单。Agent 更需要：

- API
- tool schema
- state graph
- permissions
- context store
- evaluations
- traces

因此未来 workspace 要同时服务 humans 和 agents：人用 chat/room/dashboard，agent 用 API/protocol/context graph。

## 5. Raltic 应该押的产品形态

Raltic 应从 “agent team chat” 升级成：

**Agent Workflow Workspace for AI-native teams**

或：

**Agentic Work OS for teams that build business workflows with AI agents**

中文：

**给 AI-native 团队构建业务 Agent 工作流的协作工作台。**

### 核心产品 primitives

Raltic 应围绕这些对象组织产品，而不是只围绕 messages：

1. **Workspace**
   团队、权限、成员、agent、connector 的组织边界。

2. **Agents**
   有身份、runtime、tools、memory、permissions、owner、status。

3. **Workflow Rooms / Channels**
   不是普通聊天频道，而是一个业务流程或问题域的协作房间，例如 `#customer-research`、`#release`, `#incident`, `#sales-intel`。

4. **Workflows**
   可复用流程定义：trigger、context、agent chain、approval、output、destination。

5. **Runs**
   每次 agent 执行的实例：状态、步骤、日志、成本、输出、失败原因。

6. **Approvals**
   人类介入点：approve、reject、edit、assign、escalate。

7. **Artifacts**
   agent 产出的报告、PR、draft、分析、任务、决策记录。

8. **Context / Memory**
   团队知识、频道历史、文档、repo、CRM、task board、外部工具。

9. **Governance**
   permissions、audit、revocation、data boundary、policy、evals。

### Chat 在这里的角色

Chat 不应被删掉，但应被重新定义：

> Channel is the room where humans direct agents, agents report runs, and the team resolves exceptions.

中文：

> 频道不是聊天流，而是人类指挥 Agent、Agent 汇报执行、人类处理例外的工作房间。

## 6. Raltic 相对大平台的机会

大平台的趋势已经很清楚：OpenAI、Microsoft、Google、Notion、Asana、Atlassian 都会做 agent workflow。但 Raltic 仍有机会，因为它可以做它们难以同时满足的中立层。

### 6.1 Neutral agent workspace

大平台会把 agent 绑在自己的 suite 里：

- OpenAI：ChatGPT / Slack
- Microsoft：M365 / Teams / Agent 365
- Google：Gmail / Chat / Drive
- Notion：Notion docs/databases
- Asana：Asana work graph
- Atlassian：Jira/Confluence/Teamwork Graph

Raltic 可以做跨 runtime、跨工具、跨工作流的 neutral workspace。

### 6.2 BYO runtime / BYO agent

AI-native 团队会同时使用 Claude Code、Codex、Cursor、OpenClaw、Hermes、自研 daemon、MCP servers。Raltic 的优势是把这些 agent 纳入同一个 workspace，而不是让它们困在不同工具里。

### 6.3 Local / self-host / security boundary

Agent 越能执行真实业务流程，安全和治理越重要。Raltic 的 local bridge、自托管路径、provider-key locality、execution boundary 可以成为差异化。

### 6.4 Workflow rooms for small AI-native teams

Microsoft/Atlassian 更适合大企业。Helio 更像 broad AI workforce workspace。Raltic 可以先服务：

- AI-native agency
- product studio
- devtool / B2B SaaS startup
- research/ops-heavy small teams
- 用 agent 跑业务流程的 founder team
- 需要把 Claude Code / Codex / internal agents 接进协作流程的团队

这比“工程团队”更宽，但仍然比“所有知识工作者”更窄。

## 7. 对 Raltic 当前叙事的修正

旧叙事：

> Team chat where AI agents are first-class teammates.

问题：容易被理解成 Slack/Discord/Helio 的变体。

建议叙事：

> Raltic is the workspace for AI-native teams to build and run business workflows with agents.

中文：

> Raltic 是 AI-native 团队用 Agent 构建和运行业务流程的 Workspace。

更短：

> Build your business with agents. Keep humans in control.

或：

> Where agent workflows become team operations.

中文：

> 让 Agent 工作流变成团队业务系统。

### 首页首屏建议

H1:

> The workspace for AI-native teams and their agents.

Subhead:

> Design workflows, run agents, approve actions, and keep every decision visible. Raltic gives your team workflow rooms where humans set direction and agents execute.

中文：

> 给 AI-native 团队和 Agent 的工作空间。
> 在 Raltic 里设计工作流、运行 Agent、审批动作、沉淀决策。人类负责方向和判断，Agent 负责执行和反馈。

### 频道/IM 的新命名

不要只叫 “team chat”。可以叫：

- Workflow Rooms
- Agent Rooms
- Run Rooms
- Operations Channels

解释：

> A room is not just a chat. It contains messages, agent runs, approvals, tasks, artifacts, and memory.

## 8. 产品方向建议

### 保留

- Channels / rooms
- @mention agent
- shared messages
- real-time collaboration
- local bridge / BYO runtime
- agent identity

### 加强

- workflow templates
- run history
- approval queue
- artifact library
- agent permissions
- run trace
- business process dashboard
- team memory / context map

### 降低优先级

- 只做更漂亮的 IM
- 只强调 Claude Code / Codex
- 只做 security/local-first 页面
- 只和 Helio 比“谁更像 AI 同事”

## 9. 最终判断

未来 Workspace 仍需要 IM / chat，但不需要一个“只是聊天”的新应用。

它需要的是：

**workflow-first, chat-assisted, agent-native workspace.**

Raltic 的机会不是替代 Slack，也不是成为另一个 Helio。Raltic 应该成为 AI-native 团队的 agent workflow workspace：

- Chat 是人类和 agent 的协作房间。
- Workflow 是业务执行的核心。
- Agent 是新的执行者。
- Human approval 是治理边界。
- Context graph 是长期壁垒。
- Local/open runtime 是 Raltic 的差异化入口。

因此，Raltic 的产品和叙事都应从 “AI agent team chat” 升级为：

> Agent workflow workspace for AI-native teams.
