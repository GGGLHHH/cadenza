# cadenza-ai Phase 3 — Advanced 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 落地 spec §分阶段计划 Phase 3 里不依赖外部服务的项：听写转写与自动标题（`createTranscriptionHandler` / `createSummarizeHandler` + Playground 接线）、历史前插分页 demo（`preserveScrollOnPrepend`）、OpenRouter PKCE 登录组合进 Playground、persistence / durability / MCP / `live` 四段配方文档。限流中间件不做（docs 站纯 BYOK，spec 写明「若配服务端 key」才需要）——在 providers 页一句话说明。

**Architecture:** 两个新的 route handler 与 `createChatHandler` 同构（BYOK 头 → 401 `byok_missing` → adapter → TanStack activity → SSE）；Playground 的听写、自动标题、PKCE 都是**组合**——库内不 import adapter 的浏览器模块（`@tanstack/ai-openrouter/pkce` 由 docs 直接用）。历史前插只靠 `Transcript` 已透传的 `preserveScrollOnPrepend`。

**Tech Stack:** `@tanstack/ai` `generateTranscription` / `summarize` / `generationParamsFromRequest`；`@tanstack/ai-openai` `createOpenaiTranscription` / `createOpenaiSummarize`；`@tanstack/ai-react` `useTranscription` / `useSummarize`；`@tanstack/ai-openrouter/pkce`；`@tanstack/ai-persistence` `memoryPersistence`。

**Spec:** `docs/superpowers/specs/2026-08-28-cadenza-ai-design.md` §分阶段计划 Phase 3、§服务端「persistence / durability」、§视图层 `ByokKeyDialog` 行（PKCE 组合）、Standard 表 T16 / C11 / M5、§docs 分区 route 清单第三行。

## Global Constraints

- 同 Phase 2 计划的 Global Constraints（家法、验证路径、cwd 前缀、不 push、agent 不起服务不构建 docs）。
- 服务端新 handler 放 `packages/ai/src/server/generation-handlers.ts`，从 `server/index.ts` 转出；只 import `@tanstack/ai` 与 `@tanstack/ai/byok/server`，adapter 由 caller 传入（`createTranscriptionHandler({ adapter: (model, key) => createOpenaiTranscription(model, key), byok: openaiByok, defaultModel })`）——库根与 server 入口的 d.mts 继续零 adapter 泄漏。
- 文件归属：Task 3-1/3-2/3-4（Playground 相关）一个执行者：`packages/ai/src/server/{generation-handlers.ts,index.ts}`、`packages/ai/test/generation-handlers.test.ts`、`docs/app/api/ai/{transcription,summarize}/route.ts`、`docs/demos/ai/playground.tsx`、`docs/content/docs/ai/playground{,.en}.mdx`、`docs/content/docs/ai/providers{,.en}.mdx` 的 `## 密钥` 节（PKCE 段）与 `## 导出的类型`；Task 3-3/3-5 另一个执行者：`docs/demos/ai/history.tsx`、`docs/demos/index.tsx`（追加 `ai/history` 一行）、`docs/content/docs/ai/threads{,.en}.mdx`（`## 历史前插` 新节 + `## 服务端持久化` 配方补 `memoryPersistence` / durability）、`docs/content/docs/ai/conversation{,.en}.mdx`（`## 状态与 className` 后加 `## 多标签页` 一小节讲 `live`）、`docs/content/docs/ai/providers{,.en}.mdx` 的 `## MCP` 与「限流」一句（与前一执行者不同节；先读文件再改）。
- 提交：`feat(ai): transcription and summarize handlers, playground dictation and auto titles`、`docs(ai): history paging, persistence and durability recipes, live note`、`feat(ai): openrouter pkce in the playground`（PKCE 单独一笔）。

---

### Task 3-1: `createTranscriptionHandler` / `createSummarizeHandler`

**Files:** Create `packages/ai/src/server/generation-handlers.ts`；Modify `packages/ai/src/server/index.ts`；Test `packages/ai/test/generation-handlers.test.ts`（node env）；Create `docs/app/api/ai/transcription/route.ts`、`docs/app/api/ai/summarize/route.ts`。

**Interfaces:**

```ts
export interface GenerationHandlerOptions<TAdapter> {
  /** Builds the adapter with the BYOK / env key; `null` when the provider needs no key. */
  adapter: (model: string, key: string | null) => TAdapter
  /** Which BYOK header / env holds the key; omit for keyless providers. */
  byok?: ByokProvider
  /** Model used unless `forwardedProps.model` names one. */
  defaultModel: string
  maxBodyBytes?: number // default 8 MiB（音频 base64）
  debug?: DebugOption
}
export function createTranscriptionHandler(o: GenerationHandlerOptions<AnyTranscriptionAdapter>): { POST: (request: Request) => Promise<Response> }
export function createSummarizeHandler(o: GenerationHandlerOptions<AnySummarizeAdapter>): { POST: (request: Request) => Promise<Response> }
```

生命周期（两者相同）：`content-length` > `maxBodyBytes` → 413；`generationParamsFromRequest('transcription' | 'summarize', request)`（抛 `Response` 时原样返回）；`model` = `params.forwardedProps?.model`（经与 `pickSelection` 相同的 `MODEL_ID` 正则）?? `defaultModel`；key = `byok ? getByokKey(request, byok) : null`；`byok && key === null` → `byokMissing(byok)`；`generateTranscription({ adapter, ...params, stream: true })` / `summarize({ adapter, ...params, stream: true })` → `toServerSentEventsResponse(stream, { abortController, debug })`。**实施第一步**在 `packages/ai/node_modules/@tanstack/ai/dist/esm` 里 grep `generationParamsFromRequest` 的返回类型 `GenerationParams<'transcription'>` 字段与 `TranscriptionActivityOptions` / `SummarizeActivityOptions` 的 `stream` 形态，再照 `ai/skills/ai-core/media-generation/SKILL.md` 的 route 示例（memory：skills 文档滞后，以 d.ts 为准）。

- [ ] **Step 1: 测试**：假 adapter（`kind: 'transcription'`，`transcribe()` 返回 `{ text: 'hello' }` 或流），413 / 401 `byok_missing` / 200 `text/event-stream` 含 `hello`；summarize 同形。
- [ ] **Step 2: 实现 + docs route**：`transcription/route.ts` 用 `createOpenaiTranscription(model, key)`、`defaultModel: 'gpt-4o-mini-transcribe'`（以 `OPENAI_TRANSCRIPTION_MODELS` 里存在的 id 为准）、`byok: openaiByok`；`summarize/route.ts` 用 `createOpenaiSummarize`、`defaultModel: 'gpt-5.2'`（或更便宜的 mini）。`maxDuration = 60`。
- [ ] **Step 3: 验证**：包测试 / tsc / eslint / build（server d.mts 零泄漏）；`pnpm --filter docs typecheck`。

---

### Task 3-2: Playground 听写与自动标题

**Files:** Modify `docs/demos/ai/playground.tsx`；`docs/content/docs/ai/playground{,.en}.mdx`（`## 使用` 加「听写」「自动标题」两段；`## API` 加两条 route）。

- 听写：`const transcription = useTranscription({ connection: fetchServerSentEvents('/api/ai/transcription'), byok, byokProvider: () => 'openai', onResult: r => r.text })`；`ComposerDictate onRecording={part => void transcription.generate({ audio: \`data:${part.source.mimeType};base64,${part.source.value}\` })}`；`transcription.result` 变化时把文本**追加到草稿**——Composer 改受控：`value` + `onValueChange`，`ChatShell` 增加 `value` / `onValueChange` 透传（若 ChatShell 没有，加上并让 PR-8 的 draft demo 也用同一通道）。`transcription.isLoading` 时 Dictate 按钮 `disabled`；`transcription.error` 用 `TranscriptError` 同款样式显示在 composer 上方（组合，不改库）。
- 自动标题：`const summary = useSummarize({ connection: fetchServerSentEvents('/api/ai/summarize'), byok, byokProvider: () => 'openai', onResult: r => r.text })`；`useChat({ onFinish })` 里当 `index.get(threadId)?.title` 仍是 `threadTitleFrom` 的默认（记录 `titledRef`）且这是本线程第一条 assistant 消息时 `summary.generate({ text: messageText(user) + '\n' + messageText(assistant), style: 'concise', maxLength: 40 })`；结果 `index.rename(threadId, text.trim())`。失败静默（标题保留默认）。
- [ ] **Step 1: 改 demo**；`pnpm --filter docs typecheck`；eslint。
- [ ] **Step 2: 文档** zh/en。

---

### Task 3-3: 历史前插 demo `ai/history`

**Files:** Create `docs/demos/ai/history.tsx`；Modify `docs/demos/index.tsx`（+`'ai/history'`）、`docs/content/docs/ai/threads{,.en}.mdx`（`## 会话列表` 之后新节 `## 历史前插`：一句引导 + preview + 解释 `preserveScrollOnPrepend` 与「永久第一行会骗过前插检测」的 MessageScroller 约束，链 `/docs/components/message-scroller#加载更早的消息`）。

- demo：30 条预生成消息（复用 `docs/demos/message-scroller/transcript.ts` 的 `TRANSCRIPT` / `EARLIER` 语料转成 `UIMessage`）；`useChat({ fetcher: mockFetcher(echo()), initialMessages: last 8 })`；`Transcript` 里、`TranscriptMessage` 列表**之前**不放按钮——「Load earlier」按钮放在视口内、内容容器外（`Transcript` 的 children 之外做不到 → 用 `MessageScrollerButton`? 不：用 `Transcript` 之上的一个 `Button`），点击 `chat.setMessages([...earlier.slice(-8), ...chat.messages])`；采样 `scrollTop` 前后差 = 前插内容高度，读者视线不动。
- [ ] **Step 1: demo**；typecheck；eslint。
- [ ] **Step 2: 文档** zh/en。

---

### Task 3-4: OpenRouter PKCE 组合进 Playground

**Files:** Modify `docs/demos/ai/playground.tsx`；`docs/content/docs/ai/providers{,.en}.mdx` `## 密钥` 节加「Sign in with OpenRouter」一段；`docs/content/docs/ai/playground{,.en}.mdx` `## 使用` 一句。

- `import { completeOpenRouterPkceIntoByok, startOpenRouterPkceLogin } from '@tanstack/ai-openrouter/pkce'`（docs 直接依赖 adapter，允许）；页面挂载时 `useEffect(() => { void completeOpenRouterPkceIntoByok(byok, { cleanUrl: true }) }, [byok])`；`ByokKeyDialog` 改显式组合：`catalog.providers.map(p => <ByokKeyDialogProvider key provider={p.id}>{p.id === 'openrouter' && <Button size="sm" variant="outline" onClick={() => void startOpenRouterPkceLogin({ callbackUrl: location.href.split('?')[0] })}>Sign in with OpenRouter</Button>}</ByokKeyDialogProvider>)`。`completeOpenRouterPkceIntoByok` 的 `byok` 参数类型 `OpenRouterByokStore`——以 d.ts 为准，`ByokClient` 若不直接满足则包一层 `{ update: (id, key) => byok.update(id, key) }`。
- [ ] **Step 1: 改 demo**；typecheck；eslint。真实登录流程需要 OpenRouter 账号，不在本机验证；页面写明。
- [ ] **Step 2: 文档**。

---

### Task 3-5: 配方文档：persistence / durability、MCP、`live`、限流

**Files:** `docs/content/docs/ai/threads{,.en}.mdx`（`## 服务端持久化` 补：`memoryPersistence()` 本地开发示例 + `createChatHandler({ persistence, authorize })` + 客户端 `useChat({ persistence: true, threadId })` + `fetchServerSentEvents(url)` 内建 hydrate；`durability`：`toServerSentEventsResponse(..., { durability })` 与 `GET ?runId` 恢复，`memoryStream(request)` 本地）；`docs/content/docs/ai/conversation{,.en}.mdx`（`## 多标签页`：`useChat({ live: true })` 挂载即订阅，同 thread 多 tab 同步流）；`docs/content/docs/ai/providers{,.en}.mdx`（`## MCP` 校对 `chat({ mcp })` 是否存在——以 `@tanstack/ai` d.ts 为准，不存在就写 `mergeAgentTools` + `@tanstack/ai-mcp` 客户端工具的形态；末尾一句「若为 docs 站配服务端 key，需加按 IP 限流中间件——本站纯 BYOK，不做」）。

- [ ] **Step 1: 逐条对照 d.ts**（`memoryPersistence` 签名、`memoryStream`、`live`）后写；zh/en 1:1。
- [ ] **Step 2: 提交**。

---

## Self-review

- Phase 3 清单 8 项：转写 ✓ 3-1/3-2；`useSummarize` 自动标题 ✓ 3-2；前插 demo ✓ 3-3；PKCE ✓ 3-4；persistence/durability 配方 ✓ 3-5；MCP ✓ 3-5；`live` ✓ 3-5；byteplus 在 PR-6；限流 → 一句说明（不做）。
- 「以 d.ts 为准」四处：`GenerationParams<'transcription'>`、`TranscriptionActivityOptions.stream`、`OpenRouterByokStore`、`chat({ mcp })`。
