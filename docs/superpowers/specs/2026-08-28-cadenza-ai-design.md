# @gedatou/cadenza-ai 设计

日期：2026-08-28
状态：已批准（2026-08-28 用户裁定 Q1 纯 BYOK / Q2 v1 线性 / Q3 `@gedatou/cadenza-ai`；三路独立设计 → 两位评审打分 → 合成 → 三位对抗校验者逐条核对源码与家法后的修订版）

> 引用约定：`$TS` = `@tanstack/*` 包源码（`@tanstack/ai` 0.51.0、`ai-client` 0.29.1、`ai-react` 0.22.3、`ai-persistence` 0.5.3，路径相对 `node_modules/@tanstack/`）；`$PI` = `@earendil-works/pi-*` 0.84.3；`$CZ` = 本仓库。行号是本次研究时的快照，实施时以源码为准。
> 研究底稿（六份报告 + 批评稿 + 三份设计稿 + 两份评审 + 三份校验）在会话 scratchpad `research/` 与 `design/` 下，本文只保留裁定与依据。

## 背景与目标

用户原话：「阅读一下 tanstack ai 的 sdk，我们需要一个 docs，基于 tanstack 和我们的组件实现一个具备所有功能点的会话，期望是能够接入所有提供者，可以参考一下 pi agent 的架构模式，设计方案」。

研究结论（决定本设计形状的五个事实）：

1. **TanStack AI 0.51 给了运行时，没给产品面**。它有 `useChat`/`ChatClient`（消息状态机、队列、interrupt 审批、连接适配器、BYOK 头、单线程持久化）、AG-UI 事件流、`chat()` agent loop、13 个可在 Vercel Node runtime 跑的 chat adapter。它没有：模型目录元数据（`ModelMeta` 不导出）、跨 provider 的思考强度抽象、会话列表（存储只有 `getItem/setItem/removeItem`）、渲染器注册表、usage 落地（客户端 processor 丢弃 `RUN_FINISHED.usage`）、附件上传链路、产品级 Markdown、脚本化假流。`@tanstack/ai-react-ui` 是示例级（`Chat` 不透传 `threadId/persistence/forwardedProps`，`ChatMessage` 默认纯文本，`ChatInput` 单行 input），不能复用。
2. **pi 恰好在这些空白处有成熟模式**（`$PI` 报告 §6 的 8 个模式）：纯数据模型目录 + 同步读、CredentialStore 语义、thinking 三层归一、双容器流式渲染、按名注册渲染器、metadata/data 分离的存储、树形会话、faux provider。本设计逐个落到文件与导出（§架构分层 表），TanStack 已覆盖的一行不重造。
3. **仓库先例 = `@gedatou/cadenza-form`**：上游作 dependency、`export *` 全量转发、家法做成默认、使用方只装门面（`$CZ/packages/form/package.json:41-43`）；docs 指南页骨架 hero → 使用 → 思路 → 解剖 → 逐特性 → API。
4. **两个源码级陷阱决定了 demo 与 BYOK 的选型**：`stream()` 连接适配器的 factory 只收 `(messages, data, signal)`，`runContext`（含 `resume`/`parentRunId`）被丢（`$TS/ai-client/src/connection-adapters.ts:2493-2506`）→ 审批回路的脚本化 demo 只能走 `useChat({ fetcher })`（`fetcherToConnectionAdapter` 把 `threadId/runId/parentRunId/resume` 完整交给 `ChatFetcher`，`:2523-2555`）；`ByokClient.prepare(provider)` 在「无 key 且无 coverage」时弹窗并抛 `ByokBlockedError`（`$TS/ai-client/src/byok/client.ts:163-175`），每次发送前必跑 → 无 key 也能跑的 provider（vertex/ollama）必须经 `setServerCoverage` 放行。
5. **docs 站现状**：Next 16 + fumadocs headless，部署 Vercel，route handler 先例只有 `app/api/search`，无任何 env/密钥先例；`/api/*` 不经 i18n proxy；`pnpm-workspace.yaml` catalog 无任何 `@tanstack/ai*`。

目标：

- 新包 `@gedatou/cadenza-ai`（`packages/ai`）：TanStack AI React 的薄门面 + 五个自建缺口 + 只组合 `@gedatou/cadenza-ui` 的会话视图；`./server` 与 `./providers/<id>` 子入口把 13 个 provider 经官方 BYOK relay 形态接入。
- 新 docs 分区 `docs/content/docs/ai/`：7 页 zh/en，32 个 demo 全部无密钥可跑（脚本化 transport），一页 Playground 走真实 route handler + 浏览器 BYOK。
- 覆盖 feature-checklist §3 的 **Core 31/31** 与 **Standard 40/46**（矩阵见 §功能覆盖），其余 6 项在 API 表点名并说明为什么不做。

## 非目标（v1）

- 不做分支树（Q2 裁定：v1 线性编辑重发；v2 路线与数据迁移见附录 B）。
- 不接 `@tanstack/ai-durable-stream`；Vercel serverless 上 `memoryStream` 是单进程实现（`$TS/ai/src/stream-durability.ts:325-330` 注释），`createChatHandler` 留 `durability` 口，docs 不开。
- 不做浏览器直连 provider（OpenAI/Anthropic SDK 需 `dangerouslyAllowBrowser`，Bedrock/MCP/harness 类不可）。
- 不接 harness 类 adapter（`claude-code`/`acp`/`codex`/`opencode`/`grok-build`）：需 `@tanstack/ai-sandbox`（`$TS/ai-claude-code/src/adapters/text.ts:184-188` 无 sandbox 直接抛错），且 key 只从宿主 `process.env` 复制（`:125-132`），BYOK 不通。`providers` 页写明。
- 不复制任何 shadcn/primitives 样式进 cadenza-ai；需要而未提升的 primitives 走前置提升 PR（§分阶段计划 Phase 0）。
- 不做 realtime 语音、MCP Apps、图像/视频生成、服务端转写以外的「生成家族」页面；只在 API 表点名（O8）。
- 不做浏览器内文档抽文本（pi P28 的 pdfjs 路线）：TanStack 原生 `DocumentPart` 直接给支持 `document` 模态的模型；不支持的模型由 `Model.input` 门控。
- 不引入 zod 作为包运行时依赖（`forwardedProps` 校验手写；schema 走 Standard Schema 由使用方带）。
- 不做 `Provider.runtime: 'edge'`（frame F3 有此值）：bedrock/ollama/vertex 不能跑 edge，docs 亦无 edge 先例；类型只保留 `'node' | 'local'`。

## 形态：门面包 + 三个子入口

| 入口 | 内容 | `'use client'` |
|---|---|---|
| `@gedatou/cadenza-ai` | `export * from '@tanstack/ai-react'` + `@tanstack/ai-client/byok` 的 `defineByok/passkeyStorage/memoryStorage/defaultByokStorage/isPasskeyStorageSupported` 转出（ai-react 根入口只转 `useByok`，`$TS/ai-react/src/index.ts:1-70`）+ `@tanstack/ai/client` 的 `toolDefinition/EventType/generateMessageId/parsePartialJSON/fromSpecTokenUsage` 与 `AnyClientTool/InferToolInput/InferToolOutput/ThinkingPart` 类型转出 + 目录 / 运行时惯例 / 视图组件 | 有（bundle banner；`view/*.tsx`、`runtime/*.ts(x)` 中含 hook/事件的文件顶部也自带指令——dev 下 docs alias 直读 src，RSC 误导入即炸） |
| `@gedatou/cadenza-ai/server` | `createChatHandler`、`createCatalogHandler`、`createTranscriptionHandler`（P3）、`ProviderPreset`、`definePreset`、`pickSelection`；转出 `chat/toolDefinition/chatParamsFromRequest/mergeAgentTools/toServerSentEventsResponse/memoryStream/maxIterations`（`@tanstack/ai`）、`getByokKey/byokMissing`（`@tanstack/ai/byok/server`）、`defineByokProvider`（`@tanstack/ai/byok`） | 无 |
| `@gedatou/cadenza-ai/providers/<id>` | 每 provider 一个 `ProviderPreset` 常量，**只 import 自己的 `@tanstack/ai-<id>`**（pi P1 per-provider factory）；adapter 包全部 optional peer | 无 |
| `@gedatou/cadenza-ai/mock` | `scripted()` 脚本化 `ChatFetcher` + 步骤 DSL | 有（只依赖 `@tanstack/ai/client` 浏览器子集） |

- 上游 `@tanstack/ai`、`ai-client`、`ai-react` 是 **dependency**（form 先例）；`@tanstack/ai-persistence` 是 optional peer（只在 `createChatHandler({ persistence })` 路径动态 import）。
- `@gedatou/cadenza-ui` 是 peer（Base UI / Tailwind token 单实例）。
- 计数口径：**12 个带数据的 provider**（openai / anthropic / gemini / grok / groq / mistral / openrouter / vercel-gateway / llmgateway / bedrock / vertex / ollama）+ `openai-compatible` 工厂 = **13 个 preset**；`byteplus` 预留位 = **14 个 `providers/*.ts` 文件与 14 条 alias**；docs route 在 Vercel 上注册 13 − ollama = **12**。
- 本包新增导出**不与上游同名**（form 先例只覆盖 `createFormHook`；本包一个都不覆盖）：组件不叫 `TextPart` 叫 `Markdown`，不叫 `ToolCall` 叫 `ToolCallCard`；类型 `UIMessage`/`ToolCallPart` 等留给上游。
- 命名与 cadenza-ui 家族不撞前缀：cadenza-ui 有 `Message*`（`Message/MessageContent/MessageFooter/MessageAvatar/MessageGroup/MessageHeader`），本包的会话行家族叫 **`Transcript*`**（`Transcript/TranscriptProvider/TranscriptMessage/TranscriptParts/TranscriptActions/TranscriptAction/TranscriptEmpty/TranscriptError/TranscriptPending`）。

## 架构分层

```
┌──────────────── docs 站（Next 16 / Vercel Node runtime）────────────────────────┐
│ content/docs/ai/*.mdx        ── <ComponentPreview name="ai/*">                   │
│ demos/ai/*.tsx               ── import '@gedatou/cadenza-ai' + '/mock'          │
│ app/api/ai/{chat,catalog}/route.ts ── import '/server' + '/providers/<id>'      │
└────────┬───────────────────────────────────────────┬────────────────────────────┘
         │ 客户端                                     │ 服务端（无 'use client'）
┌────────▼──────────────────────────┐   ┌────────────▼──────────────────────────┐
│ @gedatou/cadenza-ai（root）        │   │ @gedatou/cadenza-ai/server            │
│  L1 catalog   纯数据 Model/Provider │   │  pickSelection 白名单 → preset 选择   │
│  L2 runtime   线程索引/选择/usage/  │   │  → getByokKey/byokMissing → create    │
│               附件/渲染器注册表      │   │  → resolveThinking → chat()           │
│  L3 view      只组合 cadenza-ui     │   │  → toServerSentEventsResponse         │
└────────┬──────────────────────────┘   └────────────┬──────────────────────────┘
┌────────▼──────────────────────────┐   ┌────────────▼──────────────────────────┐
│ @gedatou/cadenza-ai/mock          │   │ @gedatou/cadenza-ai/providers/<id>    │
│  scripted(script) → ChatFetcher   │   │  create(model,key) / thinking(level)  │
└────────┬──────────────────────────┘   └────────────┬──────────────────────────┘
         ▼                                            ▼
 @tanstack/ai-react → ai-client → @tanstack/ai/client        @tanstack/ai · @tanstack/ai-<id>（optional peer）
 @gedatou/cadenza-ui（peer）· streamdown + @streamdown/{code,math,cjk}
```

依赖方向：docs → cadenza-ai → (cadenza-ui, @tanstack/ai-react, streamdown)；`server` → `@tanstack/ai`；`providers/<id>` → `@tanstack/ai-<id>`。**root 入口永不 import 任何 adapter 包**（浏览器 bundle 不能背 `openai` SDK；SDK 有浏览器守卫）。catalog 数据本包维护，adapter 的 `XXX_CHAT_MODELS` 只在测试里做漂移校验（§测试）。

| 层 | 职责 | 不负责 |
|---|---|---|
| L1 `catalog`（同构纯数据） | `Model`/`Provider`/`ThinkingLevel` 类型与数据、`supportedThinkingLevels`/`clampThinkingLevel`、`estimateCost`、`modelRef/parseModelRef` | 网络、SDK |
| L2 `runtime` | 线程索引、模型选择、usage 采集、附件草稿 → `ContentPart`、渲染器注册表、编辑重发/复制/导出的纯函数 | 传输（交给 `useChat`） |
| L3 `view` | 用 cadenza-ui 部件组合出 Transcript / Composer / ThreadList / ModelPicker / ByokKeyDialog 等 | 状态（全部来自 `useChat` 返回值与 L2） |
| `mock` | 把脚本 DSL 变成 `ChatFetcher` | 任何真实模型 |
| `server` | AG-UI 请求解析、白名单、BYOK relay、preset 选择、thinking 翻译、SSE 响应、catalog/coverage GET | UI |
| `providers/<id>` | 一个 provider 的 `create(model, key)` + `thinking(level, model)` | 目录数据（从 catalog 引） |

pi 模式 → 落点：

| pi 模式（出处） | 本设计落点 | TanStack 已覆盖、不重造 |
|---|---|---|
| P1/P2 纯数据目录 + 同步读（`$PI/pi-ai/dist/models.d.ts:101-145`） | `catalog/*`：`providers`、`createCatalog()`、同步 `getModel` | `createModel/extendAdapter` 只管类型 |
| P6 thinking 三层归一（`types.d.ts:24-26`、`models.d.ts:193-194`） | `ThinkingLevel` → `Model.thinkingLevels` → `preset.thinking(level, model)`；`supportedThinkingLevels/clampThinkingLevel`（pi 同义，去掉 `get` 前缀）同构，UI 与服务端共用 | 无 |
| P7/P30 凭据层：存了就拥有、env 兜底、缺 key 阻断发送并弹窗 | `ByokClient` 全权 + `createByok({ persistent, catalog })` + `ByokKeyDialog` 订阅 `snapshot.prompt`；server `getByokKey` 头优先 env 兜底（`$TS/ai/src/byok/get-key.ts:13-27`） | `defineByok/KeyringStorage/passkeyStorage/setServerCoverage` 全部复用；**不做**保存前探测（靠 401 `byok_missing` 回路） |
| P10 faux provider（`$PI/pi-ai/dist/providers/faux.d.ts:63-72`） | `./mock` 的 `scripted()`（事件级 DSL，因为 TanStack 的 7 态工具状态机只能靠事件序列驱动） | `createReplayStream/ChunkRecording` 做录制回放 |
| P23 稳定列表 + 流式容器（`AgentInterface.ts:275-295`） | `TranscriptMessage` 按 `message` 引用 `memo`；正在流的最后一条自然是唯一变化项 | `StreamProcessor` 已折叠成 `UIMessage[]` |
| P26 按名注册渲染器（`tools/renderer-registry.ts:9-23`） | `definePartRenderers({ toolCall: { byName } })` + `PartRenderersProvider`（context，不用 pi 的全局 Map——docs 一页多 demo 不串台） | `ai-react-ui` 的 render-prop 不复用 |
| P27 IME / Enter / 拖放 / 粘贴（`MessageEditor.ts:64-229`） | `Composer` 内建 | 无 |
| P29 metadata 与 data 分离（`sessions-store.ts:10-35`） | `createThreadIndex()`（索引，localStorage）+ TanStack `indexedDBPersistence`（正文） | `indexedDBPersistence` 复用 |
| P16 树会话 / P17 compaction | v2（附录 B） | `summarize()` 可做压缩 |
| P24 自动滚动状态机 | 不自建：`MessageScrollerProvider autoScroll` | shadcn headless 已覆盖 |
| P12 队列 / P14 钩子 / P15 代理 | 不自建 | `QueueConfig`、interrupt、`fetchServerSentEvents` |

## 包工程

### 目录树

```
packages/ai/
├── package.json  tsdown.config.ts  tsconfig.json  README.md  styles.css
├── src/
│   ├── index.ts                    # root：export * from '@tanstack/ai-react' + 转出 + 下面全部
│   ├── catalog/
│   │   ├── types.ts                # Model / Provider / ThinkingLevel / ModelCost
│   │   ├── catalog.ts              # createCatalog / modelRef / parseModelRef
│   │   ├── thinking.ts             # THINKING_LEVELS / supportedThinkingLevels / clampThinkingLevel
│   │   ├── cost.ts                 # estimateCost
│   │   ├── providers/              # 每 provider 一个纯数据文件（openai.ts anthropic.ts … ollama.ts openai-compatible.ts）
│   │   └── index.ts                # providers 常量表 + defaultCatalog
│   ├── runtime/
│   │   ├── threads.ts              # createThreadIndex / useThreadIndex / threadPersistence / groupThreadsByDay / threadTitleFrom
│   │   ├── selection.ts            # useModelSelection
│   │   ├── usage.ts                # useUsageTracker
│   │   ├── renderers.tsx           # definePartRenderers / PartRenderersProvider / usePartRenderers / PartLabels
│   │   ├── attachments.ts          # fileToContentPart / useAttachmentDraft / DEFAULT_MAX_ATTACHMENT_BYTES
│   │   ├── messages.ts             # messageText / messagesToMarkdown / editAndResend / isThinkingComplete / sourcesOf
│   │   ├── byok.ts                 # createByok / useServerCoverage
│   │   └── stored-state.ts         # useStoredState
│   ├── view/
│   │   ├── transcript.tsx          # TranscriptProvider / Transcript / TranscriptMessage / TranscriptParts / TranscriptActions / TranscriptAction / TranscriptEmpty / TranscriptError / TranscriptPending
│   │   ├── markdown.tsx            # Markdown（streamdown 包装）
│   │   ├── reasoning.tsx           # Reasoning
│   │   ├── tool-call.tsx           # ToolCallCard / ToolCallGroup
│   │   ├── approval.tsx            # ApprovalActions / ApprovalApprove / ApprovalDeny
│   │   ├── media-part.tsx          # MediaPart
│   │   ├── sources.tsx             # Sources
│   │   ├── structured-output.tsx   # StructuredOutput
│   │   ├── composer.tsx            # Composer 家族
│   │   ├── suggestions.tsx         # Suggestions / SuggestionsItem
│   │   ├── queue.tsx               # QueueList
│   │   ├── model-picker.tsx        # ModelPicker / ThinkingLevelPicker
│   │   ├── thread-list.tsx         # ThreadList 家族
│   │   ├── byok-key-dialog.tsx     # ByokKeyDialog / ByokKeyDialogProvider
│   │   └── context-usage.tsx       # ContextUsage（P2，需提升 progress）
│   ├── mock/
│   │   ├── index.ts                # scripted / sequence / respond / echo / approvalOf / clientResultOf / byokMissing
│   │   ├── steps.ts                # 步骤构造器（纯数据）
│   │   └── run.ts                  # Step[] → AsyncIterable<StreamChunk>
│   ├── server/
│   │   ├── index.ts                # 转出 + 下面全部
│   │   ├── preset.ts               # ProviderPreset / definePreset
│   │   ├── selection.ts            # pickSelection（白名单）
│   │   ├── chat-handler.ts         # createChatHandler
│   │   ├── catalog-handler.ts      # createCatalogHandler（providers + coverage）
│   │   └── transcription-handler.ts# createTranscriptionHandler（P3）
│   └── providers/
│       ├── openai.ts anthropic.ts gemini.ts grok.ts groq.ts mistral.ts openrouter.ts
│       ├── vercel-gateway.ts llmgateway.ts bedrock.ts vertex.ts ollama.ts
│       ├── openai-compatible.ts    # 工厂：openaiCompatiblePreset({ id, label, baseURL, models })
│       └── byteplus.ts             # 预留位：未安装时 create() 抛「Install @tanstack/ai-byteplus」，不入 defaultCatalog
└── test/                            # 见 §测试
```

### `package.json`（以 `packages/utils` 为模板）

```jsonc
{
  "name": "@gedatou/cadenza-ai",
  "type": "module",
  "version": "0.7.0",
  "description": "Thin TanStack AI facade — provider-agnostic chat runtime, conventions and conversation views built on cadenza-ui",
  "license": "MIT",
  "homepage": "https://cadenza-ui-docs.vercel.app",
  "repository": { "type": "git", "url": "git+https://github.com/GGGLHHH/cadenza.git", "directory": "packages/ai" },
  "bugs": "https://github.com/GGGLHHH/cadenza/issues",
  "keywords": ["react", "tanstack-ai", "chat", "llm", "byok"],
  "sideEffects": false,
  "publishConfig": { "access": "public" },
  "exports": {
    ".": "./dist/index.mjs",
    "./server": "./dist/server/index.mjs",
    "./mock": "./dist/mock/index.mjs",
    "./providers/*": "./dist/providers/*.mjs",
    "./styles.css": "./styles.css",
    "./package.json": "./package.json"
  },
  "types": "./dist/index.d.mts",
  "files": ["dist", "styles.css", "README.md"],
  "scripts": { "build": "tsdown", "dev": "tsdown --watch", "typecheck": "tsc", "prepack": "pnpm run build" },
  "peerDependencies": {
    "react": ">=19",
    "react-dom": ">=19",
    "tailwindcss": ">=4",
    "@gedatou/cadenza-ui": "workspace:^",
    "@tanstack/ai-persistence": "*",
    "@tanstack/ai-openai": "*",
    "@tanstack/ai-anthropic": "*",
    "@tanstack/ai-gemini": "*",
    "@tanstack/ai-grok": "*",
    "@tanstack/ai-groq": "*",
    "@tanstack/ai-mistral": "*",
    "@tanstack/ai-openrouter": "*",
    "@tanstack/ai-vercel-gateway": "*",
    "@tanstack/ai-llmgateway": "*",
    "@tanstack/ai-bedrock": "*",
    "@tanstack/ai-vertex": "*",
    "@tanstack/ai-ollama": "*"
  },
  "peerDependenciesMeta": { /* 上面 13 个 @tanstack/ai-* 全部 { "optional": true } */ },
  "dependencies": {
    "@gedatou/cadenza-utils": "workspace:*",
    "@tanstack/ai": "catalog:ui",
    "@tanstack/ai-client": "catalog:ui",
    "@tanstack/ai-react": "catalog:ui",
    "streamdown": "catalog:ui",
    "@streamdown/code": "catalog:ui",
    "@streamdown/math": "catalog:ui",
    "@streamdown/cjk": "catalog:ui",
    "katex": "catalog:ui" // 只为 styles.css 的 @import 'katex/dist/katex.min.css'（@streamdown/math 自带运行时 katex）
  },
  "devDependencies": {
    "react": "catalog:react",
    "react-dom": "catalog:react",
    "@types/node": "catalog:types",
    "tsdown": "catalog:cli",
    "typescript": "catalog:cli",
    "@gedatou/cadenza-ui": "workspace:*",
    "@testing-library/react": "catalog:testing",
    "@testing-library/user-event": "catalog:testing",
    "@tanstack/ai-persistence": "catalog:ui" /* + 12 个 @tanstack/ai-<id>: catalog:ui，供 typecheck 与 catalog-drift 测试 */
  }
}
```

- `pnpm-workspace.yaml` `catalogs.ui` 新增：`@tanstack/ai ^0.51.0`、`@tanstack/ai-client ^0.29.1`、`@tanstack/ai-react ^0.22.3`、`@tanstack/ai-persistence ^0.5.3`、12 个 adapter（npm 2026-08-28：openai 0.22.2 / anthropic 0.18.2 / gemini 0.26.3 / grok 0.18.2 / groq 0.7.2 / mistral 0.5.2 / openrouter 0.19.4 / vercel-gateway 0.2.4 / llmgateway 0.1.4 / bedrock 0.3.2 / vertex 0.2.4 / ollama 0.10.2）、`streamdown ^2.6.0`、`@streamdown/code ^1.1.1`、`@streamdown/math ^1.0.2`、`@streamdown/cjk ^1.0.3`、`katex ^0.18.4`。`catalogMode: prefer`、`trustPolicy: no-downgrade` 照旧。
- `styles.css`（消费者 `@import "@gedatou/cadenza-ai/styles.css"`）：`@import 'streamdown/styles.css'; @import 'katex/dist/katex.min.css'; @source './dist';`——不含任何自定义 utility（frame C4：新 utility 进 `packages/ui/styles.css`）。
- `tsconfig.json`：`{ "extends": "../../tsconfig.json", "compilerOptions": { "types": ["node"] }, "include": ["src", "test", "tsdown.config.ts"] }`——`tsdown.config.ts` 读 `node:fs`、`src/server` 读 `process.env`，pnpm 隔离布局下 ambient `@types/node` 不会自动发现（`packages/utils/tsconfig.json:3-7` 注释）。`src` 内用全局 `process`（eslint `node/prefer-global/process: always`），`tsdown.config.ts` 可 `import process from 'node:process'`。

### 构建（`tsdown.config.ts`）

```ts
import { readdirSync } from 'node:fs'
import { defineConfig } from 'tsdown'

const providers = Object.fromEntries(
  readdirSync('src/providers').map(f => [`providers/${f.replace(/\.ts$/, '')}`, `src/providers/${f}`]),
)

export default defineConfig({
  entry: { 'index': 'src/index.ts', 'server/index': 'src/server/index.ts', 'mock/index': 'src/mock/index.ts', ...providers },
  dts: true,
  publint: true,
  // banner 是 ChunkAddon = string | ({ format, fileName }) => string | undefined（tsdown types-DP3_0kws.d.mts:583-587, 1196）。
  // 只有 root 与 mock 是客户端模块；server/providers 在 route handler 里跑，带指令反而被 RSC 当客户端模块。
  // ctx 没有 `name` 字段——按 fileName 判。
  outputOptions: { banner: ({ fileName }) => (/^(?:index|mock\/index)\.mjs$/.test(fileName) ? '\'use client\'' : undefined) },
  // dependencies / peerDependencies 由 tsdown 默认外置；这里只兜 optional peer 的正则形态
  // （tsdown 0.22 里该选项已改名 neverBundle，external 仍可用）。
  external: [/^@tanstack\/ai-/, /^@gedatou\//],
})
```

ESLint `ts/explicit-function-return-type` 生效（antfu `type: 'lib'`）。

### 类型策略

- `Model.id` 对外是 `string`。catalog 数据文件**不 import adapter 类型**；与 adapter `XXX_CHAT_MODELS` 的一致性由 `catalog-drift.test.ts`（node 环境，devDependencies 装全部 adapter）锁定。这样 `index.d.mts` 不泄漏 optional peer 的类型；首个 PR `pnpm build` 后 `grep '@tanstack/ai-' dist/index.d.mts` 必须为空。
- `providers/<id>.d.mts` 可以引用对应 adapter 类型。闭合联合工厂（openai/anthropic/gemini/grok/groq/mistral/vercel-gateway/bedrock 的 `createXxx<TModel extends (typeof XXX_CHAT_MODELS)[number]>`）在 preset 内 `model as (typeof XXX_CHAT_MODELS)[number]` 断言，由 drift 测试兜底；openrouter/llmgateway/ollama/openai-compatible 是开放字符串，直接传。
- `ProviderPreset.create()` 返回 `AnyTextAdapter`（`$TS/ai/src/activities/chat/adapter.ts:183`）；per-model `modelOptions` 的类型窄化在这一层擦除，由 `thinking()` 保证片段合法（附录 A 的快照测试）。
- `useChat` 泛型不包一层；视图部件接收 `UseChatReturn` 的字段（`messages/status/error/interrupts/...`），不接收 `chat` 整体。
- 每个视图部件导出 `XxxProps`；有 `data-*` 状态的部件导出 `XxxState`；每部件最外层 `data-slot="kebab-名"`（家法 §1.3、§7.4）。
- `ThinkingPart` 的 `signature?/stepId?` 只在 `@tanstack/ai` 的类型上（`$TS/ai/src/types.ts:452-457`），`@tanstack/ai-client` 自己声明的 `ThinkingPart` 没有（`ai-client/src/types.ts:608-611`）；运行时字段确由 processor 写入（`$TS/ai/src/activities/chat/stream/processor.ts:1857-1877, 1923-1941`）。`messages.ts`/`renderers.tsx` 用 `import type { ThinkingPart } from '@tanstack/ai/client'` 窄化后读 `signature`。

### 仓库接线（一次性）

| 文件 | 改动 |
|---|---|
| `docs/package.json` | `"@gedatou/cadenza-ai": "workspace:*"` + 12 个 `@tanstack/ai-<id>: catalog:ui` + `@tanstack/ai-persistence` + `streamdown`（让 `docs/node_modules/streamdown` 存在，`@source` 才解析得到） |
| `docs/next.config.ts:26-34` | `sourceAlias` 逐条加（turbopack `resolveAlias` 按精确键匹配，Next 16 文档无通配）：`'@gedatou/cadenza-ai'`、`'/server'`、`'/mock'`、14 条 `'/providers/<id>'`；`transpilePackages` 加 `'@gedatou/cadenza-ai'` |
| `docs/app/globals.css:6` | `@import '@gedatou/cadenza-ai/styles.css';` + `@source '../../packages/ai/src';` + `@source '../node_modules/streamdown/dist/*.js';` + `@source '../node_modules/@streamdown/code/dist/*.js';` |
| `docs/app/api/ai/chat/route.ts`、`docs/app/api/ai/catalog/route.ts` | 新建（§docs 分区 route 清单） |
| `bump.config.ts:11-16` | `files` 加 `'packages/ai/package.json'` |
| `README.md` | 结构表加一行 `packages/ai`；:109「三个 packages/*/package.json 锁步」改「四个」 |
| `docs/content/docs/meta.json` | `pages: ["index","themes","components","forms","ai","utils"]` |
| `docs/lib/dictionary.ts:61-67,126-132` + `app/[lang]/page.tsx` `MORE` | 加 `ai` 键 → `/docs/ai/conversation` |
| `docs/demos/lib/resettable.tsx` | `ResettableDemo` 从 `demos/message-scroller/` 搬来（11 处 import 同步改），加 `onReset?: () => void \| Promise<void>` |
| `.github/workflows/ci.yml`、`vercel.json` | 不改：`--filter "@gedatou/*"` 自动纳入新包 |
| 首发 | `pnpm --filter @gedatou/cadenza-ai publish --access public` 手动一次 + npmjs trusted publishing（README「发布」节） |

## API 面

原则：**先有 demo，再有导出**——root 与 mock 的每个导出至少出现在 §docs 分区的一个 demo 里；`server`/`providers` 子入口的导出以 providers 页的配方代码块代替 demo。

### root `@gedatou/cadenza-ai`

**转发**：`export * from '@tanstack/ai-react'`（`useChat`、`useByok`、`useAudioRecorder`、`useTranscription`、`useSummarize`、`useGenerateImage`、`useRealtimeChat`、`useMcpAppBridge` 等 12 个 hook；`fetchServerSentEvents`/`stream` 等连接工厂；`indexedDBPersistence/localStoragePersistence/sessionStoragePersistence`；`createChatClientOptions`；全部类型）；`export { defineByok, memoryStorage, passkeyStorage, defaultByokStorage, isPasskeyStorageSupported } from '@tanstack/ai-client/byok'` 与对应类型；`export { toolDefinition, EventType, generateMessageId, parsePartialJSON, fromSpecTokenUsage } from '@tanstack/ai/client'` 与 `AnyClientTool/InferToolInput/InferToolOutput/ThinkingPart` 类型（`$TS/ai/src/client.ts:228-229, 305`）。**`useChat` 直接暴露，不包 `useConversation`**（O4）。

**点名不做（v1 只转发、不做页面/部件）**：`useGenerateImage`（T21：v1 无生成家族页面）；`useRealtimeChat`/`useMcpAppBridge`（O8：需 realtime / MCP Apps 宿主）；`connectionStatus`（O2：仅 `live` 订阅有意义）；`onCustomEvent('artifact.created')`（G11：无 artifact 取回约定）；`resolveInterrupts/cancelInterrupts/retryInterrupts`（G4：通用中断走原 API，`ApprovalActions` 只处理 `kind:'tool-approval'`）；`chat({ mcp })`（G8：server-only 配方）。

**目录（L1）**

| 导出 | 签名 / 说明 |
|---|---|
| `ThinkingLevel` / `THINKING_LEVELS` | `'off' \| 'minimal' \| 'low' \| 'medium' \| 'high' \| 'xhigh' \| 'max'`（与 pi `ModelThinkingLevel = 'off' \| ThinkingLevel` 对齐，`$PI/pi-ai/dist/types.d.ts:24-25`；`'xhigh'` 是 Anthropic 4.7+/Sonnet 5/Fable 5、OpenRouter、LLM Gateway 的真实档位）；顺序即强度 |
| `Model` | `{ id; name; provider; input: readonly Modality[]; reasoning: boolean; contextWindow?; maxOutputTokens?; cost?: ModelCost; thinkingLevels?: readonly ThinkingLevel[] }`（`Modality` = `$TS/ai/src/types.ts:211`；`cost` 单位 USD / 1M tokens；`thinkingLevels` 缺省 = `reasoning ? THINKING_LEVELS : ['off']`） |
| `Provider` | `{ id; label; byok: ByokProvider \| null; keyRequired: boolean; runtime: 'node' \| 'local'; models: readonly Model[] }`（`ByokProvider` = `$TS/ai/src/byok/define-provider.ts:7-16`；`keyRequired:false` = 无 key 也能跑：vertex（ADC）、ollama（env host）） |
| `Catalog` / `createCatalog(providers)` | `{ providers; models; getProvider(id); getModel(ref); withProvider(p); withoutProvider(id) }` 全同步、不可变 |
| `providers` / `defaultCatalog` | 12 个纯数据 `Provider` + `createCatalog(Object.values(providers))` |
| `modelRef(model)` / `parseModelRef(ref)` | `'openai/gpt-5.2' ⇄ { provider, id }` |
| `supportedThinkingLevels(model?)` / `clampThinkingLevel(model?, level)` | clamp 向下取最近支持档，最低 `'off'`（Fable 5 这类不可关的模型最低 `'low'`） |
| `estimateCost(model, usage)` | `(Model, TokenUsage) => number \| undefined`（`TokenUsage` = `$TS/ai-event-client/src/index.ts:147-294`，含 `promptTokensDetails.cachedTokens`） |

**运行时（L2）**

| 导出 | 签名 / 说明 | 填补的缺口 |
|---|---|---|
| `ThreadMeta` | `{ id; title; createdAt; updatedAt; messageCount; preview; archived: boolean; provider?; model? }` | 客户端存储无 list（`$TS/ai-client/src/types.ts:663-669`） |
| `createThreadIndex(options?)` | `({ key?='cadenza-ai:threads'; storage?: 'local' \| 'memory' }) => ThreadIndex`；`ThreadIndex = { list(); get(id); create(init?); touch(id, patch); rename(id, title); archive(id, archived); remove(id); subscribe(l) }`；**`touch` 对未知 id 自动创建**（upsert，`createdAt = now`）；`create` 仅供 `ThreadListNew` 预建空条目以便立刻选中。`'local'` = localStorage JSON + `storage` 事件（多 tab 免费同步）；`'memory'` 给 SSR/测试。`ponytail:` localStorage 5MB 天花板，2k 线程以上换 IndexedDB 索引库 | 同上 |
| `useThreadIndex(index)` | `useSyncExternalStore` → `readonly ThreadMeta[]`（`updatedAt` 倒序，归档排后） | |
| `threadPersistence(index, base)` | `(ThreadIndex, ChatClientPersistence) => ChatClientPersistence`：`setItem` 后 `index.touch(id, { messageCount, preview, updatedAt, title: meta?.title \|\| threadTitleFrom(messages) })`；`removeItem` 后 `index.remove(id)`。`useChat({ persistence: threadPersistence(index, indexedDBPersistence()), threadId })` 一行接通列表与自动标题 | |
| `groupThreadsByDay(threads, now?)` / `threadTitleFrom(messages)` | 今天/昨天/更早；首条 user 文本前 40 字 | |
| `useModelSelection(options?)` | `({ catalog?; key?='cadenza-ai:selection'; initial? }) => { selection: { provider; model; thinking }; model?; provider?; setModel(ref); setThinking(level); forwardedProps }`；`setModel` 内部 `clampThinkingLevel`；localStorage 持久化 | TanStack 没有「当前模型」概念，`forwardedProps` 只是透传袋（`types.ts:872`） |
| `useStoredState(key, initial)` | `<T>(string, T) => [T, (next: T) => void]`（localStorage JSON，SSR 安全）；草稿 `cadenza-ai:draft:<threadId>` 用它 | |
| `useUsageTracker()` | `{ onChunk(chunk); onFinish(message); total: TokenUsage; lastRun: TokenUsage \| undefined; byMessage: ReadonlyMap<string, TokenUsage>; reset() }`。`onChunk` 里 `chunk.type === EventType.RUN_FINISHED` → `const u = Array.isArray(chunk.usage) ? fromSpecTokenUsage(chunk.usage, chunk.metadata?.tanstack?.usage) : chunk.usage`（`fromSpecTokenUsage` 取 `usage[0]`，`$TS/ai/src/utilities/ag-ui-usage.ts:111-114`；leftover 落在 `RUN_FINISHED.metadata.tanstack.usage`，`types.ts:554-558`；`rebuildTokenUsage` 未公开导出，不用）；**每轮各一份**（引擎对每个 adapter `RUN_FINISHED` 调 `runOnUsageFromChunk`，`$TS/ai/src/activities/chat/index.ts:1643-1645`；中间轮 `finishReason:'tool_calls'` 的 `RUN_FINISHED` 延后到工具结果之后再发，`:2305-2311`）→ 按 `runId` 累加；`onFinish(message)` 把本 run 累计归到 `message.id` | 客户端 processor 只读 `finishReason`，usage 被丢（critique §1）；不写进 parts/metadata 以避开 `MESSAGES_SNAPSHOT` 重建（C7） |
| `createByok(options?)` | `({ persistent?: boolean; catalog?: Catalog }) => ByokClient`：`defineByok({ storage: persistent ? passkeyStorage() : memoryStorage() })`；**立即** `setServerCoverage` 覆盖 `catalog` 里 `keyRequired:false` 的 provider（vertex/ollama），使 `prepare()` 不阻断。`persistent` 是页面级设置（`useChat` 只在创建 client 时接 `byok`，`$TS/ai-react/src/use-chat.ts:166`，`updateOptions` 不同步）——切换 = 外层 `key` 重挂并用旧 snapshot 的 key `update()` 迁移 | `ByokClient.prepare()` 阻断（`byok/client.ts:163-175`） |
| `useServerCoverage(byok, url?='/api/ai/catalog')` | 挂载时 `fetch(url)` → `byok.setServerCoverage(coverage)`；返回 `{ coverage, providers? }` | 同上 |
| `definePartRenderers(r)` / `PartRenderersProvider` / `usePartRenderers()` / `PartLabels` | 见 §客户端运行时 渲染器注册表 | render-prop → 注册表（pi P26） |
| `messageText(message)` / `messagesToMarkdown(messages, { title?, includeThinking?=false })` | parts → 文本 / Markdown | `toolResultContentToString` 不导出 |
| `editAndResend(chat, messageId, content)` | `(Pick<UseChatReturn,'messages'\|'setMessages'\|'sendMessage'\|'status'\|'stop'>, string, string \| MultimodalContent) => Promise<void>`：`setMessages(messages.slice(0, idx))` → `sendMessage(content)`；`setMessagesManually` 走 processor → `onMessagesChange` → persistor，截断会持久化（`chat-client.ts:3050, 648-651`） | 无 edit API |
| `isThinkingComplete(message, partIndex, status)` | 同消息后续出现 `text`/`tool-call` part，或 `status !== 'streaming'`，或 `part.signature` 已存在（C9；类型见 §类型策略） | 无官方完成标志 |
| `Source` / `sourcesOf(message)` | `Source = { url: string; title?: string; snippet?: string }`；从 `tool-call` part 的 `metadata.providerExecuted` + `metadata.anthropic.resultBlockType === 'web_search_tool_result'`（`$TS/ai-anthropic/src/adapters/text.ts:79-138`）与脚本/自建的 `metadata.sources` 挖；OpenAI `url_citation`、Gemini `groundingMetadata` 上游未映射，**不承诺** | 跨 provider 无统一 sources part |
| `fileToContentPart(file, { maxBytes? })` / `DEFAULT_MAX_ATTACHMENT_BYTES` | image/audio/video/document → `{ type, source: { type:'data', value: base64, mimeType } }`（`$TS/ai/src/types.ts:217-306`）；base64 用 `FileReader.readAsDataURL` 结果按 `,` 切取（浏览器原生，零依赖；`@tanstack/ai-utils` 的 `arrayBufferToBase64` 不从任何公开入口转出）；上限 **3 MB / 条消息**（Vercel 函数请求体 4.5 MB，base64 ×1.33；数字待 413 实测，见 §风险） | 客户端无上传/blob API |
| `DraftAttachment` / `useAttachmentDraft(options?)` | `DraftAttachment = { id; kind: 'image'\|'audio'\|'video'\|'document'; state: AttachmentState /* @gedatou/cadenza-ui */; file?: File; part?: ContentPart; error?; previewUrl? }`（`file`/`part` 二选一：录音产物是现成 `AudioPart`）；`{ items; add(items: ReadonlyArray<File \| ContentPart>); remove(id); clear(); toParts(): Promise<ContentPart[]>; accept: string }`；`toParts` 对已是 part 的直接透传；`accept` 随当前 `Model.input` 收窄 | |

**视图（L3）**：见 §视图层；导出清单在 §docs 分区 demo 表最后一列。

### `@gedatou/cadenza-ai/server`

| 导出 | 签名 |
|---|---|
| `ProviderPreset` | `Provider & { create(model: string, key: string \| null): AnyTextAdapter; thinking(level: ThinkingLevel, model: Model): Record<string, unknown>; discoverModels?(key: string \| null): Promise<Model[]> }` |
| `definePreset(p)` | 恒等 + 校验 `p.byok === null \|\| p.byok.id === p.id`（BYOK 头名 `x-byok-<id>` 由 `byokHeaderName(id)` 生成，`$TS/ai/src/byok/providers.ts:5-27`） |
| `createChatHandler(options)` | `(ChatHandlerOptions) => { POST(request): Promise<Response>; GET(request): Promise<Response> }`（§服务端） |
| `pickSelection(forwardedProps, presets, { defaultModel? })` | `=> Selection \| Response`；`Selection = { preset; model: Model; thinking: ThinkingLevel }`；`provider`/`model` 任一缺席 → `parseModelRef(defaultModel)`；两者都缺且无 `defaultModel` → 400 `unknown_model` |
| `createCatalogHandler(presets)` | `=> { GET }`：`{ providers: Provider[]（client-safe，去掉 create/thinking）, coverage: Record<id, boolean>, generatedAt }`；coverage = `keyRequired === false \|\| (byok.env ?? []).some(n => !!process.env[n])`，vertex 特判 = `GOOGLE_VERTEX_API_KEY` 有值 **或**（project 任一 env 有值 **且** location 任一 env 有值）（`$TS/ai-vertex/src/auth.ts:38-52`）；`?refresh=1&provider=ollama` 调 `discoverModels`（P3） |
| `createTranscriptionHandler({ adapter })` | P3：`generationParamsFromRequest('transcription', req)`（`$TS/ai/src/client.ts:136-190`）→ `generateTranscription`；`adapter: (request) => TranscriptionAdapter \| Response` 自己 `getByokKey` |
| 转出 | `chat`, `toolDefinition`, `chatParamsFromRequest`, `mergeAgentTools`, `toServerSentEventsResponse`, `memoryStream`, `maxIterations`（`@tanstack/ai`）；`getByokKey`, `byokMissing`（`@tanstack/ai/byok/server`）；`defineByokProvider`（`@tanstack/ai/byok`） |

### `@gedatou/cadenza-ai/providers/<id>`

每文件 `export const <id>: ProviderPreset`；`openai-compatible.ts` 导出工厂 `openaiCompatiblePreset({ id, label, baseURL, models, env?, thinking? })`。映射表见 §服务端 与附录 A。

### `@gedatou/cadenza-ai/mock`

| 导出 | 签名 |
|---|---|
| `scripted(script, options?)` | `(Script, { pace?: number \| 'instant'; chunk?: 'word' \| 'char' \| number; messageId?: () => string }) => ChatFetcher`（喂 `useChat({ fetcher })`；`ChatFetcher` = `$TS/ai-client/src/types.ts:283-322`，可返回 `Response` 或 `AsyncIterable<StreamChunk>`） |
| `sequence(turns)` / `respond(rules, fallback?)` / `echo(options?)` | 多轮编排：第 n 次请求用第 n 段（超出重复最后一段）/ 按 `lastUserText` 匹配 / 复述最后一条 user（含附件 mime 与 `ctx.data.model`） |
| `byokMissing(provider)` | 脚本返回 `new Response(JSON.stringify({ error: { type:'byok_missing', provider, message } }), { status: 401, headers: { 'content-type':'application/json' } })`——走 `assertResponseOk` → `ByokMissingError` → `byok.request(provider,'missing')`（`$TS/ai-client/src/connection-adapters.ts:502-515`；`chat-client.ts:2428-2431`），是「有 key 但服务端拒收」的唯一可脚本化路径（无 key 时 `prepare()` 在 fetcher 之前就弹窗） |
| `text` / `reasoning` / `tool` / `tool.result` / `custom` / `structured` / `usage` / `error` / `sleep` / `finish` | 步骤构造器（§客户端运行时 脚本化 transport） |
| `approvalOf(ctx, toolCallId)` / `clientResultOf(ctx, toolCallId)` | 从 `ctx.resume` 取审批 `{ approved, editedArgs?, payload? }` / 客户端工具输出 |
| 类型 `Script` / `ScriptContext` / `Step` / `ScriptedOptions` | |

## 服务端

### 请求生命周期（`createChatHandler` 的 `POST`）

```
Request
 ├─ content-length > maxBodyBytes（默认 4 MB）→ 413
 ├─ chatParamsFromRequest(req)                     $TS/ai/src/utilities/chat-params.ts:282-312；抛 Response(400) → catch 并 return（C8）
 ├─ sel = pickSelection(params.forwardedProps, presets, { defaultModel })   白名单只读 provider / model / thinking 三键，其余键（含 modelOptions/systemPrompts）不看
 │    provider/model 缺席 → defaultModel；provider ∉ presets → 400 unknown_provider
 │    model 不在 preset.models 且 preset 无 discoverModels → 400 unknown_model（ollama/openai-compatible 允许目录外 id，`OllamaTextModel` 是开放字符串）
 │    model 字符串必须匹配 /^[\w.\-:\/~]{1,200}$/；thinking ∉ THINKING_LEVELS → 'off'
 ├─ sel = options.onSelect?.(sel, req) ?? sel             策略钩子（按用户限 provider 等）；返回 Response 即短路
 ├─ key = sel.preset.byok ? getByokKey(req, sel.preset.byok) : null     get-key.ts:13-27：头优先、provider.env 兜底
 │    sel.preset.keyRequired && key === null → return byokMissing(sel.preset.byok)   401 byok_missing → 客户端 byok.request()
 ├─ adapter = sel.preset.create(sel.model.id, key)
 ├─ modelOptions = sel.preset.thinking(clampThinkingLevel(sel.model, sel.thinking), sel.model)
 ├─ stream = chat({ adapter, messages: params.messages, threadId, runId, parentRunId, resume,
 │                  tools: mergeAgentTools(options.tools ?? [], params.tools),   chat-params.ts:355-400：服务端同名优先
 │                  systemPrompts, modelOptions, middleware, agentLoopStrategy, context, abortController, debug })
 └─ toServerSentEventsResponse(stream, { abortController, durability: options.durability ? { adapter: options.durability(req) } : undefined })
                                                    $TS/ai/src/stream-to-response.ts:702-716（durability 是 { adapter; batch? } 信封）
```

`GET`：`?threadId=` 且 `options.persistence` → `reconstructChat(persistence, req, { authorize })`（`$TS/ai-persistence/src/reconstruct.ts:19-149`，返回客户端 `hydrate` 期待的 `{ messages, activeRun, interrupts }`）；`?runId=`/`Last-Event-ID` 且 `options.durability` → `resumeServerSentEventsResponse({ adapter })`（`stream-to-response.ts:1005`）；否则 404。

```ts
interface ChatHandlerOptions<TContext = unknown> {
  providers: readonly ProviderPreset[]
  defaultModel?: string // 'openai/gpt-5.2'；客户端不带 provider/model 时用
  systemPrompts?: SystemPrompt[] | ((sel: Selection) => SystemPrompt[])
  tools?: ReadonlyArray<AnyTool> // $TS/ai/src/types.ts:826（AnyRuntimeTool 是引擎私有别名，不导出）
  middleware?: ChatMiddleware<TContext>[]
  context?: (request: Request) => TContext | Promise<TContext>
  agentLoopStrategy?: AgentLoopStrategy // 默认 maxIterations(5)，不放开给客户端
  onSelect?: (sel: Selection, request: Request) => Selection | Response
  persistence?: AIPersistence<ChatTranscriptStores> // 动态 import @tanstack/ai-persistence → withPersistence + GET reconstructChat
  authorize?: ReconstructChatOptions['authorize']
  durability?: (request: Request) => StreamDurability // 内部包成 { adapter }；e.g. memoryStream(request)；docs 不开（O6）
  maxBodyBytes?: number // 默认 4 * 1024 * 1024
  ollamaHosts?: readonly string[] // 默认只允许 localhost / 127.0.0.1 / 私网段（防 SSRF）
  debug?: DebugOption
}
```

### provider presets（13 + 1 预留）

| id | `create(model, key)` | `byok` / env | `keyRequired` / runtime | 备注 |
|---|---|---|---|---|
| `openai` | `createOpenaiChat(model, key)`（`$TS/ai-openai/src/adapters/text.ts:170`） | `openaiByok` / `OPENAI_API_KEY` | true / node | |
| `anthropic` | `createAnthropicChat(model, key)`（`ai-anthropic/src/adapters/text.ts:1509`） | `anthropicByok` / `ANTHROPIC_API_KEY` | true / node | thinking 四段分代（附录 A） |
| `gemini` | `createGeminiChat(model, key)`（`ai-gemini/src/adapters/text.ts:900`） | `geminiByok` / `GOOGLE_API_KEY`→`GEMINI_API_KEY` | true / node | |
| `grok` | `createGrokText(model, key)`（`ai-grok/src/adapters/text.ts:116`） | `grokByok` / `XAI_API_KEY` | true / node | `grok-build-*` 不发 reasoning（`reasoning?: never`） |
| `groq` | `createGroqText(model, key)`（`ai-groq/src/adapters/text.ts:214`） | `groqByok` / `GROQ_API_KEY` | true / node | `supportsCombinedToolsAndSchema` 为 false |
| `mistral` | `createMistralText(model, key)`（`ai-mistral/src/adapters/text.ts:1149`） | `mistralByok` / `MISTRAL_API_KEY` | true / node | 无 thinking 设置项；`thinkingLevels: ['off']` |
| `openrouter` | `createOpenRouterText(model, key)`（`ai-openrouter/src/adapters/text.ts:1524`） | `openrouterByok` / `OPENROUTER_API_KEY` | true / node | 目录只精选 ~10 个 `vendor/model`；PKCE 见 §视图层 ByokKeyDialog |
| `vercel-gateway` | `createVercelGatewayText(model, key)`（`ai-vercel-gateway/src/adapters/factory.ts:47`） | `vercelGatewayByok` / `AI_GATEWAY_API_KEY`→`VERCEL_OIDC_TOKEN` | true / node | 精选子集 |
| `llmgateway` | `createLLMGatewayText(model, key)`（`ai-llmgateway/src/adapters/text.ts:96`） | **自定义** `defineByokProvider({ id:'llmgateway', label:'LLM Gateway', env:'LLM_GATEWAY_API_KEY' })`（该包无 `./byok`） | true / node | |
| `bedrock` | `createBedrockText(model, key)`（`ai-bedrock/src/index.ts:95-110`，bearer key，默认 Converse） | **自定义** `defineByokProvider({ id:'bedrock', label:'Amazon Bedrock', env:['BEDROCK_API_KEY','AWS_BEARER_TOKEN_BEDROCK'] })`（官方 `bedrockByok` 无 env） | true / node | 只做 bearer；SigV4 不 per-request |
| `vertex` | `vertexText(model, { apiKey: key ?? undefined })`（`ai-vertex/src/index.ts:67`；ADC 或 express key 由 adapter 自己读 env） | `defineByokProvider({ id:'vertex', label:'Vertex AI', env:['GOOGLE_VERTEX_API_KEY'] })`；coverage 特判见 `createCatalogHandler` | **false** / node | 纯 env |
| `ollama` | `key ? createOllamaChat(model, { host: key }) : ollamaText(model)`（`ai-ollama/src/adapters/text.ts:586, 597`） | `ollamaByok`（无 env）；**`x-byok-ollama` 头的值 = host URL**（自定义语义，文档写清） | **false** / **local** | `process.env.VERCEL === '1'` 时不注册；host 经 `ollamaHosts` 白名单；`discoverModels: GET {host}/api/tags` |
| `openai-compatible` | `openaiCompatibleText(model, { baseURL, apiKey: key, name })`（`ai-openai/src/compatible/index.ts:89`） | `defineByokProvider({ id: config.id, label, env: config.env })` | true / node | 消费者给 `baseURL` + `models`；`discoverModels` = `GET {baseURL}/models` |
| `byteplus` | 预留：`create()` 抛 `Error('Install @tanstack/ai-byteplus')` | 按 SKILL 文档形状 | — | 不入 `defaultCatalog` |

### 安全清单

1. `forwardedProps` 只读三键；**永远不 spread 进 `chat()`**；`modelOptions` v1 不开放（feature-checklist 8 源里没有一个给出采样 UI）。
2. `model` 正则 + `provider ∈ presets` + `thinking ∈ THINKING_LEVELS`；单测覆盖注入用例（`modelOptions.tools`、`provider: '../x'`、`model: 'x/../y'`、超长 model）。
3. BYOK 头只读不回显；自拼的错误文本经 `scrubSecrets`（`$TS/ai/src/byok.ts:17`）；`debug` 默认只开 errors。
4. `maxBodyBytes` → 413；附件客户端上限 3 MB/条（§风险 待实测）。
5. Ollama host 只允许 localhost / 私网段（防 SSRF）；`http(s)` 协议校验。
6. `reconstructChat` 必须 `authorize`（`reconstruct.ts:28-44` 警告）；docs 不开 persistence。
7. `agentLoopStrategy` 与 `systemPrompts` 只由服务端配置；客户端不可改。
8. 取消：`toServerSentEventsResponse(stream, { abortController })` 让客户端断开即 abort（非 durable 模式，`stop()` = 真取消）。

### persistence / durability（接口，docs 不落地）

- `persistence` → `withPersistence(persistence)`（`$TS/ai-persistence/src/middleware.ts:1945`）+ `GET ?threadId` → `reconstructChat`。客户端对应 `useChat({ persistence: true, threadId })` + `fetchServerSentEvents(url)` 内建 `hydrate`。文档写明 `MessageStore.saveThread` 整体覆盖、无 list、删除 = `saveThread(id, [])`。
- `durability` → `toServerSentEventsResponse(stream, { durability: { adapter } })` + `GET ?runId` → `resumeServerSentEventsResponse`；本地开发 `memoryStream(request)`，生产 `durableStream(request, { server })`（需外部 Durable Streams 服务）。

## 客户端运行时

### `useChat` 接线（docs `conversation.mdx` 的 `## 使用` 就是这一段）

```tsx
// 页面级：persistent 是页面设置，改动 = 重挂整棵会话
function Page({ threadId }) {
  const [persistent] = useStoredState('cadenza-ai:byok-persistent', false)
  const byok = useMemo(() => createByok({ persistent, catalog: defaultCatalog }), [persistent])
  const index = useMemo(() => createThreadIndex(), [])
  useServerCoverage(byok)
  return <Chat key="#" threadId={threadId} byok={byok} index={index} />
}

// Chat 组件（用户代码；docs 的 chat-shell.tsx 就是它）
function Chat({ threadId, byok, index }) {
  const persistence = useMemo(() => threadPersistence(index, indexedDBPersistence()), [index]) // client 组件内创建：SSR 下懒抛（storage-adapters.ts:25-38）
  const { selection, model, forwardedProps, setModel, setThinking } = useModelSelection()
  const usage = useUsageTracker()
  const chat = useChat({
    threadId,
    persistence, // persistence 开启时 threadId 必填（types.ts:748-762）
    connection: fetchServerSentEvents('/api/ai/chat'), // demo 里换成 fetcher: scripted(script)
    byok,
    byokProvider: () => selection.provider, // 总是能解析出 provider，避开 ByokUnresolvedProviderError
    forwardedProps, // 改动经 updateOptions 同步（use-chat.ts:317-325）
    onChunk: usage.onChunk,
    onFinish: usage.onFinish,
  })
  return (
    <TranscriptProvider status={chat.status} interrupts={chat.interrupts} addToolApprovalResponse={chat.addToolApprovalResponse}>
      <Transcript>…</Transcript>
      <Composer status={chat.status} onStop={chat.stop} onValueCommitted={commit} />
    </TranscriptProvider>
  )
}
```

- 换线程 = 重挂：`key={threadId}`（`useChat` 身份 = `threadId`，`use-chat.ts:49-50, 286`）；不在卸载时 `stop()`（Strict Mode 会误杀 rejoin，`:402-409`）。
- **切模型后立即发送的竞态**：`updateOptions` 的 `useEffect` 可能落后一帧 → 提交时把当前 `forwardedProps` 也塞进 `sendMessage(content, { body: forwardedProps })`（`SendMessageOptions.body` 优先级最高，`$TS/ai-client/src/types.ts:494-507`）。docs 示例：`const parts = await draft.toParts(); chat.sendMessage({ content: [...parts, { type:'text', content: text }] }, { body: forwardedProps })`。

### 线程索引（O1）

- 正文：TanStack `indexedDBPersistence({ databaseName })`（`$TS/ai-client/src/storage-adapters.ts:134`，键 `keyPrefix + threadId`，每 thread 一条 `{ messages, resume? }`）。
- 索引：`createThreadIndex({ storage:'local' })`，localStorage 一个键存 `ThreadMeta[]`，`subscribe` 同时挂 `storage` 事件（跨 tab）与本地 emitter。不做 IndexedDB 索引库、不做 `StorageBackend/Store/AppStorage` 抽象（仓库无先例；v2 需要时再抽）。
- `threadPersistence(index, base)` 把两者接起来；删除 = `index.remove(id)` + `persistence.removeItem(id)`。
- 服务端持久化：**文档化接口**（`createChatHandler({ persistence })` + 配方节），docs 站不真接。

### 编辑重发 / 分支（O2 / Q2）

v1 线性：`editAndResend` = `setMessages(slice)` + `sendMessage`；重新生成 = `reload()`（TanStack 内部 `removeMessagesAfter(lastUserIndex)`，`chat-client.ts:2550`）。数据不加 `parentId`——`UIMessage.metadata` 是开放袋（`$TS/ai/src/types.ts:585-588`），`ThreadMeta` 在 v2 加 `leafId` 时做索引版本升级。v2 路线见附录 B。

### 渲染器注册表与默认文案（O4 / I7）

```ts
interface PartRenderers {
  text?: (p: { part: TextPart, message: UIMessage, streaming: boolean }) => ReactNode
  thinking?: (p: { part: ThinkingPart, complete: boolean, startedAt?: number }) => ReactNode
  toolCall?: { default?: ToolRenderer } & Record<string, ToolRenderer> // 按 part.name
  toolResult?: (p: { part: ToolResultPart }) => ReactNode // 默认 null：结果内联进 ToolCallCard
  image?: (p: { part: ImagePart, message: UIMessage }) => ReactNode // 默认 MediaPart
  audio?: (p: { part: AudioPart, message: UIMessage }) => ReactNode
  video?: (p: { part: VideoPart, message: UIMessage }) => ReactNode
  document?: (p: { part: DocumentPart, message: UIMessage }) => ReactNode
  structuredOutput?: (p: { part: StructuredOutputPart }) => ReactNode
  uiResource?: (p: { part: UIResourcePart }) => ReactNode // 默认 null（MCP Apps 不进 v1；消费者可注册 MCPAppResource）
}
type ToolRenderer = (p: { part: ToolCallPart, result?: ToolResultPart, interrupt?: ToolApprovalInterrupt, streaming: boolean }) => ReactNode

interface PartLabels { // 默认渲染器用到的全部可见文案；英文默认；这是本包唯一的 i18n 表
  thinking: string
  thought: (seconds: number) => string
  toolPending: string
  toolRunning: string
  toolApprovalRequested: string
  toolApproved: string
  toolDenied: string
  toolDone: string
  toolFailed: string
  toolGroup: (count: number) => string
  approve: string
  deny: string
  sources: (count: number) => string
}
```

- **默认文案裁定（家法 §7.9 / §7.10 与 shaping-new-parts 的 `*Label` 豁免）**：在**显式组合**里使用的部件（`ToolCallGroup`、`Reasoning` 触发器、`ApprovalApprove/ApprovalDeny`、`TranscriptError`、`TranscriptPending`、`ThreadList*`、`Sources`）文案一律是 children，无默认；**默认渲染器**（`TranscriptParts` 无 children 时的一体化路径）是唯一带可见英文的地方，文案集中在 `PartLabels`，经 `PartRenderersProvider labels?: Partial<PartLabels>` 覆盖（镜像 DataPagination「无组合面的一体组件用 `*Label` 字符串」的成文豁免）；`aria-label` 有英文默认可覆盖；streamdown 自身 UI 文案走 `Markdown translations`；`ThinkingLevelPicker` 显示的级别标识符是数据不是文案（可经 `labels` 覆盖）。README 与 `parts.mdx` 列全表。
- `TranscriptParts { message: UIMessage; className?: string }` 默认实现：text → `Markdown`；thinking → `Reasoning`（`startedAt` 由 `TranscriptParts` 内部 `useRef<Map<partIndex, number>>` 在首次见到该 thinking part 时打点；`complete` = `isThinkingComplete`）；连续 ≥2 个 tool-call → `ToolCallGroup` 包 `ToolCallCard`；tool-call 在 `state === 'approval-requested'` 且 `TranscriptProvider.interrupts` 里有同 `toolCallId` 的 `kind:'tool-approval'` 项时，卡片底部渲染 `ApprovalActions`；无新式 interrupt 时回落 `addToolApprovalResponse({ id: part.approval.id, approved })`（两条路会同步，`chat-client.ts:1398-1406`）。`status`/`interrupts`/`addToolApprovalResponse` 全部从 `TranscriptProvider` 读。
- Context 家法：`PartRenderersContext` 用完整默认对象（缺 Provider = 默认渲染器 + 英文 `PartLabels`）；`TranscriptContext`/`ApprovalContext` 缺 Provider 在守卫 hook 里抛 `cadenza-ai: TranscriptContext is missing. Transcript parts must be placed within <TranscriptProvider>.`；value 传 Provider 前 `useMemo`；dev-only `displayName`。
- 工具渲染器必须接受**不完整参数**：`part.arguments` 可能是不完整 JSON（`$TS/ai-client/src/types.ts:522-594`），用 `parsePartialJSON`。
- 判别键是 `metadata.kind`（`'approval'`/`'client_tool'`）；`reason` 只是 legacy 兜底（`'approval_required'`/`'client_tool_input'`），engine 实际发 `'tool_call'`（`$TS/ai/src/activities/chat/stream/processor.ts:1715, 1749`；`activities/chat/index.ts:2611`）。
- 批门控（core §4.2）：同批里有待审批工具时，其它服务端工具延后——其它 pending 卡片显示 `TranscriptPending`（文案由默认渲染器的 `labels.toolPending` 或 caller 给）。

### 脚本化 transport（F7 / O3，`./mock`）

契约：

```ts
interface ScriptContext {
  messages: UIMessage[]
  lastUser?: UIMessage
  lastUserText: string
  data: Record<string, unknown> // = mergedBody（forwardedProps + sendMessage body，chat-client.ts:2280-2284）
  threadId: string
  runId: string
  parentRunId?: string
  resume?: RunAgentResumeItem[] // { interruptId, status:'resolved'|'cancelled', payload?, metadata? }
  turn: number // 本 fetcher 实例被调用的次数（从 0）
  signal: AbortSignal // stop() 时触发
}
type Script = (ctx: ScriptContext) => Step[] | Iterable<Step> | AsyncIterable<Step> | Promise<Step[]> | Response
```

步骤 → AG-UI 事件（枚举 `EventType`，`$TS/ai/src/client.ts:192-226`；字段 `$TS/ai/src/types.ts:1168-1369, 1615-1650`）：

| 构造器 | 事件序列 |
|---|---|
| `text(content, { chunk?, pace? })` | `TEXT_MESSAGE_START{messageId, role:'assistant'}`（同一 assistant 消息只发一次）→ N × `TEXT_MESSAGE_CONTENT{delta}` → `TEXT_MESSAGE_END` |
| `reasoning(content, { signature? })` | `REASONING_START` → `REASONING_MESSAGE_START{role:'reasoning'}` → N × `REASONING_MESSAGE_CONTENT` → `REASONING_MESSAGE_END` → `REASONING_END`；`signature` 时追加 `STEP_FINISHED{stepName, signature}`（engine 同款，`index.ts:1872-1876`；processor 的 `currentThinkingStepId` 只赋值不清空，`REASONING_END` 后仍能挂上） |
| `tool(name, input, { output?, error?, argsChunk?, approval?, client?, providerExecuted?, metadata? })` | `TOOL_CALL_START{toolCallId, toolCallName, parentMessageId}` → `TOOL_CALL_ARGS{delta}`×n → `TOOL_CALL_END{input}` → 默认紧接 `TOOL_CALL_RESULT{messageId, toolCallId, content, role:'tool'}`；`error` → `metadata.tanstack.state='output-error'`；`approval/client` → 不发 RESULT，由 run 收尾发 interrupt |
| `tool.result(toolCallId, output, { error? })` | 续跑轮单发 `TOOL_CALL_RESULT` |
| `custom(name, value)` / `structured(object)` / `usage(u)` / `error(message, code?)` / `sleep(ms)` / `finish()` | `CUSTOM` / `structured-output.start` + JSON 分片 + `structured-output.complete` / 挂到 `RUN_FINISHED.usage[]` / `RUN_ERROR` / 空转 / 显式收尾 |
| `byokMissing(provider)`（Script 直接 return） | 401 JSON `Response`（见 §API 面 mock） |

run 收尾：开头 `RUN_STARTED{threadId, runId, parentRunId?}`；有 `approval/client` 挂起 → `RUN_FINISHED{ finishReason:'tool_calls', outcome:{ type:'interrupt', interrupts } }`，否则 `RUN_FINISHED{ finishReason:'stop', usage }`。**不发 `MESSAGES_SNAPSHOT`**（会冲掉本地瞬态 part；processor 对快照缺席有回退，`processor.ts:1716-1722`）。`signal.aborted` → 直接 return（`abortableIterable` 收尾，`connection-adapters.ts:2565-2591`；缺终态时 `normalizeConnectionAdapter` 合成 `RUN_FINISHED`，`:1132-1150`）。

interrupt 形状与 engine 一致（`$TS/ai/src/activities/chat/index.ts:2598-2626`）：`{ id: 'approval_'+toolCallId, reason:'tool_call', toolCallId, responseSchema: normalizeApprovalSchema(undefined, inputSchema).responseSchema, metadata: { kind:'approval', toolName, input, [INTERRUPT_BINDING_METADATA_KEY]: { v: INTERRUPT_BINDING_VERSION, kind:'tool-approval', interruptId, toolName, toolCallId, originalArgs, inputSchemaHash: hashSchemaInput(inputSchema), … } } }`；客户端工具 `id:'client_tool_'+toolCallId`、`reason:'tanstack:client_tool_execution'`、`metadata.kind:'client_tool'`（`:2637-2659`）。这些常量都从 `@tanstack/ai/client` 导出（`client.ts:247-248, 356, 392`）。即使 binding 缺失，`interrupt-manager.ts:176-183` 的 legacy 判定也能认出来——DSL 两者都发。

下一轮：客户端 `resolveInterrupt(approved, { editedArgs })` 后重发，`ctx.resume = [{ interruptId, status:'resolved', payload:{ approved, editedArgs? } }]`、`ctx.parentRunId = 上一 runId`；脚本用 `approvalOf(ctx, toolCallId)` 决定发 `tool.result` 还是 `{ error:'User declined tool execution' }`。

demo 用法：`const [fetcher] = useState(() => scripted(script))`（放 state：`ResettableDemo` 重挂即重置 `turn`）。代价：fetcher 模式无 `hydrate/joinRun`——demo 不需要；消费者要测服务端 hydrate 就用真 route。

## 视图层

家法：`data-*` 按 `base-ui-conventions` §2（布尔走 `dataAttr`，状态机枚举拆成名称型存在属性）；`className` 落在纯 DOM 的诚实标 `string`；文案是 children（`shaping-new-parts`：不造 `*Label` props、`Cancel ≠ Clear`、关闭并提交叫 `Close`）；默认文案只在 `PartLabels`/`ByokKeyDialogLabels` 两张一体化表里；change 回调 `(value, eventDetails)` 走 cadenza-ui 导出的 `createChangeEventDetails`/`GenericEventDetails`，reason 复用 Base UI 词表（`item-press`/`none`/`escape-key`/`drag`/`input-paste`/`input-change`/`imperative-action`…）；`ReactNode` 类型的 prop 只有 `children`；受控三件套 `x / defaultX / onXChange` 走 `@gedatou/cadenza-utils` 的 `useControllableState`；每部件 `data-slot` + `XxxProps`（有状态的 + `XxxState`）。

### 组件树（Playground 全貌）

```
ThreadList(index, value/onValueChange)   ScrollArea > ThreadListGroup(children=标题) > ThreadListItem(thread, children=动作区)
                                          动作区：DropdownMenu > ThreadListRename / ThreadListArchive / ThreadListDelete（文案 children；Delete 由 caller 包 AlertDialog）
                                          ThreadListNew(Button) · SearchField(caller 放，过滤 threads 后传入)
TranscriptProvider(status, interrupts, addToolApprovalResponse)
 └─ Transcript                            MessageScrollerProvider autoScroll > MessageScroller > MessageScrollerViewport > MessageScrollerContent(role=log)
     ├─ TranscriptEmpty                   Empty(提升)（children）+ Suggestions（caller 放）
     ├─ TranscriptMessage ×N              MessageScrollerItem(messageId, scrollAnchor=user) > Message(align) > MessageContent > Bubble(muted|ghost)
     │    ├─ TranscriptParts              text→Markdown · thinking→Reasoning · tool-call→ToolCallCard[+ApprovalActions] · media→MediaPart · structured→StructuredOutput · Sources
     │    └─ TranscriptActions(MessageFooter)  TranscriptAction ×N（Copy/Regenerate/Edit）— streaming 时 data-hidden（invisible，不 hidden，避免布局跳变）
     ├─ TranscriptPending                 Marker role=status + shimmer（children）
     ├─ TranscriptError                   role=alert（children：文案 + 重试按钮）
     └─ MessageScrollerButton             caller 直接放 cadenza-ui 的（不包）
QueueList                                 Item ×N + Button → cancelQueued(id)
Composer（<form>）                         InputGroup(has-[>textarea])
 ├─ ComposerAttachments                   AttachmentGroup > Attachment(state) > AttachmentMedia/Title/Description + AttachmentActions > AttachmentAction(aria-label="Remove")
 ├─ ComposerTextarea                      InputGroupTextarea(field-sizing-content)
 └─ ComposerToolbar(InputGroupAddon block-end)
      ComposerAttach · ComposerDictate · ModelPicker · ThinkingLevelPicker · ContextUsage(P2) · Kbd(⏎) · ComposerSubmit(send|stop)
ByokKeyDialog(byok, catalog)              Dialog > DialogHeader/Body/Footer；children 缺省 = 每 provider 一行 ByokKeyDialogProvider；显式组合时行尾可放额外按钮（OpenRouter PKCE）
```

### 部件契约

| 部件 | props（要点） | 组成 / 行为 |
|---|---|---|
| `TranscriptProvider` | `{ status: ChatClientState; interrupts?: readonly ChatInterrupt[]; addToolApprovalResponse?(input); children }` | 只是 context 载体（不包 `useChat`）；`Transcript*`/`TranscriptParts`/`ApprovalActions` 从它读 |
| `Transcript` | `{ children; autoScroll?=true; defaultScrollPosition?='end'; className?: string }`；Viewport 的其它 props（含 `preserveScrollOnPrepend`）透传——seam `MessageScrollerViewportProps = Omit<ComponentProps<typeof Headless.Viewport>,'className'> & { className?: 函数形态 }`（`$CZ/packages/ui/src/components/message-scroller.tsx:74-75`）；**`className` 落在 `MessageScroller` 根 div（string）**，Viewport 的函数 className 不透传 | `MessageScrollerProvider + MessageScroller + MessageScrollerViewport + MessageScrollerContent`（`role="log"`，I1）。回底按钮由 caller 放 `MessageScrollerButton` |
| `TranscriptMessage` | `{ message: UIMessage; align?: 'start' \| 'end'; children?; className?: string }` | `MessageScrollerItem messageId={message.id} scrollAnchor={role==='user'}`；user → `Bubble variant="muted" align="end"`，assistant → `Bubble variant="ghost"`；children 缺省 `<TranscriptParts message={message} />`（默认在场 A 层）；`React.memo` 按 `message` 引用（pi P23 的 React 等价）；`data-role`（值型）、`data-streaming`（本条正在流） |
| `TranscriptParts` | `{ message: UIMessage; className?: string }` | 见 §渲染器注册表 |
| `TranscriptEmpty` / `TranscriptPending` | `{ children; className?: string }` | `Empty` 外壳 / `Marker role="status"` + `shimmer`（`marker.tsx:22-25` 推荐） |
| `TranscriptError` | `{ error: Error; children; className?: string }` | `role="alert"`（I2）；`data-code` = `(error as { code?: string }).code`（`runErrorEventToError` 产出的 `Error & { code? }`）；重试按钮由 caller 在 children 里放 `Button onClick={reload}` |
| `TranscriptActions` / `TranscriptAction` | `TranscriptActions { children; className?: string }`（`role="toolbar"`，放 `MessageFooter` 内；`data-hidden` 当 `status === 'streaming'`）；`TranscriptAction = ButtonProps`（`variant="ghost" size="icon-xs"`），可见文案 = 组合 `Tooltip`（提升），`aria-label` 由 caller 传 | A10 |
| `Markdown` | `{ content: string; streaming?: boolean; translations?: Partial<StreamdownTranslations>; className?: string }` | `<Streamdown mode={streaming?'streaming':'static'} isAnimating={streaming} parseIncompleteMarkdown plugins={{ code, math, cjk }} shikiTheme={['github-light-default','vesper']} controls={{ code:{ copy:true, download:false }, table:{ copy:true, download:false, fullscreen:false } }} dir="auto" />`（props 已在 streamdown 2.6.0 `dist/index.d.ts:526-586` 核对；`code` 来自 `@streamdown/code`）。**边界**：代码块/表格的复制按钮用 streamdown 自带 `controls`（T5），不用我们的 Button 覆盖；`components` 只覆盖 `a`（`target=_blank rel=noreferrer`）；安全 = streamdown 默认 `rehype-harden`；mermaid 不装 |
| `Reasoning` | `{ content; complete: boolean; startedAt?: number; open?; defaultOpen?; onOpenChange?(open, details); children }` | `Collapsible`；未完成默认展开 + `CollapsibleTrigger` 内 `Marker shimmer`（children 文案）；完成瞬间自动折叠一次（`reason:'none'`；用户手动展开后不再自动折叠）；耗时秒数 = `startedAt` 到完成；`data-complete` |
| `ToolCallCard` | `{ part: ToolCallPart; result?: ToolResultPart; interrupt?: ToolApprovalInterrupt; streaming?; open?; defaultOpen?; onOpenChange?; children? }` | `Collapsible` 卡；header = 工具名（数据）+ 状态图标（`Spinner`/check/x，无文字）；body = `Markdown` 的 ```json 输入/输出；`children` 插槽给 `ApprovalActions`（显式组合时状态文案由 caller 放 `Badge`）；名称型状态属性：`data-pending`（awaiting-input/input-streaming/input-complete）、`data-approval-requested`、`data-approval-responded`、`data-complete`、`data-error` |
| `ToolCallGroup` | `{ count: number; children; open?; defaultOpen?=false; onOpenChange? }` | 连续工具调用折叠（G6）；标题文案 children |
| `ApprovalActions` / `ApprovalApprove` / `ApprovalDeny` | `ApprovalActions { interrupt: ToolApprovalInterrupt; children }` 提供 context；`ApprovalApprove { editedArgs?; children } & ButtonProps` → `interrupt.resolveInterrupt(true, { editedArgs })`；`ApprovalDeny { children } & ButtonProps` → `resolveInterrupt(false)`；`interrupt.status !== 'pending'`（`BoundInterruptBase.status: InterruptItemStatus`，`$TS/ai-client/src/types.ts:71`）时两键禁用，`data-approved`/`data-denied` 落在容器 | G3 |
| `MediaPart` | `{ part: ImagePart \| AudioPart \| VideoPart \| DocumentPart; className?: string }` | image → `Attachment` + `AttachmentMedia variant="image"`（data URI）；audio → `<audio controls>`；video → `<video controls>`；document → icon + `AttachmentTitle` |
| `Sources` | `{ sources: Source[]; children; open?; defaultOpen?; onOpenChange? }` | `Collapsible` + `<a>` 列表（T12） |
| `StructuredOutput` | `{ part: StructuredOutputPart; className?: string }` | `status==='streaming'` 显示 `partial` json + `Spinner`；`complete` 显示 `data`（T23） |
| `Composer` | `Omit<ComponentProps<'form'>, 'onSubmit' \| 'onChange' \| 'defaultValue'> & { value?; defaultValue?; onValueChange?(value: string, details); onValueCommitted(value: string, details); status: ChatClientState; onStop?(details); editing?: boolean; onEditCancel?(details); disabled?; onFiles?(files: File[], details: GenericEventDetails<'drag' \| 'input-paste' \| 'input-change'>); children }` —— 根是 `<form>`；`onSubmit` 落入 `Omit` 因为自建提交回调与原生同名（家法 §7.2 判例是 `SearchField`：`Omit` 原生同名后自建 `(value, details)` 版；本包因根是 `<form>` 且语义是「提交文本」，用「提交」回调的家法名 `onValueCommitted`）；附件由 caller 合并（示例见 §接线） | Enter 提交 / Shift+Enter 换行 / `e.isComposing \|\| e.key === 'Process'` 忽略（pi `MessageEditor.ts:64`）/ Escape → `editing ? onEditCancel : onStop`；根上 `onDragOver/onDrop/onPaste` 拦文件 → `onFiles`（C5）；名称型状态：`data-submitted`、`data-streaming`、`data-error`（`ready` = 三者缺席）、`data-dragging`、`data-editing` |
| `ComposerTextarea` / `ComposerToolbar` | `InputGroupTextarea` / `InputGroupAddon align="block-end"` 转出（类型 re-alias） | |
| `ComposerSubmit` | `{ status: ChatClientState; onStop?(details); children? } & ButtonProps` | `status ∈ submitted\|streaming` → 停止图标 + `onStop`；否则 `type="submit"`；空输入禁用（C3）；默认图标无文案 |
| `ComposerAttachments` | `{ items: DraftAttachment[]; onRemove(id, details) }` | `AttachmentGroup` 横条；`state` 映射 `Attachment.state`（C6） |
| `ComposerAttach` | `{ accept?; multiple?=true; onFiles(files, details) } & InputGroupButtonProps` | 隐藏 `<input type=file>`（C4）；角色词命名，不带 Button 后缀 |
| `ComposerDictate` | `{ onRecording(part: AudioPart, details: GenericEventDetails<'imperative-action'>) } & InputGroupButtonProps` | `useAudioRecorder`（`$TS/ai-react/src/use-audio-recorder.ts:18-30`）start/stop；录完把 `recording.part` 交给 caller → `draft.add([part])` |
| `Suggestions` / `SuggestionsItem` | `Suggestions { onValueChange(value: string, details); children }`（值流经根，Base UI Menu/Select 模式）；`SuggestionsItem { value: string; children } & Omit<ButtonProps,'value'>` | 横向 `ScrollArea` 的 chips（C12） |
| `QueueList` | `{ queue: QueuedMessage[]; onCancel(id, details) }` | C14 |
| `ModelPicker` | `{ catalog; value?; defaultValue?; onValueChange(ref, details); byok?: ByokSnapshot; disabledProviders?: readonly string[] }` | `Combobox` 按 provider `ComboboxGroup`，搜索按 `id/name/provider`；项尾图标 + `aria-label` 表示 reasoning/vision（M2/M3），上下文长度为数字；有 `byok` 时缺 key 的 provider 项 `data-key-missing` + 钥匙图标 |
| `ThinkingLevelPicker` | `{ model?: Model; value?; defaultValue?; onValueChange(level, details) }` | `Select`；`supportedThinkingLevels(model).length <= 1` 时不渲染（pi P27）；显示级别标识符（可经 `PartRenderersProvider labels` 覆盖） |
| `ThreadList` 家族 | `ThreadList { index: ThreadIndex; threads: readonly ThreadMeta[]; value?; defaultValue?; onValueChange(id, details); children }`（context：`index`/当前值；`threads` 由 caller 用 `useThreadIndex(index)` 过滤后传入——归档/搜索都是过滤，不开渲染开关）；`ThreadListGroup { children }`；`ThreadListItem { thread: ThreadMeta; children? }`（children = 动作区）；`ThreadListRename { children }`（点击进入行内 `Input`，Enter 提交 / Escape 取消 / blur 提交）/ `ThreadListArchive { children }` / `ThreadListDelete { children }`（各自 `& ButtonProps`，直接调 `index`；删除确认由 caller 包 `AlertDialog`，`AlertDialogClose ×2` 文案 children，不造 Confirm）；`ThreadListNew = ButtonProps`（`index.create()` 后 `onValueChange(id, { reason:'item-press' })`） | 活动行 `aria-current="page"` + `data-active`（I3）；`data-archived` |
| `ByokKeyDialog` / `ByokKeyDialogProvider` | `ByokKeyDialog { byok: ByokClient; catalog: Catalog; open?; defaultOpen?; onOpenChange?(open, details); labels?: Partial<ByokKeyDialogLabels>; children? }`；`ByokKeyDialogProvider { provider: string; children? }`（一行：`FieldLabel` = `provider.label` + `Input type=password` + 状态图标 `data-key-status="empty\|set\|locked\|error"` + coverage 图标 `data-server-key` + Save/Clear/Unlock **图标按钮**（`aria-label` 来自 `labels`，英文默认）；children 追加在行尾） | `useByok(byok)` 取 `snapshot`；`snapshot.prompt` 非空时自动打开并聚焦对应 provider（M10）；children 缺省 = `catalog.providers` 每个一行 `ByokKeyDialogProvider`（默认在场 A 层）；OpenRouter 的「Sign in with OpenRouter」由 docs Playground 显式组合 `<ByokKeyDialogProvider provider="openrouter"><Button onClick={startOpenRouterPkceLogin}>…</Button></ByokKeyDialogProvider>`（`@tanstack/ai-openrouter/pkce` 是浏览器模块，docs 全装 adapter；库内不 import adapter）；`isPasskeyStorageSupported()` 为假时 Playground 隐藏页面级「Remember」开关 |
| `ContextUsage`（P2） | `{ model?: Model; usage: TokenUsage; children? }` | `Progress`（提升）+ `Tooltip` 明细 + `estimateCost` |

### 前置提升（Phase 0，按家法 §8 先判形态）

| primitive | 形态 | 说明 |
|---|---|---|
| `tooltip` | `Tooltip`/`TooltipTrigger`/`TooltipProvider` 转出；`TooltipContent` → **`TooltipPopup`**（cast + `TooltipPopupProps`，JSDoc 注明 vendored 合并了 Positioner+Popup，与 `DropdownMenuPopup`/`DialogPopup` 先例对齐） | 只依赖 `@base-ui/react/tooltip` |
| `badge` | cast：cva 路由，`className` 收窄 `string` 并注明 | |
| `kbd` | `Kbd`/`KbdGroup` 转出 | 纯 DOM |
| `empty` | `Empty*` 转出 | cva，`className` string |
| `item` | `Item*` 转出（内部引 `#primitives/separator` 一并进 dist） | useRender |
| `progress`（P2） | `Progress*` 名已对齐 Base UI，转出 | |

不提升 avatar（`message.mdx` 首字母先例）、skeleton/card/popover/separator（本设计无消费者）。每个 = seam 文件 + `index.ts` 一行 + docs 页（`writing-component-docs` 骨架，母版都有）+ 测试。

## 功能覆盖矩阵（feature-checklist §3）

**Core 31/31**

| # | 功能 | 实现路径 | 依赖 API | demo |
|---|---|---|---|---|
| T1 | 流式文本 | `useChat().messages` + `Markdown streaming` | `useChat` | streaming |
| T2/T3/T5 | Markdown + 高亮 / 数学 / 代码复制 | `Markdown`（streamdown + code/math/cjk 插件；`controls.code.copy`） | F5 | markdown |
| T6 | 角色布局 | `TranscriptMessage` → `Message align` + `Bubble` | cadenza-ui | basic |
| T10 | 推理块 | `Reasoning` + `isThinkingComplete` | `ThinkingPart`（`$TS/ai/src/types.ts:452-457`） | reasoning |
| T14 | 自动滚动 + 回底 | `Transcript`（`MessageScrollerProvider autoScroll`）+ `MessageScrollerButton` | cadenza-ui | basic |
| T17/T18/T19 | 空 / 加载 / 错误 | `TranscriptEmpty` / `TranscriptPending` / `TranscriptError` + `reload()` | `status/error/reload` | states |
| T22 | 消息内附件 | `MediaPart` | `ImagePart` 等（`ai/src/types.ts:217-306`） | attachments-in-message |
| C1/C2 | 自增高 + Enter | `Composer` + `ComposerTextarea` | `InputGroupTextarea` | composer |
| C3 | 发送/停止合一 | `ComposerSubmit` | `stop()` | composer |
| C4/C6/F1 | 附件上传 + 预览条 + 图片 | `ComposerAttach` + `useAttachmentDraft` + `ComposerAttachments` + `fileToContentPart` | `sendMessage({ content })`（`types.ts:392-415`） | attachments |
| C9/M1 | 模型选择/切换 | `ModelPicker` + `useModelSelection` → `forwardedProps` | `types.ts:872` | model-picker |
| A1/A2 | 停止 / 重生成 | `ComposerSubmit` / `TranscriptAction` → `stop()` / `reload()` | `chat-client.ts:2582, 2550` | actions |
| A3 | 复制 | `messageText` + clipboard | 自建 | actions |
| A4 | 编辑重发 | `editAndResend` | `setMessages` | actions |
| G1/G2 | 工具卡片 + 渲染注册 | `ToolCallCard` + `definePartRenderers` | `ToolCallState` 7 态 | tool-call, tool-renderers |
| S1/S4 | 会话列表 / 删除 | `createThreadIndex` + `ThreadList`（`AlertDialog` 由 caller 包） | 自建 | threads |
| I1/I2/I4 | live region / alert / aria | `MessageScrollerContent role=log` / `TranscriptError role=alert` / `aria-label` + `MarkerIcon aria-hidden` | | basic, states, actions |
| I9 | 主题 | streamdown 用 shadcn token，`shikiTheme` 双主题；docs `next-themes` | | markdown |
| I10 | 响应式 | Playground：`md:` 以下 `ThreadList` 收进 `Dialog`（`DialogBody` 滚动）；`useIsMobile` 是 vendored hook 不导出，用 CSS 断点 | | playground |

**Standard 40/46**（有实现路径的；`阶段` 列即 demo 交付阶段）

| # | 功能 | 实现路径 | 阶段 / demo |
|---|---|---|---|
| T3 | 数学 | 见 Core 表 T2/T3/T5 行 | P1 markdown |
| T7/T9 | 分组 / 标记行 | `ToolCallGroup`；`Marker separator` 日期分隔（demo 自绘） | P2 tool-group |
| T12/G9 | 来源 / 搜索结果 | `sourcesOf` + `Sources`（Anthropic 先） | P2 sources |
| T16 | 历史前插 | `Transcript` 透传 `preserveScrollOnPrepend` | P3 API 表 + threads 分页 demo |
| T24 | 生成式 UI | `definePartRenderers.toolCall[name]` | P1 tool-renderers |
| T25/S12 | 导出 / 导入 | `messagesToMarkdown`；JSON 导入 = `setMessages` | P2 export |
| C5 | 拖放/粘贴 | `Composer onFiles` | P1 attachments |
| C10 | 思考强度 | `ThinkingLevelPicker` + `forwardedProps.thinking` → `preset.thinking()` | P1 thinking-levels |
| C11 | 听写 | `ComposerDictate`（录音，P1）+ `createTranscriptionHandler`（P3） | P1 dictate |
| C12 | 建议 chips | `Suggestions` | P1 suggestions |
| C14 | 排队 | `QueueList` + `useChat({ queue })` | P2 queue |
| C15 | 草稿 | `useStoredState` | P2 draft |
| C16 | 编辑态 composer | `Composer editing` + Escape → `onEditCancel` | P1 actions |
| A8 | 反馈 | `TranscriptAction` 👍/👎 + `onFeedback(value, details)` 回调；存储归宿主（docs `useStoredState`） | P2 actions（追加） |
| A9 | 朗读 | `speechSynthesis.speak(messageText(m))`（浏览器兜底） | P2 actions（追加） |
| A10/A12 | 动作栏隐藏 / 清空 | `TranscriptActions data-hidden` / `clear()` | P1 actions |
| G3 | 审批 | `ApprovalActions` + `interrupts[]`（`editedArgs`） | P1 approval |
| G5 | 客户端工具 | `useChat({ tools: [toolDefinition().client(execute)] })` | P1 client-tool |
| G6 | 工具分组 | `ToolCallGroup` | P2 tool-group |
| M2 | 模型搜索/分组 | `ModelPicker` | P1 model-picker |
| M4/M10 | BYOK / 缺 key 引导 | `createByok` + `ByokKeyDialog` + `useChat({ byok, byokProvider })`；无 key：`prepare()` 弹窗（fetcher 不跑）；有 key 但服务端 401：`assertResponseOk` → `ByokMissingError` → `byok.request`（`connection-adapters.ts:502-515`；`chat-client.ts:2428-2431`） | P1 byok-dialog；P1 playground |
| M6 | 自定义 provider | `openaiCompatiblePreset` + `Catalog.withProvider` | P2 providers 页配方 + playground |
| M8 | 系统提示 | `createChatHandler({ systemPrompts })` | P1 playground |
| S2/S3/S5/S6 | 自动标题 / 重命名 / 归档 / 搜索 | `threadTitleFrom` in `threadPersistence` / `ThreadListRename` / `ThreadListArchive` / `SearchField` 过滤 `threads` | P1 threads |
| S9 | 本地持久化 | `indexedDBPersistence` + `threadPersistence` | P1 persistence |
| F2/F5 | 文档上传 / 媒体类别 | `fileToContentPart` → `DocumentPart`（不抽文本）/ `AttachmentMedia variant` | P1 attachments |
| O1 | token/费用 | `useUsageTracker` + `estimateCost`（P1）+ `ContextUsage`（P2） | P1 usage |
| I3/I5/I6 | aria-current / 键盘导航 / 快捷键表 | `ThreadListItem` / `Combobox`、`DropdownMenu` 自带 / composer 页 `## 键盘交互` + `Kbd` | P1 |
| I7 | i18n | 组合部件零默认文案（children）；默认渲染器 `PartLabels`；`Markdown translations`；docs 双语 | P1 |

**Standard 只点名不做（6）**：T21 生成图（`useGenerateImage` 转出）、A5 分支（v2）、G8 MCP（服务端 `chat({ mcp })` 配方，server-only）、G11 Artifacts（`onCustomEvent('artifact.created')` 点名）、S10 服务端持久化（`createChatHandler({ persistence })` 配方）、O2 连接状态（`connectionStatus` 仅 `live` 有意义）。

**进 v1 的 Advanced**：T15 轮次锚定（`scrollAnchor`）、T20 中止态（`RUN_ERROR code:'aborted'` → `TranscriptError data-code="aborted"`）、T23 结构化输出、T26 消息级费用、C17 快捷键提示、O5 脚本化 transport、M5 OpenRouter PKCE（docs 组合）、G4 通用中断（API 表点名）。

## 行为规范（由测试锁定）

1. **白名单**：服务端只从 `forwardedProps` 读 `provider/model/thinking`；`modelOptions` 永远由 `preset.thinking()` 生成；缺席回落 `defaultModel`。
2. **BYOK relay**：key 只在 `x-byok-<id>` 头；头优先、env 兜底；缺 key 且 `keyRequired` → 401 `byok_missing`；`keyRequired:false` 的 provider 客户端立即 coverage 放行。
3. **thinking**：`clampThinkingLevel` 向下取最近支持档；不可关模型最低 `'low'`；映射表按附录 A 快照锁定（7 级）。
4. **usage**：按 run 累加每个 `RUN_FINISHED` 的 usage，`onFinish` 归到最后一条 assistant 消息；不写进 parts/metadata。
5. **审批**：判别键 `metadata.kind`；优先 `interrupts[].resolveInterrupt`，无则 `addToolApprovalResponse`；已响应禁用。
6. **脚本化 transport**：走 `fetcher`；不发 `MESSAGES_SNAPSHOT`；`stop()` 后不再 yield；`turn` 随 fetcher 实例；`byokMissing()` 返回 401 触发 `byok.request`。
7. **视图家法**：组合部件零默认文案、默认渲染器文案只在 `PartLabels`；`(value, eventDetails)` 第二参必填；名称型 data 属性；`Composer` 根 `<form>` 且 `Omit<'onSubmit'>`；缺 context 抛品牌前缀错误。
8. **线程索引**：`touch` 对未知 id upsert；`threadPersistence.setItem` 后 `list()` 含该 id。

## docs 分区（`docs/content/docs/ai/`）

| 文件 | 标题 zh / en | 一句话 | hero | demo |
|---|---|---|---|---|
| `meta.json` / `meta.en.json` | `AI 会话` / `AI Chat`；`pages: ["conversation","parts","composer","threads","providers","scripted","playground"]` | | | |
| `conversation.mdx` | 会话 / Conversation | 指南 + Transcript 家族 | `ai/basic` | 7 |
| `parts.mdx` | 消息部件 / Message Parts | Markdown、推理、工具、审批、附件、来源、结构化输出 | `ai/tool-call` | 10 |
| `composer.mdx` | 输入区 / Composer | 输入、附件、模型、建议、排队、草稿、听写 | `ai/composer` | 7 |
| `threads.mdx` | 会话列表 / Threads | 索引、持久化、导入导出 | `ai/threads` | 2 |
| `providers.mdx` | 接入提供者 / Providers | 目录、thinking、BYOK、route handler、自定义 provider | `ai/catalog` | 3 |
| `scripted.mdx` | 脚本化传输 / Scripted Transport | `./mock` DSL 参考 | `ai/scripted-basic` | 2 |
| `playground.mdx` | 试玩 / Playground | 真实 BYOK 会话 | `ai/playground` | 1 |

骨架规则（`writing-component-docs`）：frontmatter 只有 `title/description`；hero `<ComponentPreview align="stretch">` 紧跟 frontmatter（复用该页首个 demo，不为 hero 单造）；`## 使用` 必写；尾部固定顺序「什么时候用 → 状态与 className → 键盘交互 → 导出的类型 → Props」，**`## Props` 永远是最后一个 H2**（每个记录的部件一个 H3 + 顺序规则行）；不记录部件的纯指南页（`scripted`、`playground`）以 `## API` 收尾；zh/en 1:1；demo 英文文案。

`conversation.mdx`（镜像 `tanstack-form.mdx:6-100`；记录 `Transcript*` 九部件）：

```
<ComponentPreview name="ai/basic" align="stretch" />
开篇：装 @gedatou/cadenza-ai 而不是直接装 TanStack AI；API 原样、惯例做默认；demo 全部无密钥（链到 /docs/ai/scripted）
## 使用        pnpm add @gedatou/cadenza-ai；import；最小 JSX；styles.css 与 @source 三行
## 思路        状态归 useChat；渲染归 parts 注册表；传输归 fetcher/connection；惯例归门面（线程索引 / 选择 / usage / 编辑重发）
## 解剖        hero 的完整组件树 + 每个部件职责
## 会话        ### 连接（fetcher: scripted 或 fetchServerSentEvents）→ ### 渲染消息 → ### 输入 → ### 完成（<ComponentSource name="ai/basic" />）
## 流式        → ai/streaming
## Markdown    → ai/markdown
## 空态、加载态与错误态 → ai/states
## 消息动作    → ai/actions
## 用量与费用  → ai/usage
## 本地持久化  → ai/persistence
## 状态与 className   data-slot ↔ 部件；data-role / data-streaming / data-hidden / data-code
## 键盘交互    表
## 导出的类型  root 新增导出全表（目录 / 运行时 / hooks）
## Props       TranscriptProvider / Transcript / TranscriptMessage / TranscriptParts / TranscriptActions / TranscriptAction / TranscriptEmpty / TranscriptError / TranscriptPending 各 H3
```

其余页的 H2 串：
- `parts`：使用 → 组成 → 推理 → 工具调用 → 工具渲染器 → 审批 → 客户端工具 → 分组 → 附件 → 来源 → 结构化输出 → 自定义事件 → 默认文案（`PartLabels` 全表）→ 状态与 className → Props（Markdown / Reasoning / ToolCallCard / ToolCallGroup / ApprovalActions·Approve·Deny / MediaPart / Sources / StructuredOutput）
- `composer`：使用 → 组成 → 附件 → 模型与思考强度 → 建议 → 排队 → 草稿 → 听写 → 状态与 className → 键盘交互 → Props（Composer 家族 / Suggestions / QueueList / ModelPicker / ThinkingLevelPicker）
- `threads`：使用 → 思路 → 会话列表 → 导入导出 → 服务端持久化（配方）→ 状态与 className → Props（ThreadList 家族）
- `providers`：使用 → 思路 → 模型目录 → 思考强度 → 密钥 → Route handler（配方）→ 环境变量（配方）→ 自定义 provider（配方：`openaiCompatiblePreset`/`definePreset`）→ MCP（配方）→ 不接入的 harness → 状态与 className → 导出的类型（`server`/`providers` 子入口全表）→ Props（ByokKeyDialog / ByokKeyDialogProvider）
- `scripted`：使用 → 思路 → 步骤 → 多轮 → 测试 → API
- `playground`：使用 → 思路 → 限制 → API

demo 清单（`docs/demos/ai/`，共享 `scripts.ts` / `chat-shell.tsx` / `tools.ts`；每个 default export、顶部注释写「证明什么」、注册进 `docs/demos/index.tsx`；共 32 个）：

| key | 阶段 | 证明什么 | 用到的导出 |
|---|---|---|---|
| `ai/basic` | P1 | hero：推理 → 工具 → Markdown 回复 → 动作栏，滚动跟随 | TranscriptProvider, Transcript*, TranscriptParts, Composer*, TranscriptActions, defaultCatalog |
| `ai/streaming` | P1 | 逐词流 + 停止；停止后 status 回 ready | ComposerSubmit, stop |
| `ai/markdown` | P1 | GFM 表格、代码块复制、KaTeX、CJK、流式不完整修复、明暗主题 | Markdown |
| `ai/states` | P1 | 空态 + 建议；TranscriptPending；`error('Rate limited','429')` → TranscriptError → Retry 成功；aborted | TranscriptEmpty, TranscriptPending, TranscriptError, Suggestions |
| `ai/actions` | P1（反馈/朗读 P2 追加） | 复制 / 重生成 / 编辑重发截断（editing + Escape）/ 清空 / 流式隐藏 | TranscriptActions, TranscriptAction, messageText, editAndResend, reload, clear |
| `ai/usage` | P1（ContextUsage P2 追加） | 每条消息 token/费用；多轮累加 | useUsageTracker, estimateCost, ContextUsage |
| `ai/persistence` | P1 | `indexedDBPersistence` + 刷新页面对话还在（Reset 同时清库） | indexedDBPersistence, threadPersistence |
| `ai/reasoning` | P1 | 流式展开 + shimmer，完成自动折叠 + 耗时；手动展开后不再自动折叠 | Reasoning, isThinkingComplete |
| `ai/tool-call` | P1 | 7 态逐一（argsChunk 分片、成功、失败） | ToolCallCard |
| `ai/tool-renderers` | P1 | 按名自定义卡片 vs default 回退；不完整参数；`labels` 覆盖 | definePartRenderers, PartRenderersProvider, usePartRenderers |
| `ai/approval` | P1 | Approve / Deny / 编辑参数后 Approve；批门控提示 | ApprovalActions, ApprovalApprove, ApprovalDeny |
| `ai/client-tool` | P1 | 浏览器执行 `get_viewport` 自动回传；`addToolResult` 手动路径 | toolDefinition, addToolResult |
| `ai/tool-group` | P2 | 3 个连续工具折叠 | ToolCallGroup |
| `ai/attachments-in-message` | P1 | user 消息含 image/document/audio part 的渲染 | MediaPart |
| `ai/sources` | P2 | providerExecuted web_search → Sources | Sources, sourcesOf |
| `ai/structured-output` | P2 | `useChat({ outputSchema })` 的 partial → final | StructuredOutput |
| `ai/custom-events` | P1 | `onCustomEvent` 驱动进度条 | onCustomEvent |
| `ai/composer` | P1 | 自增高、Enter/Shift+Enter、IME、发送/停止、Kbd | Composer, ComposerTextarea, ComposerToolbar, ComposerSubmit |
| `ai/attachments` | P1 | 按钮 / 拖放 / 粘贴 / 超限报错 / 预览条 / 移除 / 成为 part | ComposerAttach, ComposerAttachments, useAttachmentDraft, fileToContentPart, DEFAULT_MAX_ATTACHMENT_BYTES |
| `ai/model-picker` | P1 | 切模型 → 回复复述 `data.model`；切到无推理模型时 ThinkingLevelPicker 消失；切模型后立刻发送不丢 | ModelPicker, ThinkingLevelPicker, useModelSelection |
| `ai/thinking-levels` | P1 | 选模型 → 可用级别变化 → clamp 收敛（7 级） | supportedThinkingLevels, clampThinkingLevel, THINKING_LEVELS |
| `ai/suggestions` | P1 | 点 chip 即发送 | Suggestions, SuggestionsItem |
| `ai/queue` | P2 | 流式中连发三条：queue / drop / interrupt；取消排队 | QueueList, queue, cancelQueued |
| `ai/draft` | P2 | 输入一半切线程再切回，草稿还在 | useStoredState |
| `ai/dictate` | P1 | 录音 → AudioPart 进附件条 → 发送 | ComposerDictate, useAudioRecorder |
| `ai/threads` | P1 | 新建/切换（key 重挂）/重命名/归档/删除确认/搜索/按天分组/自动标题 | createThreadIndex, useThreadIndex, threadPersistence, groupThreadsByDay, threadTitleFrom, ThreadList* |
| `ai/export` | P2 | 导出 Markdown / JSON；导入 JSON | messagesToMarkdown, setMessages |
| `ai/catalog` | P1 | 目录表：provider × model × 能力 × 思考级；`withProvider` 加自定义 provider | providers, createCatalog, modelRef, parseModelRef |
| `ai/byok-dialog` | P1 | 四种 KeyStatus；有 key 但服务端 401（脚本 `return byokMissing('openai')`）→ 对话框弹出；coverage 标 | createByok, ByokKeyDialog, ByokKeyDialogProvider, useByok, byokMissing |
| `ai/scripted-basic` / `ai/scripted-routing` | P1 | 所有步骤构造器各来一次 / `respond` + `sequence` + `echo` + `approvalOf` | mock 全部 |
| `ai/playground` | P1 | 真实：ThreadList + Transcript + Composer + ModelPicker + ByokKeyDialog + `fetchServerSentEvents('/api/ai/chat')` + `useServerCoverage` | 全家 |

Reset 约定：每个 demo 外层 `ResettableDemo`（搬到 `docs/demos/lib/`），`key` 递增重挂 → `useChat` 重建、`useState(() => scripted(...))` 归零；持久化类 demo 传 `onReset` 清自己的 IndexedDB/localStorage；每个 demo 独立 `databaseName`/`keyPrefix`（同页多 demo 不串台）。`ComponentPreview` 不改；Playground 传 `previewClassName="min-block-160"`（`align="stretch"` 容器已带 `data-[align=stretch]:block-auto`，`block-160` 会被压掉；实施时 grep 产物 CSS 确认 `min-block-160` 生成）。

route 清单：

| 路由 | 方法 | 用途 | Phase |
|---|---|---|---|
| `docs/app/api/ai/chat/route.ts` | POST / GET | `createChatHandler`（12 preset，`VERCEL=1` 时 ollama 自动剔除；`export const maxDuration = 300`，按 Vercel 计划调） | 1 |
| `docs/app/api/ai/catalog/route.ts` | GET | `createCatalogHandler` → providers + coverage | 1 |
| `docs/app/api/ai/transcription/route.ts` | POST | 听写转写（BYOK openai） | 3 |

## 测试（`packages/ai/test/`，根 vitest 自动包含，jsdom）

| 文件 | 覆盖 |
|---|---|
| `catalog-drift.test.ts`（`// @vitest-environment node`） | 每个 catalog 文件的 `models[].id` ⊆ 对应 adapter 常量数组（`OPENAI_CHAT_MODELS` 等；ollama/llmgateway 开放字符串不断言）；`preset.byok.id/env` 与 `xxxByok` 一致；`isProviderId(id)` |
| `thinking.test.ts` | `supportedThinkingLevels/clampThinkingLevel` 边界（Fable 5 最低 `'low'`，`'xhigh'` 只在支持的模型上不被 clamp）；每个 preset 的 `thinking(level, model)` 对 7 级 × 代表模型 `toMatchInlineSnapshot`（附录 A 是它的真源） |
| `selection.test.ts`（node） | `pickSelection`：三键白名单、`defaultModel` 回落、注入用例（`modelOptions.tools`、`provider:'../x'`、超长 model）、ollama 目录外 id 放行 |
| `chat-handler.test.ts`（node） | 直接 `POST(new Request(...))`：坏 JSON → 400（C8）；未知 provider/model → 400；缺 key → 401 `byok_missing`（`isByokMissingBody`）；`content-length` 超限 → 413；fake preset（`create` 返回手写 `chatStream` 的假 adapter）→ 200 `text/event-stream` 且事件序列正确；`onSelect` 返回 Response 短路；`VERCEL=1` 时 local preset 被过滤；`durability` 被包成 `{ adapter }` |
| `catalog-handler.test.ts`（node） | coverage 对 `keyRequired:false` 恒 true；env 有值 → true；vertex 特判（只有 project 无 location → false） |
| `scripted.test.ts` | DSL → chunk 序列（`pace:'instant'`）；用真实 `new ChatClient({ fetcher })`（`chat-client.ts:333`）跑端到端：`ToolCallPart.state` 走完 7 态；审批：第一轮 `RUN_FINISHED.outcome.interrupts[0].metadata.kind === 'approval'`，`resolveInterrupt(true, { editedArgs })` 后第二轮 `ctx.resume` 与 `parentRunId` 正确；`signal.abort()` 后不再 yield；`byokMissing()` 让 client 调 `byok.request('openai','missing')` |
| `threads.test.ts` | `createThreadIndex({ storage:'memory' })` 与 `'local'`（jsdom localStorage）：create/touch(upsert)/rename/archive/remove/subscribe、`storage` 事件；`threadPersistence` 包装后 `setItem` 未知 id → `list()` 含之；`groupThreadsByDay` |
| `usage.test.ts` | `useUsageTracker`：`usage[]` 与 `TokenUsage` 两形状、多轮累加、`byMessage` 归属 |
| `renderers.test.tsx` | 按名命中 / default 回退 / 不完整 JSON 不抛 / `labels` 覆盖 / 缺 Provider 用默认对象 |
| `messages.test.ts` | `messageText` / `messagesToMarkdown` / `editAndResend` 截断位置 / `isThinkingComplete` 三条判定 / `sourcesOf` |
| `byok.test.ts` | `createByok({ catalog })` 立即对 `keyRequired:false` 的 provider 设 coverage → `prepare('vertex')` 不抛 |
| `view.test.tsx` | Composer：Enter 提交、Shift+Enter 换行、`isComposing` 忽略、拖放调 `onFiles(files, details)`、`onValueCommitted` 第二参存在、`editing` 时 Escape 走 `onEditCancel`；TranscriptError `role=alert` + `data-code`；缺 `TranscriptProvider` 时 `Transcript` 抛品牌前缀错误；ByokKeyDialog 在 `snapshot.prompt` 时打开（`memoryStorage` + `byok.request('openai','missing')`）；ThreadListRename Enter/Escape/blur；ToolCallCard 名称型 data 属性；ApprovalActions 已响应禁用；ModelPicker/ThinkingLevelPicker `defaultValue` 非受控 |

docs 端不写单测；IME / 拖放 / 按压类用 Playwright 真浏览器验证（memory：jsdom 合成指针不可信）。每个 PR 限定路径跑 `eslint packages/ai docs/demos/ai docs/app/api/ai` + `vitest run packages/ai`（全仓 lint 会被 `.gitnexus` 缓存绊倒）。

## 风险、取舍与开放问题

**O1–O8 裁定**：O1 localStorage 索引 + `indexedDBPersistence` 正文，服务端持久化只文档化；O2 v1 线性（附录 B 为 v2）；O3 `./mock` 子入口（只有 fetcher 形态）；O4 注册表 + 组合部件，`useChat` 直接暴露；O5 客户端 `onChunk` 按 run 累加；O6 不接 durable stream，留口；O7 base64 直传、3 MB/条、不抽文本、按 `Model.input` 门控；O8 realtime/图像/MCP Apps/`live` 只进 API 表，听写 P3。

**Q1–Q3 推荐**（待用户拍板）：Q1 纯 BYOK + 明确引导；`getByokKey` 的 env 兜底就是「可选服务端 key」，docs 部署不配 env 即纯 BYOK，配了即零配置试用（会产生费用、无限流——若配，P3 加按 IP 限流中间件）。Q2 线性进 v1，树 v2。Q3 `@gedatou/cadenza-ai`。

**风险与可验证假设**：

1. **streamdown `@source` 路径**：docs 侧 `@source '../node_modules/streamdown/dist/*.js'`（docs 直接依赖 streamdown 使符号链接存在）；消费者侧按 streamdown README 自己加。假设：Tailwind 4.3 能穿过 pnpm 符号链接扫到；失败信号：`Markdown` 无样式 → 改用 `.pnpm` 真实路径或把 streamdown 挪成 peer。首个 PR 用 memory 的「grep 产物 CSS」验证。
2. **Next 16 打包 ESM-only adapter**（`ollama` 引 `node:fs`、bedrock 动态 import AWS SDK）：假设默认打包通过；失败信号：`next build` 报错 → `serverExternalPackages: ['@tanstack/ai-bedrock', 'ollama']`（Next 16 有该配置项文档）。
3. **附件上限 3 MB**：来自 Vercel 函数请求体 4.5 MB 的平台事实；实施时做一次真实 413 实验后把数字写进 `composer.mdx`。
4. **thinking 分代**：以 `AnthropicChatModelProviderOptionsByName` 的逐模型映射为唯一真源（按前缀猜会猜错：opus-5 / opus-5-fast 反而回到 budget 代）；Gemini 2.5/3.x 按 id；新模型发布即漂移，`Model.thinkingLevels` 与映射函数同文件、快照测试。
5. **元数据表（cost/contextWindow）手抄**自各 adapter `model-meta.ts`（不导出）：记 `sourceVersion`，升级 adapter 时 diff；`catalog-drift.test` 只能发现「删了模型」，发现不了「价格变了」。
6. **`passkeyStorage` 在 https docs 下触发 WebAuthn 注册**：默认 `persistent:false`（memoryStorage），页面级开关 + 重挂。
7. **`maxDuration`** 与 Vercel 计划挂钩（Hobby 60s / Pro 300s）；Playground 页写明。
8. **流式性能**：假设单条 20 KB markdown 逐字更新 60 fps；失败信号：Playground 长回复掉帧 → `useChat` 加 `streamProcessor.chunkStrategy: WordBoundaryStrategy`。
9. **Gemini 2.5 `thinkingBudget: 0`、Anthropic 各代 budget 上限**：类型只约束 number，API 行为实施时用真实 key 各打一次。

**评审未决、本文裁定的家法问题**：

- change 回调：cadenza-ai 视图部件按 seam 标准执行 `(value, eventDetails)`，用 cadenza-ui 的 `createChangeEventDetails`/`GenericEventDetails`；reason 只用 Base UI 词表，不造新词。
- `Message*` 前缀：改用 `Transcript*`（含 `TranscriptParts`、`TranscriptPending`）。
- 工具状态 data 属性：名称型；`Composer` 同理（`data-submitted/data-streaming/data-error`）。
- 库内默认文案：组合部件零默认；默认渲染器与 `ByokKeyDialog` 的一体化路径用 `labels` 表（`*Label` 豁免）；`aria-label` 英文默认可覆盖；streamdown 走 `translations`。
- `Composer` 提交回调：`onValueCommitted(text, details)`，根 `<form>` `Omit<'onSubmit' | 'onChange' | 'defaultValue'>`；附件由 caller 合并。
- `./mock` 只有 fetcher 形态；需要 `hydrate` 的场景用真 route。
- `ByokKeyDialog` 的扩展点：按位置组合的 `ByokKeyDialogProvider` 行部件（`findComposedPart` 未从 cadenza-ui 导出，不用标记部件提升）。
- 响应式：Playground 层用 `md:` 断点 + `Dialog`；库内部件不做断点。

## 分阶段计划

**Phase 0 — 前置（2 PR）**
- PR-0a `feat(ui): promote tooltip, badge, kbd, empty, item`：5 个 seam（形态见 §前置提升）+ barrel + docs 页 + 测试。
- PR-0b `chore: add tanstack ai catalog entries and move ResettableDemo`：catalog 依赖、`docs/demos/lib/resettable.tsx`（含 `onReset`）、11 处 import。

**Phase 1 — Core + 真实 provider（5 PR）**
- PR-1 `feat(ai): scaffold package with catalog, mock transport and thinking map`：包骨架、C3 接线、catalog 12 家（元数据只填旗舰 4–8 个/provider）、`./mock` + `scripted.test`、`thinking.ts` + 快照测试、`catalog-drift.test`。
- PR-2 `feat(ai): server handler and first providers`：`./server`（`createChatHandler`/`pickSelection`/`createCatalogHandler`）+ `providers/{openai,anthropic,gemini,openrouter}` + `chat-handler.test`；docs 站 `/api/ai/chat`、`/api/ai/catalog` 上线并用真实 key `curl` 走通（实测 ESM 打包与 `@source`）。
- PR-3 `feat(ai): runtime conventions`：threads / selection / usage / renderers（含 `PartLabels`）/ attachments / messages / byok / stored-state + 测试。
- PR-4 `feat(ai): transcript, parts, composer, thread list and byok views`：TranscriptProvider + Transcript*、Markdown、Reasoning、ToolCallCard/Group、ApprovalActions、MediaPart、TranscriptActions、Composer 家族、Suggestions、QueueList、ModelPicker/ThinkingLevelPicker、**ThreadList 家族**、ByokKeyDialog + `view.test`。
- PR-5 `docs(ai): conversation, parts, composer, threads, scripted pages and playground`：6 页 zh/en（providers 页的 route/BYOK 配方节随本 PR，逐 provider 表随 PR-6 补全），P1 标记的 24 个 demo + `ai/playground`，README。

Phase 1 结束 = Core 31 项全绿（含 S1/S4）+ Playground 可用 openai/anthropic/gemini/openrouter。

**Phase 2 — Standard（3 PR）**
- PR-6 `feat(ai): remaining providers`：grok/groq/mistral/vercel-gateway/llmgateway/bedrock/vertex/ollama/openai-compatible/byteplus(预留) + `discoverModels` + providers 页逐 provider 表。
- PR-7 `feat(ai): sources, structured output, export and usage ui`：`Sources`、`StructuredOutput`、`ContextUsage`（含提升 progress）、导入导出 + `ai/sources`、`ai/structured-output`、`ai/export` demo、`ai/usage` 追加。
- PR-8 `feat(ai): queue, drafts, feedback, tool groups`：`ai/queue`、`ai/draft`、`ai/tool-group`，`ai/actions` 追加反馈/朗读。

**Phase 3 — Advanced（按需，各 1 PR）**：`createTranscriptionHandler` + Playground 听写与 `useSummarize` 自动标题；`preserveScrollOnPrepend` 分页加载 demo；OpenRouter PKCE 组合进 Playground；persistence/durability 配方节补 `memoryPersistence` 示例；MCP 配方节；`live` 多 tab 说明；byteplus preset 实装；限流中间件（若配服务端 key）。

## 附录 A：thinking 映射表（`preset.thinking(level, model)` 的真源）

`'off'` 一律不发推理参数（Anthropic 可关代显式 `thinking:{type:'disabled'}`）；`L` 为 clamp 后的级别（7 级：off/minimal/low/medium/high/xhigh/max）。

| provider | 片段 | 类型出处 |
|---|---|---|
| openai | `{ reasoning: { effort: L, summary: 'auto' } }`，minimal→`'minimal'`、low/medium/high 同名、xhigh/max→`'high'`；非推理模型 `{}` | `$TS/ai-openai/src/text/text-provider-options.ts:151-177` |
| anthropic budget 代（opus-4-5 / sonnet-4-5 / haiku-4-5 / opus-4-1 / opus-5 / opus-5-fast） | `{ thinking: { type:'enabled', budget_tokens: B } }`，B = minimal 1024 / low 4096 / medium 16000 / high 32000 / xhigh 48000 / max 64000（须 `< max_tokens`，adapter 缺省取模型 `max_output_tokens`）；off → `{ thinking:{ type:'disabled' } }` | `AnthropicThinkingOptions`（`:114-134`）；by-name `model-meta.ts` `AnthropicChatModelProviderOptionsByName`（opus-5 / opus-5-fast `:816-831` 同样是 `AnthropicThinkingOptions & AnthropicSamplingOptions`） |
| anthropic 4.6（opus-4-6 / sonnet-4-6） | `{ thinking: { type:'adaptive', display:'summarized' } }`（无 effort 分级：by-name 类型不含 `AnthropicEffortOptions`）；off → disabled；`thinkingLevels: ['off','medium']` | `AnthropicAdaptiveThinkingOptions`（`:136-170`）；by-name `:707-728` |
| anthropic 4.7+ / Sonnet 5（opus-4-7 / opus-4-8 / sonnet-5） | `{ thinking: { type:'adaptive', display:'summarized' }, output_config: { effort: E } }`，E = minimal→`'low'`、low/medium/high/xhigh/max 同名；off → `{ thinking:{ type:'disabled' } }` | `AnthropicAdaptiveOrDisabledThinkingOptions`（`:207-227`）+ `AnthropicOutputConfigOptions`（`:249-271`）；by-name opus-4-7 `:770-779`、opus-4-8 `:780-789`、sonnet-5 `:806-815` |
| anthropic Fable 5（claude-fable-5） | 同上但**不可关**：`thinkingLevels: ['low','medium','high','xhigh','max']`，off/minimal 被 clamp 到 `'low'`；`thinking:{type:'adaptive',display:'summarized'}` | `AnthropicAdaptiveOnlyThinkingOptions`（`:182-195`）；by-name `:793-802` |
| gemini 3.x | `{ thinkingConfig: { includeThoughts: true, thinkingLevel: K } }`，K = minimal→`'MINIMAL'`、low→`'LOW'`、medium→`'MEDIUM'`、high/xhigh/max→`'HIGH'` | `$TS/ai-gemini/src/text/text-provider-options.ts:235-251`；`@google/genai` `ThinkingLevel` 枚举 |
| gemini 2.5 | `{ thinkingConfig: { includeThoughts: true, thinkingBudget: B } }`，B = minimal 1024 / low 4096 / medium 8192 / high 16384 / xhigh 20480 / max 24576；off → `thinkingBudget: 0` | 同上 |
| vertex | 同 gemini（复用函数） | |
| grok | `{ reasoning: { effort: L' } }`，L' ∈ low/medium/high（minimal→low，xhigh/max→high）；off → `{ reasoning: { effort:'none' } }`；`grok-build-*` 返回 `{}` | `$TS/ai-grok/src/text/text-provider-options.ts:11-17, 82` |
| groq | `{ reasoning_effort: L', reasoning_format:'parsed' }`，L' ∈ low/medium/high（minimal→low，xhigh/max→high）；off → `{ reasoning_effort:'none' }`；**不发 `include_reasoning`**（与 `reasoning_format` 互斥，`:50-54, 102-104`）；只对 `reasoning:true` 的模型发 | `$TS/ai-groq/src/text/text-provider-options.ts:98-104` |
| openrouter | `{ reasoning: { effort: L } }`（none/minimal/low/medium/high/xhigh/max 原样）；off → `{ reasoning: { enabled: false } }`（adapter 规范化为 `effort:'none'`） | `$TS/ai-openrouter/src/text/text-provider-options.ts:29-38, 99`；`@openrouter/sdk` `ReasoningEffort` |
| vercel-gateway | `{ reasoning: { effort: L' }, include_reasoning: true }`，L' 同 openai（xhigh/max→high） | `$TS/ai-vercel-gateway/src/text/text-provider-options.ts:38-39` |
| llmgateway | `{ reasoning_effort: L }`（含 xhigh/max 原样） | `$TS/ai-llmgateway/src/text/text-provider-options.ts:57-66` |
| bedrock（Converse 默认） | `{}`；`thinkingLevels: ['off']`（chat/responses API 才有 `reasoning_effort`） | `$TS/ai-bedrock/src/converse/provider-options.ts:10-19` |
| ollama | gpt-oss 系 `{ think: 'low'\|'medium'\|'high' }`（minimal→low，xhigh/max→high）；其它 `{ think: true }`；off → `{ think: false }` | `$TS/ai-ollama/src/meta/models-meta.ts:74-80` |
| mistral | `{}`；`thinkingLevels: ['off']` | 无设置项 |
| openai-compatible | 消费者传 `thinking?`；默认 `{ reasoning_effort: L }`，只在 `Model.reasoning` 时发 | — |

## 附录 B：v2 分支树实施笔记（不进 v1）

pi P16 的 `{ id, parentId }` 树 + leaf 指针可以完全藏在 TanStack `ChatClientPersistence` 之下，`useChat` 无感：

- 事实：`ChatPersistor.writeState()` 每次写**整份** `{ messages, resume? }`（`$TS/ai-client/src/client-persistor.ts:89-116`）；同步 `getItem` 覆盖 `initialMessages`（`chat-client.ts:603-608`）。
- `treePersistence(store, threadId, { leafId })`：`getItem` 返回从 leaf 回溯到根的 message 条目；`setItem` 做 diff-append：(1) 取 path；(2) 最长公共前缀 k（按 `message.id`）；(3) `i < k` 内容变了原地更新（流式增量、tool result、approval 写回都是同 id）；(4) `i >= k` 新建条目，`parentId = i === k ? path[k-1].id : messages[i-1].id`——`k < path.length`（`setMessages` 截断后再发）时自然形成分支，旧分支不删；(5) 纯截断只移 leaf；(6) 更新 meta；(7) 一个事务。
- `reload()`（内部 `removeMessagesAfter(lastUserIndex)`）与 `setMessages + sendMessage` 两条现成路径自动长出兄弟节点；线性 = 单子树，无迁移。
- 重挂 key 变为 `${threadId}#${leafId}`，`threadId` 不变（仍是 TanStack 身份）；`BranchPicker`（‹ n/m ›）读 `siblingsOf(entryId)`，streaming 时禁用（AUI 规则）。
- 已知风险：若 `reload()`/`MESSAGES_SNAPSHOT` 路径重生成 assistant 消息 id，同一次 run 可能产生孤儿兄弟；v2 用真实 `ChatClient` 的端到端测试覆盖 reload 与审批快照两条路径。
- 存储：v1 的 localStorage 索引升级为 IndexedDB 两个 object store（`threads` 元数据 + `entries`，索引 `threadId_seq`）；`ThreadMeta` 加 `leafId`；旧记录当根分支。
