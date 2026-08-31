# cadenza-ai Phase 2 — Standard 补齐（PR-6 / PR-7 / PR-8）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 spec §分阶段计划 Phase 2 的三个 PR 落地：其余 9 家 provider preset（含 `discoverModels` 与 `openaiCompatiblePreset`）、`Sources` / `StructuredOutput` / 导入导出 / `ContextUsage`（含把 `progress` 提升进 cadenza-ui）、队列 / 草稿 / 反馈 / 朗读 / 工具分组的 demo 与文档——使 Standard 40/46 全部有 demo 或配方。

**Architecture:** 服务端 preset 仍是「目录纯数据 + `create` + `thinking`」三件套，thinking 映射按附录 A 逐家快照；`openaiCompatiblePreset(config)` 是消费者自定义 provider 的唯一入口。视图层只新增 `ContextUsage`（`Progress` + `Tooltip` + `estimateCost`）；其余能力都已有部件，Phase 2 是补 demo、补文档、补测试。docs demo 继续走 `mockFetcher` 固定模式。

**Tech Stack:** 同 Phase 1（TanStack AI 0.51 系列 adapter、cadenza-ui、vitest jsdom、agent-browser 视觉验证）。

**Spec:** `docs/superpowers/specs/2026-08-28-cadenza-ai-design.md` §服务端「provider presets」表、附录 A（thinking 映射真源）、§功能覆盖矩阵 Standard 表、§docs 分区 demo 清单（P2 行）、§视图层 `ContextUsage` 契约、§前置提升 `progress` 行。

## Global Constraints

- 与 Phase 1a/1b/1c 三份计划的 Global Constraints 相同（家法、`(value, details)`、零默认文案、`'use client'`、验证限定路径、每条命令 `cd /Users/ggg/privte/cadenza &&`、不 push）。
- 新 preset 文件**只 import 自家 adapter**（`@tanstack/ai-<id>`），类型断言写法照 `src/providers/openai.ts`；`create(model, key)` 的 `key` 为 `null` 时按 preset 表处理（vertex 走 ADC；ollama 走默认 host）。
- thinking 映射的每一格都要进 `test/thinking-map.test.ts` 的 inline snapshot，并逐格对照附录 A。
- drift 测试（`test/catalog-drift.test.ts`）补齐 grok / groq / mistral / vercel-gateway / llmgateway / bedrock 的 case（ollama / vertex / openai-compatible 不断言模型 id，只断言 byok）。
- docs demo：`docs/demos/ai/<name>.tsx`，`mockFetcher`，顶部注释写证明什么；registry 里 `ai/sources`、`ai/structured-output`、`ai/export`、`ai/queue`、`ai/draft`、`ai/tool-group` 六个 key 已预登记，**不要再改 `docs/demos/index.tsx`**（PR-7 的 `progress/*` demo 例外，由 PR-7 追加）。
- 文件归属（避免并行冲突）：PR-6 只动 `packages/ai/src/{providers,server,catalog}`、`packages/ai/test/{thinking-map,providers,catalog-drift,catalog-handler}.test.ts`、`docs/app/api/ai/*`、`docs/demos/ai/{playground,catalog}.tsx`、`docs/content/docs/ai/providers{,.en}.mdx`、`packages/ai/README.md`、`packages/ai/package.json`（peer 无需改）；PR-7 只动 `packages/ui/**`（progress 提升）、`packages/ai/src/view/{context-usage.tsx,index.ts}`、`packages/ai/test/view-context-usage.test.tsx`、`docs/demos/ai/{sources,structured-output,export,usage}.tsx`、`docs/demos/progress/*`、`docs/demos/index.tsx`（只追加 `progress/*`）、`docs/content/docs/components/progress{,.en}.mdx`、`docs/content/docs/ai/{parts,threads,conversation}{,.en}.mdx`；PR-8 只动 `docs/demos/ai/{queue,draft,tool-group,actions}.tsx`、`docs/content/docs/ai/{composer,parts,conversation}{,.en}.mdx`（在 PR-7 之后执行）。
- 提交：PR-6 `feat(ai): remaining providers`；PR-7 `feat(ai): sources, structured output, export and usage ui`（其中 progress 提升单独一笔 `feat(ui): promote progress`）；PR-8 `docs(ai): queue, drafts, feedback, tool groups`。trailer `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`。

---

### Task 6-1: 六家「开箱即用」preset + thinking 映射

**Files:**
- Create: `packages/ai/src/providers/{grok,groq,mistral,vercel-gateway,llmgateway,bedrock}.ts`
- Modify: `packages/ai/src/server/thinking.ts`（追加 `grokThinking` / `groqThinking` / `vercelGatewayThinking` / `llmgatewayThinking` / `noThinking`）
- Test: `packages/ai/test/thinking-map.test.ts`（追加快照）、`packages/ai/test/providers.test.ts`（it.each 扩到 10 家）、`packages/ai/test/catalog-drift.test.ts`

**Interfaces（Produces）:** `grok` / `groq` / `mistral` / `vercelGateway` / `llmgateway` / `bedrock`（各 `ProviderPreset`）；`grokThinking(level, model)`、`groqThinking(level, model)`、`vercelGatewayThinking(level, model)`、`llmgatewayThinking(level, model)`、`noThinking()`。

- [ ] **Step 1: 快照测试先写**（附录 A 逐格）：grok `{ reasoning: { effort } }`（minimal→low、xhigh/max→high、off→`effort:'none'`、`grok-build-*`→`{}`）；groq `{ reasoning_effort, reasoning_format: 'parsed' }`（off→`{ reasoning_effort: 'none' }`；`reasoning:false` 模型→`{}`；**不发 `include_reasoning`**）；vercel-gateway `{ reasoning: { effort }, include_reasoning: true }`（xhigh/max→high；off→`{}`）；llmgateway `{ reasoning_effort }`（xhigh/max 原样；off→`{}`）；mistral / bedrock `{}`。
- [ ] **Step 2: 实现**。工厂：`createGrokText(model, key)`、`createGroqText`、`createMistralText`、`createVercelGatewayText(model, key, config)`（`config` 的必填字段以 `ai-vercel-gateway/dist/esm/*.d.ts` 为准，能空则 `{}`）、`createLLMGatewayText`、`createBedrockConverse(model, key)`（bearer；Converse 默认）。`keyRequired:true`，`runtime:'node'`。
- [ ] **Step 3: drift 测试**加 `GROK_CHAT_MODELS` / `GROQ_CHAT_MODELS` / `MISTRAL_CHAT_MODELS` / `VERCEL_GATEWAY_CHAT_MODELS` / `LLMGATEWAY_CHAT_MODELS` / `BEDROCK_CONVERSE_MODELS`（导出路径以各包 `index.d.ts` 或 `model-meta` 子路径为准；目录里不在常量里的 id 要么改目录、要么在测试里注明为什么放行）。
- [ ] **Step 4: 验证** — `pnpm vitest run packages/ai`、`cd packages/ai && npx tsc`、`pnpm exec eslint --fix packages/ai`、`pnpm --filter @gedatou/cadenza-ai run build`（`dist/providers/*.mjs` 十个；`dist/index.d.mts` 无 adapter 泄漏）。

---

### Task 6-2: vertex / ollama / openai-compatible / byteplus + `discoverModels`

**Files:**
- Create: `packages/ai/src/providers/{vertex,ollama,openai-compatible,byteplus}.ts`
- Modify: `packages/ai/src/server/catalog-handler.ts`（`GET ?refresh=1&provider=<id>` → `preset.discoverModels(key)`，key 用 `getByokKey`）、`packages/ai/src/server/thinking.ts`（`ollamaThinking`、`openaiCompatibleThinking`；vertex 复用 `geminiThinking`）
- Test: `packages/ai/test/catalog-handler.test.ts`（refresh 分支：无 discoverModels → 400；有 → 返回 `{ provider, models }`）、`packages/ai/test/providers.test.ts`

**Interfaces:**

```ts
export const vertex: ProviderPreset // create: (model, key) => vertexText(model, key ? { apiKey: key } : undefined)；keyRequired:false
export const ollama: ProviderPreset // create: (model, key) => key ? createOllamaChat(model, key) : ollamaText(model)；runtime:'local'；discoverModels: GET {host}/api/tags → models[].name
export interface OpenAICompatibleConfig { id: string, label: string, baseURL: string, env?: string | string[], models: readonly Model[], thinking?: ProviderPreset['thinking'], name?: string }
export function openaiCompatiblePreset(config: OpenAICompatibleConfig): ProviderPreset // create: openaiCompatibleText(model, { baseURL, apiKey: key ?? undefined, name })；discoverModels: GET {baseURL}/models（Bearer key）→ data[].id
export const byteplus: ProviderPreset // create() 抛 Error('Install @tanstack/ai-byteplus …')；不入 defaultCatalog；models: []
export function ollamaThinking(level, model) // gpt-oss 系 { think: 'low'|'medium'|'high' }，其它 { think: true }，off → { think: false }
export function openaiCompatibleThinking(level, model) // model.reasoning ? { reasoning_effort: level(minimal→low, xhigh/max→high) } : {}；off → {}
```

- [ ] **Step 1: 测试先写**（快照 + catalog-handler refresh 分支：用假 preset 的 `discoverModels: async () => [...]`，`fetch` 用 `vi.stubGlobal`）。
- [ ] **Step 2: 实现**。`openai-compatible` 从 `@tanstack/ai-openai/compatible` 引 `openaiCompatibleText`（子路径，见 `ai-openai/package.json` exports）；`vertexText` 从 `@tanstack/ai-vertex`；`createOllamaChat` / `ollamaText` 从 `@tanstack/ai-ollama`。`discoverModels` 里 `fetch` 失败/非 2xx 抛 `Error`，由 catalog handler 转 502 `{ error: { type: 'discover_failed' } }`。
- [ ] **Step 3: 验证**同 6-1。`tsdown` 的 providers 入口自动收 `src/providers/*.ts`（含 `openai-compatible.ts`、`byteplus.ts`）——确认 `dist/providers/` 十二个文件。

---

### Task 6-3: docs 接线 + providers 页逐家表

**Files:**
- Modify: `docs/app/api/ai/chat/route.ts`、`docs/app/api/ai/catalog/route.ts`（11 家 preset：全部内置 + `ollama`；不含 byteplus / openai-compatible）
- Modify: `docs/demos/ai/playground.tsx`（catalog = 11 家；`useServerCoverage`）、`docs/demos/ai/catalog.tsx`（若展示 preset 能力列则更新）
- Modify: `docs/content/docs/ai/providers{,.en}.mdx`（`## 模型目录` 后加逐 provider 表：id / 工厂 / env / keyRequired / runtime / thinking 形状 / 备注；`## 自定义 provider` 配方改用 `openaiCompatiblePreset`；`## 环境变量` 表补齐；`## 导出的类型` 补 `./providers/*` 全表；说明 `ollama` 的 `x-byok-ollama` = host URL 与 `ollamaHosts`）
- Modify: `packages/ai/README.md`（provider 清单一行）

- [ ] **Step 1: 改 route 与 demo**；`pnpm --filter docs typecheck`；`pnpm --filter docs run build`（bedrock / ollama 的 ESM 与 `node:` 依赖在 Next 打包实测；失败则 `next.config.ts` 加 `serverExternalPackages` 并记录）。
- [ ] **Step 2: 写文档**（zh → en 1:1）。
- [ ] **Step 3: 自己的 dev server（探 3000，否则 3001）上 `curl /api/ai/catalog`**：11 家、coverage 全 false（ollama / vertex 为 true——`keyRequired:false`）；`POST /api/ai/chat` 选 `ollama/llama3.3` 且 `x-byok-ollama: http://evil.example.com` → 400。
- [ ] **Step 4: 提交** `feat(ai): remaining providers`。

---

### Task 7-1: 提升 `progress` 到 cadenza-ui

**Files:**
- Create: `packages/ui/src/components/progress.tsx`（转出 `Progress` / `ProgressTrack` / `ProgressIndicator` / `ProgressLabel` / `ProgressValue`——以 `packages/ui/src/primitives/progress.tsx` 实际导出为准；`XxxProps` 各一；`className` 落纯 DOM 的标 `string`）
- Modify: `packages/ui/src/index.ts`（按字母序一行）
- Test: `packages/ui/test/progress.test.tsx`（value 映射到 `aria-valuenow`；indeterminate；`data-slot`）
- Create: `docs/demos/progress/{basic,indeterminate,label}.tsx` + registry 三行；`docs/content/docs/components/progress{,.en}.mdx`（`writing-component-docs`：先 curl shadcn v4 base 母版 `progress.mdx`）；`docs/content/docs/components/meta.json` 若显式列 pages 则加 `progress`
- [ ] **Step 1–4**：测试 → 实现 → docs → `pnpm vitest run packages/ui/test/progress.test.tsx`、`cd packages/ui && npx tsc`、eslint、`pnpm --filter @gedatou/cadenza-ui run build`。提交 `feat(ui): promote progress`。

---

### Task 7-2: `ContextUsage` 视图

**Files:**
- Create: `packages/ai/src/view/context-usage.tsx`；Modify: `packages/ai/src/view/index.ts`
- Test: `packages/ai/test/view-context-usage.test.tsx`

**Interfaces:**

```ts
export interface ContextUsageProps { model?: Model, usage: TokenUsage, children?: ReactNode, className?: string }
export interface ContextUsageState { ratio: number | undefined } // usage.promptTokens / model.contextWindow
export function ContextUsage(props): ReactElement
// Progress（value = ratio*100，contextWindow 缺失时 indeterminate=false 且只显示 tokens）+ Tooltip 明细（prompt / completion / cached / total / estimateCost 美元）；children 落在 Tooltip 触发器旁（caller 的文案）；data-slot="context-usage"，data-ratio（值型，两位小数）；文案零默认（数字是数据，单位 "tokens" 由 caller 的 children 给）
```

- [ ] **Step 1: 测试**：`aria-valuenow`、`data-ratio`、无 `contextWindow` 时不渲染 Progress、Tooltip 触发器存在。
- [ ] **Step 2: 实现 + 导出**；`pnpm --filter @gedatou/cadenza-ai run build`（`dist/index.d.mts` 无泄漏）。

---

### Task 7-3: demo `ai/sources` / `ai/structured-output` / `ai/export` + `ai/usage` 追加

**Files:** Create `docs/demos/ai/{sources,structured-output,export}.tsx`；Modify `docs/demos/ai/usage.tsx`。

| demo | 脚本 / 组成 | 证明点 |
|---|---|---|
| `sources` | `mockFetcher(() => [tool('web_search', { q: 'Philharmonie de Paris capacity' }, { providerExecuted: true, output: [{ url: 'https://philharmoniedeparis.fr', title: 'Philharmonie de Paris' }, { url: 'https://en.wikipedia.org/wiki/Philharmonie_de_Paris', title: 'Wikipedia' }] }), text('2,400 seats in the Grande salle Pierre Boulez.')])` | `sourcesOf` 收集 → `Sources` 折叠列表，`data-count=2` |
| `structured-output` | `useChat({ fetcher, outputSchema: z.object({ works: z.array(z.object({ title: z.string(), minutes: z.number() })) }) })`；脚本 `[structured({ works: [...] }, { chunk: 6 })]`；shell 上方展示 `chat.partial` → `chat.final` | `StructuredOutput` 的 `data-streaming` → `data-complete`；`partial` 逐步填充 |
| `export` | 对话两轮后：`Export Markdown`（`messagesToMarkdown(chat.messages, { title })` → `navigator.clipboard`）、`Export JSON`（`JSON.stringify(chat.messages)` 显示在 `<pre>`）、`Import JSON`（`chat.setMessages(JSON.parse(text))`） | `messagesToMarkdown` / `setMessages` |
| `usage`（追加） | toolbar 里 `<ContextUsage model={defaultCatalog.getModel('openai/gpt-5.2')} usage={tracker.total}>tokens</ContextUsage>` | 进度条随多轮增长，Tooltip 明细 |

- [ ] **Step 1: 写 demo**；`pnpm --filter docs typecheck`；eslint。
- [ ] **Step 2: 文档**：`parts.mdx` 的 `## 来源` / `## 结构化输出` 加 preview；`threads.mdx` 的 `## 导入导出` 加 preview `ai/export`；`conversation.mdx` 的 `## 用量与费用` 补 `ContextUsage` 一段 + `## Props` 追加 `### ContextUsage`（zh/en 1:1）。
- [ ] **Step 3: 提交** `feat(ai): sources, structured output, export and usage ui`。

---

### Task 8: demo `ai/queue` / `ai/draft` / `ai/tool-group` + `ai/actions` 追加反馈与朗读

**Files:** Create `docs/demos/ai/{queue,draft,tool-group}.tsx`；Modify `docs/demos/ai/actions.tsx`；docs `composer.mdx`（排队 / 草稿 preview）、`parts.mdx`（分组 preview）、`conversation.mdx`（消息动作段落 + preview 已有）。

| demo | 组成 | 证明点 |
|---|---|---|
| `queue` | `useChat({ fetcher, queue: { whenBusy: 'queue' } })`（`QueueOption` 以 ai-client types 为准）；脚本每轮 `text(REPLIES.long)`；`ToggleGroup` 切 `whenBusy`（queue / drop / interrupt — 通过 `sendMessage(text, { whenBusy })`）；shell 上方 `<QueueList queue={chat.queue} onCancel={id => chat.cancelQueued(id)}>Queued</QueueList>`；三个 `Button` 连发 | 流式中连发三条：queue 排队 / drop 丢弃 / interrupt 打断；取消排队 |
| `draft` | 两个线程按钮切换 `threadId`（`key` 重挂）；`Composer value` 受控 + `useStoredState(\`docs-draft:${threadId}\`, '')`；`onValueChange` 写回 | 输入一半切线程再切回，草稿还在 |
| `tool-group` | 脚本三个连续 `tool(...)` 各带 output，再 `text(...)` | `ToolCallGroup data-count=3`，展开见三张卡 |
| `actions`（追加） | 👍/👎：`useStoredState('docs-feedback', {})`，`TranscriptAction aria-pressed`；朗读：`speechSynthesis.speak(new SpeechSynthesisUtterance(messageText(m)))`，无 `speechSynthesis` 时禁用 | 反馈持久、朗读按钮 |

- [ ] **Step 1: 写 demo**；typecheck；eslint。
- [ ] **Step 2: 文档**（zh/en）。
- [ ] **Step 3: 提交** `docs(ai): queue, drafts, feedback, tool groups`。

---

## Self-review

- Spec Standard 表：T7/T9 → tool-group（分隔标记行 demo 自绘：`Marker separator` 在 tool-group demo 里加一条日期分隔）；T12/G9 → sources；T25/S12 → export；C14 → queue；C15 → draft；A8/A9 → actions 追加；M6 → `openaiCompatiblePreset` + providers 页；O1 → ContextUsage。全部覆盖。
- 三处「以 d.ts 为准」：`VercelGatewayChatApiConfig` 必填字段、`QueueOption` 形状、`openaiCompatibleText` 的 config 字段——实施第一步 grep。
