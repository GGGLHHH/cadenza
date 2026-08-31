# cadenza-ai Phase 1b — 运行时惯例与视图层实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 Phase 1a 的包骨架、目录、thinking 归一、脚本化 transport 与服务端之上，交付 `@gedatou/cadenza-ai` root 入口的运行时惯例（线程索引、模型选择、usage、附件草稿、消息纯函数、BYOK 便捷、渲染器注册表）与全部视图部件（Transcript / parts / Composer / 选择器 / ThreadList / ByokKeyDialog），使一个完整会话只靠本包 + `@gedatou/cadenza-ui` 就能搭出来。

**Architecture:** 运行时层是无 DOM 的纯函数与 hook；视图层只组合 `@gedatou/cadenza-ui` 已提升部件（`Message` / `Bubble` / `Marker` / `Attachment` / `MessageScroller` / `InputGroup` / `Collapsible` / `Combobox` / `Select` / `Dialog` / `AlertDialog` / `DropdownMenu` / `Item` / `Empty` / `Tooltip` 各家族，以及 `Badge` / `Kbd` / `Button`），状态全部来自 `useChat` 返回值经 `TranscriptProvider` 下发；默认渲染器的可见文案集中在 `PartLabels`，组合部件零默认文案。任务按依赖分层：A（运行时）→ B / C / D（三组视图，互不依赖，可并行）→ E（Transcript 家族，依赖 A 与 B）。

**Tech Stack:** React 19、`@tanstack/ai-react` 0.22 / `ai-client` 0.29 类型、streamdown 2.6 + `@streamdown/{code,math,cjk}`、`@gedatou/cadenza-ui` 0.7、`@gedatou/cadenza-utils`（`useControllableState`）、vitest + @testing-library（jsdom）。

**Spec:** `docs/superpowers/specs/2026-08-28-cadenza-ai-design.md` §API 面「运行时（L2）」、§客户端运行时（接线 / 线程索引 / 编辑重发 / 渲染器注册表与默认文案）、§视图层（组件树 / 部件契约 / 家法）。家法：`.claude/skills/base-ui-conventions/SKILL.md`、`shaping-new-parts/SKILL.md`。

## Global Constraints

- 视图层**只 import `@gedatou/cadenza-ui`**（peer），不 import `#primitives`、不复制 shadcn 样式；新 utility 一律先进 `packages/ui/styles.css`（本计划预期不需要）。
- 命名 `<Family><Part>`；会话行家族叫 `Transcript*`（不撞 cadenza-ui 的 `Message*`）；角色词动作部件不带 Button 后缀（`ComposerAttach`、`ComposerSubmit`、`ThreadListNew`、`ThreadListRename` …）。
- 布尔 prop 裸形容词，无 `is/has/should/show` 前缀；受控三件套 `x / defaultX / onXChange` 走 `@gedatou/cadenza-utils` 的 `useControllableState`；change 回调 `(value, details)` 第二参**必填**，`details` 用 `@gedatou/cadenza-ui` 的 `createChangeEventDetails(reason, event?)` / `createGenericEventDetails(reason, event?)`，reason 只用 Base UI 词表（`item-press` / `none` / `escape-key` / `imperative-action` / `input-change` / `input-paste` / `drag` …）。
- `data-*`：布尔走 `dataAttr()`（从 `@gedatou/cadenza-ui` 导出）；状态机枚举拆名称型存在属性（`data-pending` / `data-complete` / `data-error`、`data-submitted` / `data-streaming`），描述型走值型（`data-role`、`data-code`）。每部件最外层 `data-slot="kebab"`。
- `ReactNode` 类型的 prop 只有 `children`；插槽走组合。组合部件**零默认可见文案**；默认渲染器文案只在 `PartLabels`（英文默认，`PartRenderersProvider labels` 覆盖）；`aria-label` 英文默认可覆盖。
- Context：缺 Provider 在守卫 hook 里抛 `cadenza-ai: XxxContext is missing. Xxx parts must be placed within <Xxx>.`；`PartRenderersContext` 例外（完整默认对象）；value 传 Provider 前 `useMemo`；dev-only `displayName`。
- 每个视图部件导出 `XxxProps`；有 `data-*` 状态的导出 `XxxState`。`className` 落纯 DOM 的诚实标 `string`。
- 文件顶部 `'use client'`（含 hook / 事件的文件）。函数显式返回类型（`ReactElement` / `ReactNode` / …）。风格：无分号、单引号、一行一语句。
- 验证限定路径：`pnpm vitest run packages/ai/test/<file>`、`pnpm exec eslint --fix packages/ai/src/<dir> packages/ai/test/<file>`、`cd packages/ai && npx tsc`。不起 dev server、不 kill 进程。
- 类型来源：`UIMessage` / `MessagePart` / `ToolCallPart` / `ToolResultPart` / `TextPart` / `ImagePart` … / `ChatClientState` / `ChatInterrupt` / `ToolApprovalInterrupt` / `QueuedMessage` / `MultimodalContent` / `ContentPart` / `ChatClientPersistence` / `StreamChunk` / `UseChatReturn` 从 `@tanstack/ai-react`（它转出 ai-client 的类型）；`ThinkingPart`（带 `signature?`）与 `TokenUsage`、`EventType`、`fromSpecTokenUsage`、`parsePartialJSON` 从 `@tanstack/ai/client`。实施前 `grep` 确认各类型的实际导出位置。
- 提交：Task A → `feat(ai): runtime conventions`；B+C+D+E 合并为 `feat(ai): transcript, parts, composer, thread list and byok views`；trailer `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`；不 push。

---

### Task A: 运行时惯例（`src/runtime/*`）

**Files:**
- Create: `packages/ai/src/runtime/threads.ts`、`selection.ts`、`stored-state.ts`、`usage.ts`、`messages.ts`、`attachments.ts`、`byok.ts`、`renderers.tsx`、`index.ts`
- Modify: `packages/ai/src/index.ts`（追加 `export * from './runtime'`）
- Test: `packages/ai/test/threads.test.ts`、`selection.test.tsx`、`usage.test.ts`、`messages.test.ts`、`attachments.test.ts`、`byok.test.ts`、`renderers.test.tsx`

**Interfaces（Produces，后续任务全部依赖）:**

```ts
// threads.ts
export interface ThreadMeta { id: string, title: string, createdAt: number, updatedAt: number, messageCount: number, preview: string, archived: boolean, provider?: string, model?: string }
export interface ThreadIndex {
  list: () => readonly ThreadMeta[] // updatedAt 倒序，归档排后
  get: (id: string) => ThreadMeta | undefined
  create: (init?: Partial<ThreadMeta> & { id?: string }) => ThreadMeta
  touch: (id: string, patch: Partial<Omit<ThreadMeta, 'id'>>) => ThreadMeta // 未知 id → upsert（createdAt = now）
  rename: (id: string, title: string) => void
  archive: (id: string, archived: boolean) => void
  remove: (id: string) => void
  subscribe: (listener: () => void) => () => void
}
export function createThreadIndex(options?: { key?: string, storage?: 'local' | 'memory' }): ThreadIndex
export function useThreadIndex(index: ThreadIndex): readonly ThreadMeta[]
export function threadPersistence(index: ThreadIndex, base: ChatClientPersistence): ChatClientPersistence
export function groupThreadsByDay(threads: readonly ThreadMeta[], now?: number): ReadonlyArray<{ label: 'today' | 'yesterday' | 'earlier', threads: readonly ThreadMeta[] }>
export function threadTitleFrom(messages: readonly UIMessage[], max?: number): string
export function newThreadId(): string // `thread-${Date.now()}-${random}`

// selection.ts
export interface ModelSelection { provider: string, model: string, thinking: ThinkingLevel }
export function useModelSelection(options?: { catalog?: Catalog, key?: string, initial?: ModelSelection }): {
  selection: ModelSelection
  model: Model | undefined
  provider: Provider | undefined
  setModel: (ref: string) => void // 内部 clampThinkingLevel
  setThinking: (level: ThinkingLevel) => void
  forwardedProps: { provider: string, model: string, thinking: ThinkingLevel }
}

// stored-state.ts
export function useStoredState<T>(key: string, initial: T): [T, (next: T) => void]

// usage.ts
export interface UsageTracker { onChunk: (chunk: StreamChunk) => void, onFinish: (message: UIMessage) => void, total: TokenUsage, lastRun: TokenUsage | undefined, byMessage: ReadonlyMap<string, TokenUsage>, reset: () => void }
export function useUsageTracker(): UsageTracker
export function addTokenUsage(a: TokenUsage | undefined, b: TokenUsage): TokenUsage

// messages.ts
export interface Source { url: string, title?: string, snippet?: string }
export function messageText(message: UIMessage): string
export function messagesToMarkdown(messages: readonly UIMessage[], options?: { title?: string, includeThinking?: boolean }): string
export function editAndResend(chat: Pick<UseChatReturn, 'messages' | 'setMessages' | 'sendMessage' | 'status' | 'stop'>, messageId: string, content: string | MultimodalContent): Promise<void>
export function isThinkingComplete(message: UIMessage, partIndex: number, status: ChatClientState): boolean
export function sourcesOf(message: UIMessage): Source[]

// attachments.ts
export const DEFAULT_MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024
export type AttachmentKind = 'image' | 'audio' | 'video' | 'document'
export interface DraftAttachment { id: string, kind: AttachmentKind, state: AttachmentState, name: string, mimeType: string, size: number, file?: File, part?: ContentPart, error?: string, previewUrl?: string }
export function attachmentKindOf(mimeType: string): AttachmentKind | undefined // image/* audio/* video/* application/pdf text/plain|markdown → document；其余 undefined
export function fileToContentPart(file: File, options?: { maxBytes?: number }): Promise<ContentPart>
export function useAttachmentDraft(options?: { maxBytes?: number, accept?: readonly AttachmentKind[] }): { items: readonly DraftAttachment[], add: (items: ReadonlyArray<File | ContentPart>) => void, remove: (id: string) => void, clear: () => void, toParts: () => Promise<ContentPart[]>, accept: string }

// byok.ts
export function createByok(options?: { persistent?: boolean, catalog?: Catalog }): ByokClient
export function useServerCoverage(byok: ByokClient, url?: string): { coverage: Record<string, boolean> | undefined, providers: readonly Provider[] | undefined, error: Error | undefined }

// renderers.tsx
export interface PartLabels { thinking: string, thought: (seconds: number) => string, toolPending: string, toolRunning: string, toolApprovalRequested: string, toolApproved: string, toolDenied: string, toolDone: string, toolFailed: string, toolGroup: (count: number) => string, approve: string, deny: string, sources: (count: number) => string }
export const DEFAULT_PART_LABELS: PartLabels
export interface ToolRendererProps { part: ToolCallPart, result: ToolResultPart | undefined, interrupt: ToolApprovalInterrupt | undefined, streaming: boolean }
export type ToolRenderer = (props: ToolRendererProps) => ReactNode
export interface PartRenderers {
  text?: (p: { part: TextPart, message: UIMessage, streaming: boolean }) => ReactNode
  thinking?: (p: { part: ThinkingPart, complete: boolean, startedAt: number | undefined }) => ReactNode
  toolCall?: { default?: ToolRenderer } & Record<string, ToolRenderer>
  toolResult?: (p: { part: ToolResultPart }) => ReactNode
  image?: (p: { part: ImagePart, message: UIMessage }) => ReactNode
  audio?: (p: { part: AudioPart, message: UIMessage }) => ReactNode
  video?: (p: { part: VideoPart, message: UIMessage }) => ReactNode
  document?: (p: { part: DocumentPart, message: UIMessage }) => ReactNode
  structuredOutput?: (p: { part: StructuredOutputPart }) => ReactNode
  uiResource?: (p: { part: UIResourcePart }) => ReactNode
}
export function definePartRenderers(renderers: PartRenderers): PartRenderers // 恒等（类型守门）
export interface PartRenderersContextValue { renderers: PartRenderers, labels: PartLabels }
export function PartRenderersProvider(props: { renderers?: PartRenderers, labels?: Partial<PartLabels>, children: ReactNode }): ReactElement
export function usePartRenderers(): PartRenderersContextValue // 缺 Provider = { renderers: {}, labels: DEFAULT_PART_LABELS }
```

- [ ] **Step 1: 写失败测试**

```ts
// packages/ai/test/threads.test.ts
import { describe, expect, it, vi } from 'vitest'
import { createThreadIndex, groupThreadsByDay, threadPersistence, threadTitleFrom } from '../src/runtime/threads'

describe('thread index', () => {
  it('lists newest first with archived last, and upserts on touch', () => {
    const index = createThreadIndex({ storage: 'memory' })
    const a = index.create({ id: 'a', title: 'A' })
    index.touch('b', { title: 'B' }) // unknown id → created
    index.touch('a', { messageCount: 3 })
    index.archive('b', true)
    expect(index.get('b')?.createdAt).toBeTypeOf('number')
    expect(index.list().map(t => t.id)).toEqual(['a', 'b'])
    expect(index.get('a')?.messageCount).toBe(3)
    expect(a.title).toBe('A')
  })

  it('notifies subscribers and persists to localStorage under the key', () => {
    const index = createThreadIndex({ storage: 'local', key: 'test:threads' })
    const listener = vi.fn()
    const off = index.subscribe(listener)
    index.create({ id: 'x', title: 'X' })
    expect(listener).toHaveBeenCalledTimes(1)
    expect(JSON.parse(localStorage.getItem('test:threads')!)).toHaveLength(1)
    off()
    index.remove('x')
    expect(listener).toHaveBeenCalledTimes(1)
    localStorage.removeItem('test:threads')
  })

  it('wraps a persistence adapter: setItem touches, removeItem removes, unknown ids get created', async () => {
    const index = createThreadIndex({ storage: 'memory' })
    const store = new Map<string, unknown>()
    const base = {
      getItem: (id: string) => (store.get(id) as never) ?? null,
      setItem: (id: string, v: unknown) => {
        store.set(id, v)
      },
      removeItem: (id: string) => {
        store.delete(id)
      },
    }
    const p = threadPersistence(index, base)
    await p.setItem('t1', { messages: [{ id: 'u1', role: 'user', parts: [{ type: 'text', content: 'Where does the interval go?' }] }] } as never)
    expect(index.get('t1')?.title).toBe('Where does the interval go?')
    expect(index.get('t1')?.messageCount).toBe(1)
    expect(store.has('t1')).toBe(true)
    await p.removeItem('t1')
    expect(index.get('t1')).toBeUndefined()
    expect(store.has('t1')).toBe(false)
  })

  it('groups by day and derives titles', () => {
    const now = Date.UTC(2026, 7, 28, 12)
    const day = 24 * 60 * 60 * 1000
    const threads = [
      { id: '1', title: 'today', createdAt: now, updatedAt: now - 1000, messageCount: 0, preview: '', archived: false },
      { id: '2', title: 'yesterday', createdAt: now, updatedAt: now - day, messageCount: 0, preview: '', archived: false },
      { id: '3', title: 'old', createdAt: now, updatedAt: now - 5 * day, messageCount: 0, preview: '', archived: false },
    ]
    expect(groupThreadsByDay(threads, now).map(g => [g.label, g.threads.length])).toEqual([['today', 1], ['yesterday', 1], ['earlier', 1]])
    expect(threadTitleFrom([{ id: 'u', role: 'user', parts: [{ type: 'text', content: 'x'.repeat(100) }] }] as never, 40)).toHaveLength(41) // 40 + '…'
    expect(threadTitleFrom([] as never)).toBe('')
  })
})
```

```tsx
// packages/ai/test/selection.test.tsx
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { defaultCatalog } from '../src/catalog'
import { useModelSelection } from '../src/runtime/selection'

describe('useModelSelection', () => {
  it('starts from initial, clamps thinking when switching to a non-reasoning model, and exposes forwardedProps', () => {
    const { result } = renderHook(() => useModelSelection({ catalog: defaultCatalog, key: 'test:selection', initial: { provider: 'openai', model: 'gpt-5.2', thinking: 'high' } }))
    expect(result.current.forwardedProps).toEqual({ provider: 'openai', model: 'gpt-5.2', thinking: 'high' })
    const nonReasoning = defaultCatalog.models.find(m => !m.reasoning)!
    act(() => result.current.setModel(`${nonReasoning.provider}/${nonReasoning.id}`))
    expect(result.current.selection.thinking).toBe('off')
    expect(JSON.parse(localStorage.getItem('test:selection')!).model).toBe(nonReasoning.id)
    localStorage.removeItem('test:selection')
  })
})
```

```ts
import { EventType } from '@tanstack/ai/client'
// packages/ai/test/usage.test.ts
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { addTokenUsage, useUsageTracker } from '../src/runtime/usage'

describe('useUsageTracker', () => {
  it('accumulates every RUN_FINISHED of a run and assigns it to the finished message', () => {
    const { result } = renderHook(() => useUsageTracker())
    act(() => {
      result.current.onChunk({ type: EventType.RUN_FINISHED, threadId: 't', runId: 'r1', usage: [{ inputTokens: 10, outputTokens: 5, totalTokens: 15 }] } as never) // 中间轮
      result.current.onChunk({ type: EventType.RUN_FINISHED, threadId: 't', runId: 'r1', usage: { promptTokens: 20, completionTokens: 7, totalTokens: 27 } } as never) // TokenUsage 形状
      result.current.onFinish({ id: 'a1', role: 'assistant', parts: [] } as never)
    })
    expect(result.current.byMessage.get('a1')).toMatchObject({ promptTokens: 30, completionTokens: 12, totalTokens: 42 })
    expect(result.current.total.totalTokens).toBe(42)
    expect(result.current.lastRun?.totalTokens).toBe(42)
  })
  it('adds nested details', () => {
    expect(addTokenUsage({ promptTokens: 1, completionTokens: 1, totalTokens: 2, promptTokensDetails: { cachedTokens: 1 } }, { promptTokens: 1, completionTokens: 1, totalTokens: 2, promptTokensDetails: { cachedTokens: 2 } }).promptTokensDetails?.cachedTokens).toBe(3)
  })
})
```

```ts
// packages/ai/test/messages.test.ts
import { describe, expect, it, vi } from 'vitest'
import { editAndResend, isThinkingComplete, messagesToMarkdown, messageText, sourcesOf } from '../src/runtime/messages'

const msg = (id: string, role: 'user' | 'assistant', parts: unknown[]): any => ({ id, role, parts })

describe('message helpers', () => {
  it('flattens text parts and skips tool calls', () => {
    const m = msg('a', 'assistant', [{ type: 'thinking', content: 'hmm' }, { type: 'text', content: 'Hello' }, { type: 'tool-call', id: 'c', name: 'x', arguments: '{}', state: 'complete' }, { type: 'text', content: 'world' }])
    expect(messageText(m)).toBe('Hello\n\nworld')
  })
  it('renders a markdown transcript', () => {
    const md = messagesToMarkdown([msg('u', 'user', [{ type: 'text', content: 'Hi' }]), msg('a', 'assistant', [{ type: 'text', content: 'Hello' }])], { title: 'T' })
    expect(md).toContain('# T')
    expect(md).toContain('**User**')
    expect(md).toContain('Hello')
  })
  it('editAndResend truncates before the edited user message and resends', async () => {
    const setMessages = vi.fn()
    const sendMessage = vi.fn(async () => {})
    const stop = vi.fn()
    const messages = [msg('u1', 'user', []), msg('a1', 'assistant', []), msg('u2', 'user', []), msg('a2', 'assistant', [])]
    await editAndResend({ messages, setMessages, sendMessage, stop, status: 'streaming' } as never, 'u2', 'again')
    expect(stop).toHaveBeenCalled()
    expect(setMessages).toHaveBeenCalledWith(messages.slice(0, 2))
    expect(sendMessage).toHaveBeenCalledWith('again')
  })
  it('decides thinking completeness three ways', () => {
    const streaming = msg('a', 'assistant', [{ type: 'thinking', content: 'x' }])
    expect(isThinkingComplete(streaming, 0, 'streaming')).toBe(false)
    expect(isThinkingComplete(streaming, 0, 'ready')).toBe(true)
    expect(isThinkingComplete(msg('a', 'assistant', [{ type: 'thinking', content: 'x' }, { type: 'text', content: 'y' }]), 0, 'streaming')).toBe(true)
    expect(isThinkingComplete(msg('a', 'assistant', [{ type: 'thinking', content: 'x', signature: 'sig' }]), 0, 'streaming')).toBe(true)
  })
  it('collects sources from provider-executed web search and explicit metadata', () => {
    const m = msg('a', 'assistant', [
      { type: 'tool-call', id: 'c1', name: 'web_search', arguments: '{}', state: 'complete', metadata: { providerExecuted: true, sources: [{ url: 'https://a', title: 'A' }] } },
      { type: 'tool-call', id: 'c2', name: 'web_search', arguments: '{}', state: 'complete', metadata: { providerExecuted: true, anthropic: { resultBlockType: 'web_search_tool_result' } }, output: [{ url: 'https://b', title: 'B' }] },
    ])
    expect(sourcesOf(m).map(s => s.url)).toEqual(['https://a', 'https://b'])
  })
})
```

```ts
// packages/ai/test/attachments.test.ts
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { attachmentKindOf, DEFAULT_MAX_ATTACHMENT_BYTES, fileToContentPart, useAttachmentDraft } from '../src/runtime/attachments'

describe('attachments', () => {
  it('classifies mime types', () => {
    expect(attachmentKindOf('image/png')).toBe('image')
    expect(attachmentKindOf('application/pdf')).toBe('document')
    expect(attachmentKindOf('text/markdown')).toBe('document')
    expect(attachmentKindOf('application/zip')).toBeUndefined()
  })
  it('turns a file into a data ContentPart', async () => {
    const part = await fileToContentPart(new File([new Uint8Array([1, 2, 3])], 'a.png', { type: 'image/png' }))
    expect(part).toMatchObject({ type: 'image', source: { type: 'data', mimeType: 'image/png', value: 'AQID' } })
  })
  it('rejects a file over the limit', async () => {
    await expect(fileToContentPart(new File([new Uint8Array(4)], 'big.png', { type: 'image/png' }), { maxBytes: 3 })).rejects.toThrow(/limit/)
    expect(DEFAULT_MAX_ATTACHMENT_BYTES).toBe(3 * 1024 * 1024)
  })
  it('draft holds files and ready-made parts, and converts all to parts', async () => {
    const { result } = renderHook(() => useAttachmentDraft())
    act(() => result.current.add([new File([new Uint8Array([1])], 'a.png', { type: 'image/png' }), { type: 'audio', source: { type: 'data', mimeType: 'audio/webm', value: 'AA==' } }]))
    expect(result.current.items.map(i => i.kind)).toEqual(['image', 'audio'])
    const parts = await result.current.toParts()
    expect(parts.map(p => p.type)).toEqual(['image', 'audio'])
    act(() => result.current.remove(result.current.items[0]!.id))
    expect(result.current.items).toHaveLength(1)
    expect(result.current.accept).toContain('image/*')
  })
})
```

```ts
// packages/ai/test/byok.test.ts
import { describe, expect, it } from 'vitest'
import { defaultCatalog } from '../src/catalog'
import { createByok } from '../src/runtime/byok'

describe('createByok', () => {
  it('marks keyless providers as server-covered so prepare() does not block', async () => {
    const byok = createByok({ persistent: false, catalog: defaultCatalog })
    await byok.ready()
    await expect(byok.prepare('vertex')).resolves.not.toThrow()
    await expect(byok.prepare('openai')).rejects.toThrow()
  })
})
```

```tsx
// packages/ai/test/renderers.test.tsx
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DEFAULT_PART_LABELS, definePartRenderers, PartRenderersProvider, usePartRenderers } from '../src/runtime/renderers'

function Probe(): ReactElement {
  const { renderers, labels } = usePartRenderers()
  const r = renderers.toolCall?.get_weather ?? renderers.toolCall?.default
  return <div data-hit={r ? r({ part: { type: 'tool-call', id: 'c', name: 'get_weather', arguments: '{"ci', state: 'input-streaming' } as never, result: undefined, interrupt: undefined, streaming: true }) : 'none'}>{labels.approve}</div>
}

describe('part renderers', () => {
  it('falls back to defaults without a provider', () => {
    const { container } = render(<Probe />)
    expect(container.textContent).toBe(DEFAULT_PART_LABELS.approve)
    expect(container.firstElementChild?.getAttribute('data-hit')).toBe('none')
  })
  it('resolves by tool name, then default, and overrides labels', () => {
    const renderers = definePartRenderers({ toolCall: { default: () => 'D', get_weather: () => 'W' } })
    const { container } = render(<PartRenderersProvider renderers={renderers} labels={{ approve: 'OK' }}><Probe /></PartRenderersProvider>)
    expect(container.firstElementChild?.getAttribute('data-hit')).toBe('W')
    expect(container.textContent).toBe('OK')
  })
})
```

- [ ] **Step 2: 跑测试确认失败** — 七个文件 FAIL（模块不存在）

- [ ] **Step 3: 实现**

`threads.ts` 要点：`'local'` 后端在 `localStorage[key]` 存 `ThreadMeta[]` JSON；读时 `try/catch`（SSR / 私密模式返回 `[]`）；每次写后通知本地 listener；`subscribe` 同时 `window.addEventListener('storage', e => e.key === key && notify())`（多 tab）；`list()` 返回排序后的**稳定引用**（缓存，写入才换引用——`useSyncExternalStore` 需要）；`useThreadIndex` = `useSyncExternalStore(index.subscribe, index.list, index.list)`；`threadPersistence`：`getItem` 透传；`setItem(id, state)` 先 `await base.setItem` 再 `index.touch(id, { messageCount: state.messages.length, preview: lastText(state.messages).slice(0, 200), updatedAt: Date.now(), title: index.get(id)?.title || threadTitleFrom(state.messages) })`——`state` 可能是 `UIMessage[]` 或 `{ messages, resume? }`（`ChatPersistedState`），两种都处理；`removeItem` 后 `index.remove`。`groupThreadsByDay` 按本地日期边界（`new Date(ts).toDateString()` 与 now/now-1 天比较）。`threadTitleFrom` 取首条 user 消息的 text parts 拼接，超过 `max`（默认 40）截断加 `…`。

`selection.ts`：`useStoredState<ModelSelection>(key, initial ?? { provider: catalog.providers[0].id, model: catalog.providers[0].models[0].id, thinking: 'off' })`；`setModel(ref)` → `parseModelRef` → `clampThinkingLevel(catalog.getModel(ref), current.thinking)`；`forwardedProps` 用 `useMemo` 保持引用稳定（`useChat` 用它做 effect 依赖）。

`stored-state.ts`：`useSyncExternalStore` 包一层 localStorage（per-key listener 集合），`typeof window === 'undefined'` 时返回 initial；写入 `JSON.stringify`，解析失败回 initial。

`usage.ts`：内部 `useRef` 存 `pendingByRun: Map<runId, TokenUsage>` 与 state `{ total, lastRun, byMessage }`；`onChunk`：`chunk.type === EventType.RUN_FINISHED` → `const u = Array.isArray(chunk.usage) ? fromSpecTokenUsage(chunk.usage, chunk.metadata?.tanstack?.usage) : chunk.usage`；`u` 存在则 `pending.set(runId, addTokenUsage(pending.get(runId), u))`；`onFinish(message)`：把 pending 里**所有** run 的累计（通常只有一个）归到 `message.id`，清空 pending，更新 `total`/`lastRun`。`addTokenUsage` 逐字段相加（含 `promptTokensDetails.cachedTokens/cacheWriteTokens`、`completionTokensDetails.reasoningTokens`）。

`messages.ts`：`messageText` 只取 `text` part，用 `\n\n` 连接；`messagesToMarkdown`：可选 `# title`，每条 `**User**`/`**Assistant**` 段落 + 文本，`includeThinking` 时 thinking 以 `> ` 引用块；`editAndResend`：`status !== 'ready'` 先 `stop()`；找 `messageId` 的索引 `i`（必须是 user 消息，否则 throw `Error('cadenza-ai: editAndResend needs a user message id')`）；`setMessages(messages.slice(0, i))`；`await sendMessage(content)`；`isThinkingComplete`：`status !== 'streaming'` → true；`part.signature` 存在 → true；`message.parts.slice(partIndex + 1).some(p => p.type === 'text' || p.type === 'tool-call')` → true；`sourcesOf`：遍历 `tool-call` parts，`metadata.sources` 数组直接收（`{ url, title?, snippet? }` 形状）；`metadata.providerExecuted && metadata.anthropic?.resultBlockType === 'web_search_tool_result'` 时从 `part.output`（数组或 `{ results }`）里收 `url/title`；去重按 url。

`attachments.ts`：`fileToContentPart`：`file.size > maxBytes` → throw `Error('cadenza-ai: attachment exceeds the … byte limit')`；kind 由 `attachmentKindOf(file.type)`（空 type 按扩展名 `.pdf/.md/.txt` 兜底），不支持 → throw；base64 = `await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(String(fr.result).split(',')[1]); fr.readAsDataURL(file) })`；返回 `{ type: kind, source: { type: 'data', value, mimeType: file.type || 推断 } }`。`useAttachmentDraft`：`items` state；`add` 对 File 生成 `{ id: newId(), kind, state: 'idle', name, mimeType, size, file, previewUrl: kind === 'image' ? URL.createObjectURL(file) : undefined }`，对 part 生成 `{ id, kind: part.type, state: 'done', name: kind, mimeType: source.mimeType ?? '', size: 0, part }`；不支持的 mime → `state: 'error', error`；`remove` 释放 objectURL；`toParts` 并行 `fileToContentPart`；`accept` = `image/*,audio/*,video/*,application/pdf,text/plain,text/markdown` 按 `options.accept` 过滤。

`byok.ts`：`createByok({ persistent = false, catalog })` → `defineByok({ storage: persistent ? passkeyStorage() : memoryStorage() })`；若 `catalog`，立即 `byok.setServerCoverage(Object.fromEntries(catalog.providers.filter(p => !p.keyRequired).map(p => [p.id, true])))`。`useServerCoverage(byok, url = '/api/ai/catalog')`：`useEffect` 里 `fetch(url)` → json → `byok.setServerCoverage({ ...current, ...json.coverage })`（合并，不覆盖 keyless 的 true）→ state；失败进 `error`，不抛。

`renderers.tsx`：`DEFAULT_PART_LABELS`（英文：`thinking: 'Thinking…'`, `thought: s => \`Thought for ${s}s\``, `toolPending: 'Preparing'`, `toolRunning: 'Running'`, `toolApprovalRequested: 'Needs approval'`, `toolApproved: 'Approved'`, `toolDenied: 'Denied'`, `toolDone: 'Done'`, `toolFailed: 'Failed'`, `toolGroup: n => \`Ran ${n} tools\``, `approve: 'Approve'`, `deny: 'Deny'`, `sources: n => \`${n} sources\``）；context 默认值 `{ renderers: {}, labels: DEFAULT_PART_LABELS }`（可选 context 三定式 (b)）；Provider 里 `useMemo` 合并 labels；dev-only `displayName`。

`runtime/index.ts` 逐文件 `export *`；`src/index.ts` 追加 `export * from './catalog'`（若 Phase 1a 未加）与 `export * from './runtime'`。

- [ ] **Step 4: 跑测试确认通过** — 七个文件 PASS；`cd packages/ai && npx tsc`；`pnpm exec eslint --fix packages/ai/src/runtime packages/ai/test`。

- [ ] **Step 5: 提交** — `feat(ai): runtime conventions`（threads / selection / usage / messages / attachments / byok / renderers + 测试）。

---

### Task B: 部件视图（`src/view/{markdown,reasoning,tool-call,approval,media-part,sources,structured-output}.tsx`）

**Files:**
- Create: 上述七个文件
- Test: `packages/ai/test/view-parts.test.tsx`

**Interfaces（Consumes A 的 `usePartRenderers` / `PartLabels` / `Source`；Produces）:**

```ts
export interface MarkdownProps { content: string, streaming?: boolean, translations?: Partial<StreamdownTranslations>, className?: string }
export function Markdown(props: MarkdownProps): ReactElement

export interface ReasoningProps { content: string, complete: boolean, startedAt?: number, open?: boolean, defaultOpen?: boolean, onOpenChange?: (open: boolean, details: CollapsibleChangeEventDetails | ChangeEventDetails<'none'>) => void, children: ReactNode, className?: string }
export interface ReasoningState { complete: boolean, open: boolean }
export function Reasoning(props: ReasoningProps): ReactElement // children = 触发器文案（组合部件零默认）

export interface ToolCallCardProps { part: ToolCallPart, result?: ToolResultPart, interrupt?: ToolApprovalInterrupt, streaming?: boolean, open?: boolean, defaultOpen?: boolean, onOpenChange?: (open: boolean, details: CollapsibleChangeEventDetails | ChangeEventDetails<'none'>) => void, children?: ReactNode, className?: string }
export interface ToolCallCardState { pending: boolean, approvalRequested: boolean, approvalResponded: boolean, complete: boolean, error: boolean }
export function ToolCallCard(props: ToolCallCardProps): ReactElement

export interface ToolCallGroupProps { count: number, children: ReactNode, open?: boolean, defaultOpen?: boolean, onOpenChange?: (open: boolean, details: CollapsibleChangeEventDetails | ChangeEventDetails<'none'>) => void, className?: string }
export function ToolCallGroup(props: ToolCallGroupProps): ReactElement // 标题文案由 caller 放在 children 前？不——children 是折叠体；标题用 `ToolCallGroupTrigger { children }`

export interface ApprovalActionsProps { interrupt: ToolApprovalInterrupt, children: ReactNode, className?: string }
export function ApprovalActions(props: ApprovalActionsProps): ReactElement
export type ApprovalApproveProps = ButtonProps & { editedArgs?: unknown }
export function ApprovalApprove(props: ApprovalApproveProps): ReactElement
export type ApprovalDenyProps = ButtonProps
export function ApprovalDeny(props: ApprovalDenyProps): ReactElement

export interface MediaPartProps { part: ImagePart | AudioPart | VideoPart | DocumentPart, className?: string }
export function MediaPart(props: MediaPartProps): ReactElement

export interface SourcesProps { sources: readonly Source[], children: ReactNode, open?: boolean, defaultOpen?: boolean, onOpenChange?: (open: boolean, details: CollapsibleChangeEventDetails | ChangeEventDetails<'none'>) => void, className?: string }
export function Sources(props: SourcesProps): ReactElement

export interface StructuredOutputProps { part: StructuredOutputPart, className?: string }
export function StructuredOutput(props: StructuredOutputProps): ReactElement
```

裁定（补 spec 未写细的一处）：`ToolCallGroup` 的标题走组合部件 `ToolCallGroupTrigger { children } & ComponentProps<'button'>`（放 `CollapsibleTrigger` 上），`ToolCallGroup` 的 `children` 是折叠体；`ToolCallCard` 的 header 由部件自绘（工具名 + 状态图标，无文字），`children` 落在 body 末尾（`ApprovalActions` 的位置）。

- [ ] **Step 1: 写失败测试**

```tsx
// packages/ai/test/view-parts.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ApprovalActions, ApprovalApprove, ApprovalDeny } from '../src/view/approval'
import { MediaPart } from '../src/view/media-part'
import { Reasoning } from '../src/view/reasoning'
import { StructuredOutput } from '../src/view/structured-output'
import { ToolCallCard, ToolCallGroup, ToolCallGroupTrigger } from '../src/view/tool-call'

const q = (c: HTMLElement, s: string): HTMLElement | null => c.querySelector(s)

describe('parts', () => {
  it('Reasoning opens while incomplete, auto-collapses once on completion, and keeps a manual open', async () => {
    const { container, rerender } = render(<Reasoning content="hmm" complete={false}>Thinking</Reasoning>)
    expect(q(container, '[data-slot=reasoning]')?.hasAttribute('data-complete')).toBe(false)
    expect(q(container, '[data-slot=reasoning]')?.hasAttribute('data-open')).toBe(true)
    rerender(<Reasoning content="hmm" complete>Thought</Reasoning>)
    expect(q(container, '[data-slot=reasoning]')?.hasAttribute('data-complete')).toBe(true)
    expect(q(container, '[data-slot=reasoning]')?.hasAttribute('data-open')).toBe(false)
    await userEvent.click(screen.getByText('Thought'))
    expect(q(container, '[data-slot=reasoning]')?.hasAttribute('data-open')).toBe(true)
    rerender(<Reasoning content="hmm" complete>Thought</Reasoning>)
    expect(q(container, '[data-slot=reasoning]')?.hasAttribute('data-open')).toBe(true)
  })

  it('ToolCallCard mirrors the seven tool states as named attributes', () => {
    const base = { id: 'c', name: 'get_weather', arguments: '{"city":"Par' } as never
    const { container, rerender } = render(<ToolCallCard part={{ ...base, state: 'input-streaming' }} />)
    const card = (): HTMLElement => q(container, '[data-slot=tool-call-card]')!
    expect(card().hasAttribute('data-pending')).toBe(true)
    rerender(<ToolCallCard part={{ ...base, state: 'approval-requested' }} />)
    expect(card().hasAttribute('data-approval-requested')).toBe(true)
    rerender(<ToolCallCard part={{ ...base, state: 'complete', arguments: '{"city":"Paris"}' }} />)
    expect(card().hasAttribute('data-complete')).toBe(true)
    rerender(<ToolCallCard part={{ ...base, state: 'error', arguments: '{}' }} />)
    expect(card().hasAttribute('data-error')).toBe(true)
    expect(screen.getByText('get_weather')).toBeTruthy()
  })

  it('ToolCallGroup wraps its children behind a trigger', async () => {
    const { container } = render(
      <ToolCallGroup count={3}>
        <ToolCallGroupTrigger>Ran 3 tools</ToolCallGroupTrigger>
        <div>body</div>
      </ToolCallGroup>
    )
    expect(q(container, '[data-slot=tool-call-group]')?.getAttribute('data-count')).toBe('3')
    await userEvent.click(screen.getByText('Ran 3 tools'))
    expect(screen.getByText('body')).toBeTruthy()
  })

  it('ApprovalActions resolves through the interrupt and disables once responded', async () => {
    const resolveInterrupt = vi.fn()
    const interrupt = { kind: 'tool-approval', status: 'pending', toolCallId: 'c', toolName: 'move', originalArgs: {}, resolveInterrupt } as never
    const { rerender } = render(
      <ApprovalActions interrupt={interrupt}>
        <ApprovalApprove>Approve</ApprovalApprove>
        <ApprovalDeny>Deny</ApprovalDeny>
      </ApprovalActions>
    )
    await userEvent.click(screen.getByText('Approve'))
    expect(resolveInterrupt).toHaveBeenCalledWith(true, { editedArgs: undefined })
    await userEvent.click(screen.getByText('Deny'))
    expect(resolveInterrupt).toHaveBeenCalledWith(false)
    rerender(
      <ApprovalActions interrupt={{ ...interrupt, status: 'submitting' }}>
        <ApprovalApprove>Approve</ApprovalApprove>
        <ApprovalDeny>Deny</ApprovalDeny>
      </ApprovalActions>
    )
    expect((screen.getByText('Approve') as HTMLButtonElement).disabled).toBe(true)
  })

  it('MediaPart picks the element by part type', () => {
    const { container } = render(
      <>
        <MediaPart part={{ type: 'image', source: { type: 'data', mimeType: 'image/png', value: 'AQID' } }} />
        <MediaPart part={{ type: 'audio', source: { type: 'url', value: 'https://x/a.mp3' } }} />
        <MediaPart part={{ type: 'document', source: { type: 'data', mimeType: 'application/pdf', value: 'AA==' } }} />
      </>
    )
    expect(q(container, 'img')?.getAttribute('src')).toBe('data:image/png;base64,AQID')
    expect(q(container, 'audio')?.getAttribute('src')).toBe('https://x/a.mp3')
    expect(q(container, '[data-slot=attachment-title]')?.textContent).toContain('pdf')
  })

  it('StructuredOutput shows partial while streaming and data when complete', () => {
    const { container, rerender } = render(<StructuredOutput part={{ type: 'structured-output', status: 'streaming', partial: { a: 1 }, raw: '{"a":1' }} />)
    expect(q(container, '[data-slot=structured-output]')?.hasAttribute('data-streaming')).toBe(true)
    rerender(<StructuredOutput part={{ type: 'structured-output', status: 'complete', data: { a: 1 }, raw: '{"a":1}' }} />)
    expect(q(container, '[data-slot=structured-output]')?.hasAttribute('data-complete')).toBe(true)
  })
})
```

- [ ] **Step 2: 跑测试确认失败** — FAIL

- [ ] **Step 3: 实现**

`markdown.tsx`：`import { Streamdown } from 'streamdown'`、`import { code } from '@streamdown/code'`、`import { math } from '@streamdown/math'`、`import { cjk } from '@streamdown/cjk'`（各插件的导出名以其 `dist/index.d.ts` 为准，实施前 `grep export`）；`<Streamdown mode={streaming ? 'streaming' : 'static'} isAnimating={streaming} parseIncompleteMarkdown plugins={{ code, math, cjk }} shikiTheme={['github-light-default', 'vesper']} controls={{ code: { copy: true, download: false }, table: { copy: true, download: false, fullscreen: false } }} dir="auto" translations={translations} components={{ a: ({ node: _n, ...p }) => <a {...p} target="_blank" rel="noreferrer" /> }} className={cn('cadenza-markdown', className)}>{content}</Streamdown>`；外层 `<div data-slot="markdown" data-streaming={dataAttr(streaming)}>`。`props` 名以安装的 streamdown 2.6 `dist/index.d.ts:526-586` 为准（`mode` / `parseIncompleteMarkdown` / `shikiTheme` / `controls` / `isAnimating` / `plugins` / `translations` / `dir`）。

`reasoning.tsx`：`useControllableState({ value: open, defaultValue: defaultOpen ?? !complete, onChange, fallback: !complete })`；`useEffect` 监听 `complete` 从 false → true：若用户没有手动展开过（`manualRef`），`setOpen(false)` 并调 `onOpenChange?.(false, createChangeEventDetails('none'))`；`CollapsibleTrigger` 的 `onOpenChange` 用户交互置 `manualRef = true`；`Collapsible` 的 `open/onOpenChange` 受控；结构：`<Collapsible data-slot="reasoning" data-complete data-open>` > `CollapsibleTrigger`（`Marker role="status"` + `MarkerContent className={!complete ? 'shimmer' : undefined}`{children}；complete 且 `startedAt` 时附 `<span data-slot="reasoning-duration">{seconds}s</span>`——秒数是数据不是文案）> `CollapsiblePanel` > `<Markdown content={content} streaming={!complete} />`。`data-open` 用 `dataAttr(open)`。

`tool-call.tsx`：`ToolCallCard`：`Collapsible`（`defaultOpen ?? false`）`data-slot="tool-call-card"` + 五个名称型属性（`pending` = state ∈ awaiting-input/input-streaming/input-complete；`approvalRequested`；`approvalResponded`；`complete`；`error`）；header = `CollapsibleTrigger`：`<span data-slot="tool-call-name">{part.name}</span>` + 状态图标（`Spinner aria-hidden`（pending）/ `IconCheck`（complete）/ `IconX`（error）/ `IconClock`（approval-requested），来自 `@tabler/icons-react`，`aria-hidden`）；body = `CollapsiblePanel`：`input` = `parsePartialJSON(part.arguments)`（失败 `undefined`）→ `<Markdown content={'```json\n' + JSON.stringify(input, null, 2) + '\n```'} />`，`output`（`part.output ?? result?.content`）同理；`children` 在最后。`ToolCallGroup`：`Collapsible data-slot="tool-call-group" data-count={count}`，`ToolCallGroupTrigger` = `CollapsibleTrigger` 转出（类型 `CollapsibleTriggerProps`），children 里剩余元素放 `CollapsiblePanel`——用 `findComposedPart` 不可得，所以约定：`ToolCallGroup` 的 children 第一个元素必须是 `ToolCallGroupTrigger`（DialogTrigger 位置契约同款），实现用 `Children.toArray` 切第一个。

`approval.tsx`：`ApprovalContext`（`{ interrupt }`，缺 Provider 抛品牌错误）；`ApprovalActions` = `<div role="group" data-slot="approval-actions" data-approved={dataAttr(responded && approved)} data-denied={…}>`；`ApprovalApprove` = `Button`（`disabled={interrupt.status !== 'pending'}`，`onClick` 先跑 caller 的再 `interrupt.resolveInterrupt(true, { editedArgs })`）；`ApprovalDeny` 同理 `resolveInterrupt(false)`。「已响应」的判定：`interrupt.status !== 'pending'`。

`media-part.tsx`：`src` = `source.type === 'data' ? \`data:${mimeType};base64,${value}\` : value`；image → `<Attachment size="sm"><AttachmentMedia variant="image"><img src alt="" /></AttachmentMedia></Attachment>`（`alt` 用 `part.metadata?.name ?? ''`）；audio → `<audio controls src>`；video → `<video controls src>`；document → `<Attachment size="sm"><AttachmentMedia variant="icon"><IconFileText /></AttachmentMedia><AttachmentContent><AttachmentTitle>{name ?? mimeType.split['/'](1)}</AttachmentTitle></AttachmentContent></Attachment>`。

`sources.tsx`：`Collapsible data-slot="sources" data-count`；`CollapsibleTrigger`{children}；`CollapsiblePanel` > `<ol>` > `<li><a href target="_blank" rel="noreferrer">{title ?? url}</a>{snippet && <p>}</li>`。

`structured-output.tsx`：`<div data-slot="structured-output" data-streaming data-complete data-error>`；streaming → `<Markdown content={json(partial)} streaming />` + `<Spinner aria-hidden />`；complete → `json(data)`；error → `errorMessage` 文本。

- [ ] **Step 4: 跑测试确认通过**；typecheck；eslint。

---

### Task C: 输入区与选择器（`src/view/{composer,suggestions,queue,model-picker}.tsx`）

**Files:**
- Create: 上述四个文件
- Test: `packages/ai/test/view-composer.test.tsx`、`packages/ai/test/view-pickers.test.tsx`

**Interfaces:**

```ts
export type ComposerSubmitReason = 'keyboard' | 'none'
export interface ComposerProps extends Omit<ComponentProps<'form'>, 'onSubmit' | 'onChange' | 'defaultValue' | 'value'> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string, details: ChangeEventDetails<'input-change' | 'none'>) => void
  onValueCommitted: (value: string, details: GenericEventDetails<ComposerSubmitReason>) => void
  status: ChatClientState
  onStop?: (details: GenericEventDetails<'escape-key' | 'none'>) => void
  editing?: boolean
  onEditCancel?: (details: GenericEventDetails<'escape-key'>) => void
  disabled?: boolean
  onFiles?: (files: File[], details: GenericEventDetails<'drag' | 'input-paste'>) => void
  children: ReactNode
}
export interface ComposerState { submitted: boolean, streaming: boolean, error: boolean, dragging: boolean, editing: boolean }
export function Composer(props: ComposerProps): ReactElement
export type ComposerTextareaProps = InputGroupTextareaProps
export const ComposerTextarea: (props: ComposerTextareaProps) => ReactElement // 转出 InputGroupTextarea，加 data-slot、从 context 读 value/onChange/keydown
export type ComposerToolbarProps = InputGroupAddonProps
export const ComposerToolbar: (props: ComposerToolbarProps) => ReactElement // InputGroupAddon align="block-end"
export type ComposerSubmitProps = ButtonProps & { onStop?: (details: GenericEventDetails<'none'>) => void }
export function ComposerSubmit(props: ComposerSubmitProps): ReactElement // 从 context 读 status；submitted|streaming → 停止图标 + onStop，否则 type="submit"；空输入 disabled
export interface ComposerAttachmentsProps { items: readonly DraftAttachment[], onRemove: (id: string, details: GenericEventDetails<'none'>) => void, className?: string }
export function ComposerAttachments(props: ComposerAttachmentsProps): ReactElement
export type ComposerAttachProps = InputGroupButtonProps & { accept?: string, multiple?: boolean, onFiles: (files: File[], details: GenericEventDetails<'input-change'>) => void }
export function ComposerAttach(props: ComposerAttachProps): ReactElement
export type ComposerDictateProps = InputGroupButtonProps & { onRecording: (part: AudioPart, details: GenericEventDetails<'imperative-action'>) => void }
export function ComposerDictate(props: ComposerDictateProps): ReactElement
export function useComposer(): { value: string, setValue: (v: string, details) => void, status: ChatClientState, editing: boolean, submit: (details) => void, stop: (details) => void } // 守卫 hook

export interface SuggestionsProps { onValueChange: (value: string, details: ChangeEventDetails<'item-press'>) => void, children: ReactNode, className?: string }
export function Suggestions(props: SuggestionsProps): ReactElement
export type SuggestionsItemProps = Omit<ButtonProps, 'value'> & { value: string }
export function SuggestionsItem(props: SuggestionsItemProps): ReactElement

export interface QueueListProps { queue: readonly QueuedMessage[], onCancel: (id: string, details: GenericEventDetails<'none'>) => void, children?: ReactNode, className?: string }
export function QueueList(props: QueueListProps): ReactElement // Item 行：文本 + 取消按钮（aria-label 默认 'Cancel'）

export interface ModelPickerProps { catalog: Catalog, value?: string, defaultValue?: string, onValueChange: (ref: string, details: ChangeEventDetails<'item-press' | 'none'>) => void, byok?: ByokSnapshot, disabledProviders?: readonly string[], className?: string }
export function ModelPicker(props: ModelPickerProps): ReactElement // Combobox 按 provider 分组；ref = modelRef
export interface ThinkingLevelPickerProps { model?: Model, value?: ThinkingLevel, defaultValue?: ThinkingLevel, onValueChange: (level: ThinkingLevel, details: ChangeEventDetails<'item-press' | 'none'>) => void, className?: string }
export function ThinkingLevelPicker(props: ThinkingLevelPickerProps): ReactElement | null // supportedThinkingLevels(model).length <= 1 → null
```

- [ ] **Step 1: 写失败测试**

```tsx
// packages/ai/test/view-composer.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Composer, ComposerSubmit, ComposerTextarea, ComposerToolbar } from '../src/view/composer'
import { Suggestions, SuggestionsItem } from '../src/view/suggestions'

function setup(props: Partial<React.ComponentProps<typeof Composer>> = {}) {
  const onValueCommitted = vi.fn()
  const onStop = vi.fn()
  const onFiles = vi.fn()
  const onEditCancel = vi.fn()
  const utils = render(
    <Composer status="ready" onValueCommitted={onValueCommitted} onStop={onStop} onFiles={onFiles} onEditCancel={onEditCancel} {...props}>
      <ComposerTextarea placeholder="Say something" />
      <ComposerToolbar><ComposerSubmit aria-label="Send" /></ComposerToolbar>
    </Composer>,
  )
  return { ...utils, onValueCommitted, onStop, onFiles, onEditCancel, textarea: screen.getByPlaceholderText('Say something') as HTMLTextAreaElement }
}

describe('Composer', () => {
  it('submits on Enter with a keyboard reason, inserts a newline on Shift+Enter, ignores composing', async () => {
    const { textarea, onValueCommitted } = setup()
    await userEvent.type(textarea, 'hello')
    await userEvent.keyboard('{Shift>}{Enter}{/Shift}')
    expect(onValueCommitted).not.toHaveBeenCalled()
    expect(textarea.value).toBe('hello\n')
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, isComposing: true } as never))
    expect(onValueCommitted).not.toHaveBeenCalled()
    await userEvent.keyboard('{Enter}')
    expect(onValueCommitted).toHaveBeenCalledTimes(1)
    expect(onValueCommitted.mock.calls[0]![0]).toBe('hello\n')
    expect(onValueCommitted.mock.calls[0]![1].reason).toBe('keyboard')
  })

  it('renders a stop control while streaming and calls onStop; Escape stops too', async () => {
    const { onStop, textarea } = setup({ status: 'streaming' })
    const form = textarea.closest('form')!
    expect(form.hasAttribute('data-streaming')).toBe(true)
    await userEvent.click(screen.getByLabelText('Send'))
    expect(onStop).toHaveBeenCalledTimes(1)
    textarea.focus()
    await userEvent.keyboard('{Escape}')
    expect(onStop).toHaveBeenCalledTimes(2)
  })

  it('Escape cancels the edit instead of stopping while editing', async () => {
    const { onEditCancel, onStop, textarea } = setup({ editing: true })
    expect(textarea.closest('form')?.hasAttribute('data-editing')).toBe(true)
    textarea.focus()
    await userEvent.keyboard('{Escape}')
    expect(onEditCancel).toHaveBeenCalledTimes(1)
    expect(onStop).not.toHaveBeenCalled()
  })

  it('hands dropped and pasted files to onFiles with the reason', async () => {
    const { onFiles, textarea } = setup()
    const file = new File(['x'], 'a.png', { type: 'image/png' })
    const form = textarea.closest('form')!
    form.dispatchEvent(Object.assign(new Event('drop', { bubbles: true }), { dataTransfer: { files: [file], types: ['Files'] } }))
    expect(onFiles.mock.calls[0]![1].reason).toBe('drag')
    await userEvent.paste({ clipboardData: { files: [file], getData: () => '' } } as never)
    expect(onFiles).toHaveBeenCalledTimes(2)
  })

  it('disables submit on empty input', () => {
    setup()
    expect((screen.getByLabelText('Send') as HTMLButtonElement).disabled).toBe(true)
  })
})

describe('Suggestions', () => {
  it('routes the pressed value through the root callback', async () => {
    const onValueChange = vi.fn()
    render(<Suggestions onValueChange={onValueChange}><SuggestionsItem value="Plan a rehearsal">Plan a rehearsal</SuggestionsItem></Suggestions>)
    await userEvent.click(screen.getByText('Plan a rehearsal'))
    expect(onValueChange).toHaveBeenCalledWith('Plan a rehearsal', expect.objectContaining({ reason: 'item-press' }))
  })
})
```

```tsx
// packages/ai/test/view-pickers.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { defaultCatalog } from '../src/catalog'
import { ModelPicker, ThinkingLevelPicker } from '../src/view/model-picker'

describe('pickers', () => {
  it('ModelPicker shows the current model and marks providers without a key', () => {
    render(<ModelPicker catalog={defaultCatalog} defaultValue="openai/gpt-5.2" onValueChange={() => {}} byok={{ status: { openai: { state: 'empty' } }, locked: false, prompt: null, storageError: null } as never} />)
    expect(screen.getByRole('combobox')).toBeTruthy()
    expect(screen.getByText(/gpt-5\.2/i)).toBeTruthy()
  })
  it('ThinkingLevelPicker renders nothing for a model without reasoning and lists supported levels otherwise', () => {
    const none = defaultCatalog.models.find(m => !m.reasoning)!
    const { container, rerender } = render(<ThinkingLevelPicker model={none} defaultValue="off" onValueChange={() => {}} />)
    expect(container.firstChild).toBeNull()
    const fable = defaultCatalog.getModel('anthropic/claude-fable-5')!
    rerender(<ThinkingLevelPicker model={fable} defaultValue="low" onValueChange={vi.fn()} />)
    expect(container.querySelector('[data-slot=thinking-level-picker]')).not.toBeNull()
  })
})
```

- [ ] **Step 2: 跑测试确认失败** — FAIL

- [ ] **Step 3: 实现**

`composer.tsx`：根 `<form data-slot="composer" data-submitted data-streaming data-error data-dragging data-editing onSubmit={e => { e.preventDefault(); commit(createGenericEventDetails('none', e)) }} onDragOver onDragLeave onDrop onPaste>`；`useControllableState({ value, defaultValue, onChange: onValueChange, fallback: '' })`（`onChange` 要带 details——包一层：`(v) => onValueChange?.(v, createChangeEventDetails('input-change'))`，程序性 `setValue` 用 `'none'`）；`ComposerContext` 提供 `{ value, setValue, status, editing, disabled, submit, stop, textareaRef }`；`ComposerTextarea` 渲染 `InputGroupTextarea`（`value`、`onChange`、`rows={1}`、`disabled`）并挂 `onKeyDown`：`e.nativeEvent.isComposing || e.key === 'Process'` → return；`Enter` 且 `!shiftKey` → `preventDefault()` + `commit(createGenericEventDetails('keyboard', e))`（空白串不提交）；`Escape` → `editing ? onEditCancel?.(details('escape-key')) : onStop?.(details('escape-key'))`。`commit` 后清空 `value`（`setValue('', 'none')`）。拖放：`onDrop` 取 `e.dataTransfer.files` → `onFiles(files, details('drag'))`；`onPaste` 取 `e.clipboardData.files`（非空才拦）→ `'input-paste'`。`InputGroup` 作为 form 的直接子元素包住 textarea 与 toolbar（`has-[>textarea]` 与 `block-end` addon 规则需要它们是 `InputGroup` 的直接子元素——所以 `Composer` 渲染 `<form><InputGroup>{children}</InputGroup></form>`）。`ComposerSubmit`：`status ∈ submitted|streaming` → `<Button type="button" size="icon-sm" onClick={stop}>` 图标 `IconPlayerStop`，否则 `<Button type="submit" size="icon-sm" disabled={!value.trim() || disabled}>` 图标 `IconArrowUp`（图标无文字；`aria-label` 由 caller 传，默认 `'Send'`/`'Stop'` 英文兜底）。`ComposerAttach`：隐藏 `<input type="file" accept multiple>` + `InputGroupButton`（图标 `IconPaperclip`，`aria-label` 默认 `'Attach'`）。`ComposerDictate`：`useAudioRecorder()`，按下切换 `start()`/`stop()`，`stop()` 的 `AudioRecording.part` → `onRecording(part, details('imperative-action'))`；`data-recording`；`isSupported` 为假时 `disabled`。`ComposerAttachments`：`AttachmentGroup` > `Attachment state={item.state} size="sm"` > `AttachmentMedia variant={image ? 'image' : 'icon'}`（image 用 `previewUrl`）+ `AttachmentContent` > `AttachmentTitle`{name} + `AttachmentActions` > `AttachmentAction aria-label="Remove" onClick={() => onRemove(id, details('none'))}`。

`suggestions.tsx`：`SuggestionsContext { onValueChange }`；`Suggestions` = `<ScrollArea orientation="horizontal"><div role="group" data-slot="suggestions" className="flex gap-2">`；`SuggestionsItem` = `Button variant="outline" size="sm" data-slot="suggestions-item" data-value={value}` `onClick` → caller 的 onClick 先，再 `onValueChange(value, createChangeEventDetails('item-press', e))`。

`queue.tsx`：`<ItemGroup data-slot="queue-list">` 每条 `Item size="xs"` > `ItemContent` > `ItemTitle`{content 文本} + `ItemActions` > `Button variant="ghost" size="icon-xs" aria-label="Cancel" onClick={() => onCancel(id, details('none'))}`（`IconX`）。

`model-picker.tsx`：`ModelPicker` 用 `Combobox`（`value` = ref 字符串，`items` = catalog.models 的 ref 列表；`ComboboxTrigger` + `ComboboxValue`；`ComboboxPopup` > `ComboboxInput` + `ComboboxList` > 按 provider `ComboboxGroup` > `ComboboxGroupLabel`{provider.label}（`data-key-missing` 当 `byok?.status[provider.id]?.state === 'empty'` 且 `provider.keyRequired`）> `ComboboxItem value={ref}`{model.name + 图标：`reasoning` → `IconBrain aria-label="Reasoning"`、`input.includes('image')` → `IconPhoto aria-label="Vision"`，`contextWindow` 数字}；`disabledProviders` 的项 `disabled`；`onValueChange(ref, details)` 透传 Combobox 的 details（reason 是 Base UI 的 `'item-press'` 等）。`ThinkingLevelPicker`：`supportedThinkingLevels(model)`，长度 ≤ 1 返回 `null`；`Select items={levels.map(l => ({ value: l, label: l }))} value defaultValue onValueChange` + `data-slot="thinking-level-picker"`；受控用 `useControllableState`。

- [ ] **Step 4: 跑测试确认通过**；typecheck；eslint。jsdom 里 Base UI Combobox/Select 的弹层交互不测（只测渲染与 `null`）。

---

### Task D: 会话列表与密钥对话框（`src/view/{thread-list,byok-key-dialog}.tsx`）

**Files:**
- Create: 两个文件
- Test: `packages/ai/test/view-thread-list.test.tsx`、`packages/ai/test/view-byok.test.tsx`

**Interfaces:**

```ts
export interface ThreadListProps { index: ThreadIndex, threads: readonly ThreadMeta[], value?: string, defaultValue?: string, onValueChange: (id: string, details: ChangeEventDetails<'item-press' | 'none'>) => void, children: ReactNode, className?: string }
export function ThreadList(props: ThreadListProps): ReactElement // ScrollArea > div role="list"；context { index, value, select }
export interface ThreadListGroupProps { children: ReactNode, className?: string } // 第一个 child 是标题（ThreadListGroupLabel），其余是 item
export function ThreadListGroup(props): ReactElement
export type ThreadListGroupLabelProps = ComponentProps<'div'>
export function ThreadListGroupLabel(props): ReactElement
export interface ThreadListItemProps { thread: ThreadMeta, children?: ReactNode, className?: string } // Item render={<button>}；children = 动作区（ItemActions）
export interface ThreadListItemState { active: boolean, archived: boolean, renaming: boolean }
export function ThreadListItem(props): ReactElement
export type ThreadListRenameProps = ButtonProps // 点击进入行内 Input：Enter 提交 / Escape 取消 / blur 提交 → index.rename
export type ThreadListArchiveProps = ButtonProps // → index.archive(id, !archived)
export type ThreadListDeleteProps = ButtonProps // → index.remove(id)；确认由 caller 包 AlertDialog
export type ThreadListNewProps = ButtonProps // → index.create() → onValueChange(id, 'item-press')
export function useThreadListItem(): { thread: ThreadMeta, active: boolean } // 守卫 hook

export interface ByokKeyDialogLabels { save: string, clear: string, unlock: string, serverKey: string, title: string, description: string }
export const DEFAULT_BYOK_KEY_DIALOG_LABELS: ByokKeyDialogLabels
export interface ByokKeyDialogProps { byok: ByokClient, catalog: Catalog, coverage?: Record<string, boolean>, open?: boolean, defaultOpen?: boolean, onOpenChange?: (open: boolean, details: DialogChangeEventDetails | ChangeEventDetails<'none'>) => void, labels?: Partial<ByokKeyDialogLabels>, children?: ReactNode }
export function ByokKeyDialog(props): ReactElement // children 缺省 = catalog.providers 每个一行 ByokKeyDialogProvider
export interface ByokKeyDialogProviderProps { provider: string, children?: ReactNode, className?: string }
export function ByokKeyDialogProvider(props): ReactElement // 一行；children 追加行尾
```

- [ ] **Step 1: 写失败测试**

```tsx
// packages/ai/test/view-thread-list.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createThreadIndex } from '../src/runtime/threads'
import { ThreadList, ThreadListDelete, ThreadListGroup, ThreadListGroupLabel, ThreadListItem, ThreadListNew, ThreadListRename } from '../src/view/thread-list'

function setup() {
  const index = createThreadIndex({ storage: 'memory' })
  index.create({ id: 'a', title: 'Alpha' })
  index.create({ id: 'b', title: 'Beta' })
  const onValueChange = vi.fn()
  const ui = (): ReactElement => (
    <ThreadList index={index} threads={index.list()} value="a" onValueChange={onValueChange}>
      <ThreadListNew>New</ThreadListNew>
      <ThreadListGroup>
        <ThreadListGroupLabel>Today</ThreadListGroupLabel>
        {index.list().map(t => (
          <ThreadListItem key={t.id} thread={t}>
            <ThreadListRename aria-label="Rename" />
            <ThreadListDelete aria-label="Delete" />
          </ThreadListItem>
        ))}
      </ThreadListGroup>
    </ThreadList>
  )
  return { index, onValueChange, ...render(ui()), ui }
}

describe('ThreadList', () => {
  it('marks the active row and selects on press', async () => {
    const { onValueChange } = setup()
    const rows = screen.getAllByRole('listitem')
    expect(rows[0]!.hasAttribute('data-active')).toBe(true)
    expect(rows[0]!.getAttribute('aria-current')).toBe('page')
    await userEvent.click(screen.getByText('Beta'))
    expect(onValueChange).toHaveBeenCalledWith('b', expect.objectContaining({ reason: 'item-press' }))
  })
  it('renames inline: Enter commits, Escape cancels', async () => {
    const { index, rerender, ui } = setup()
    await userEvent.click(screen.getAllByLabelText('Rename')[0]!)
    const input = screen.getByDisplayValue('Alpha')
    await userEvent.clear(input)
    await userEvent.type(input, 'Gamma{Enter}')
    expect(index.get('a')?.title).toBe('Gamma')
    rerender(ui())
    await userEvent.click(screen.getAllByLabelText('Rename')[0]!)
    await userEvent.type(screen.getByDisplayValue('Gamma'), 'X{Escape}')
    expect(index.get('a')?.title).toBe('Gamma')
  })
  it('deletes through the index and creates through New', async () => {
    const { index, onValueChange } = setup()
    await userEvent.click(screen.getAllByLabelText('Delete')[1]!)
    expect(index.get('b')).toBeUndefined()
    await userEvent.click(screen.getByText('New'))
    expect(index.list()).toHaveLength(2)
    expect(onValueChange).toHaveBeenLastCalledWith(expect.any(String), expect.objectContaining({ reason: 'item-press' }))
  })
})
```

```tsx
// packages/ai/test/view-byok.test.tsx
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { defaultCatalog } from '../src/catalog'
import { createByok } from '../src/runtime/byok'
import { ByokKeyDialog } from '../src/view/byok-key-dialog'

describe('ByokKeyDialog', () => {
  it('opens on a key request, saves through the client, and marks server-covered providers', async () => {
    const byok = createByok({ persistent: false, catalog: defaultCatalog })
    await byok.ready()
    render(<ByokKeyDialog byok={byok} catalog={defaultCatalog} />)
    expect(screen.queryByRole('dialog')).toBeNull()
    act(() => byok.request('openai', 'missing'))
    expect(await screen.findByRole('dialog')).toBeTruthy()
    const row = screen.getByRole('dialog').querySelector('[data-slot=byok-key-dialog-provider][data-provider=openai]')!
    expect(row.getAttribute('data-key-status')).toBe('empty')
    await userEvent.type(row.querySelector('input')!, 'sk-test')
    await userEvent.click(row.querySelector('button[aria-label="Save"]')!)
    expect(byok.getSnapshot().status.openai?.state).toBe('set')
    const vertex = screen.getByRole('dialog').querySelector('[data-provider=vertex]')!
    expect(vertex.hasAttribute('data-server-key')).toBe(true)
  })
})
```

- [ ] **Step 2: 跑测试确认失败** — FAIL

- [ ] **Step 3: 实现**

`thread-list.tsx`：`ThreadListContext { index, value, select(id, details) }`；`ThreadList` = `<ScrollArea><div role="list" data-slot="thread-list">{children}</div></ScrollArea>`（受控 `useControllableState`）；`ThreadListGroup` = `<div role="group" data-slot="thread-list-group">`；`ThreadListGroupLabel` = `<div data-slot="thread-list-group-label" className="text-xs text-muted-foreground ps-3 pt-2">`；`ThreadListItem` = `<Item render={<div role="listitem" />} size="sm" data-slot="thread-list-item" data-active={dataAttr(active)} data-archived data-renaming aria-current={active ? 'page' : undefined}>`，内部 `ItemContent`：renaming 时 `<Input autoFocus defaultValue={title} onKeyDown={Enter→commit / Escape→cancel} onBlur={commit} />`，否则 `<button type="button" onClick={select}>` 包 `ItemTitle`{title} + `ItemDescription`{preview 或 messageCount}；`children` 放 `ItemActions`；`ThreadListItemContext { thread, active, renaming, setRenaming }`；`ThreadListRename` = `Button variant="ghost" size="icon-xs"`（`IconPencil`）onClick → `setRenaming(true)`；`ThreadListArchive`（`IconArchive`）→ `index.archive(id, !archived)`；`ThreadListDelete`（`IconTrash`）→ `index.remove(id)`；`ThreadListNew` = `Button variant="outline"`（children 文案）onClick → `const t = index.create(); select(t.id, createChangeEventDetails('item-press', e))`。

`byok-key-dialog.tsx`：`useByok(byok)` 取 snapshot；`useControllableState` for open，`fallback: false`；`useEffect(() => { if (snapshot.prompt) setOpen(true, 'none') }, [snapshot.prompt])`；`Dialog open onOpenChange` > `DialogPopup` > `DialogHeader`（`DialogTitle`{labels.title}、`DialogDescription`{labels.description}）> `DialogBody`（children ?? `catalog.providers.map(p => <ByokKeyDialogProvider provider={p.id} />)`）> `DialogFooter`（`locked` 时 `<Button onClick={() => byok.unlock()}>{labels.unlock}</Button>`；`DialogClose render={<Button variant="outline" />}`{'Close'} —— 关闭按钮文案：`labels.close`，加进 labels）；`ByokKeyDialogProvider`：从 context 取 `byok/catalog/labels/snapshot`，`provider = catalog.getProvider(id)`，`status = snapshot.status[id]?.state ?? 'empty'`，`serverKey = !provider.keyRequired || coverage?.[id] === true`（已查：`ByokClient` 只有 `setServerCoverage`、没有读取器，所以 `ByokKeyDialog` 接受 `coverage?: Record<string, boolean>` prop，caller 从 `useServerCoverage` 的返回传入，经 context 下发）；行 = `<div data-slot="byok-key-dialog-provider" data-provider data-key-status data-server-key>` > `Field` > `FieldLabel htmlFor`{provider.label} + `Input id type="password" autoComplete="off"`（本地 state）+ 图标按钮 `Save`（`IconCheck`，`aria-label={labels.save}`，onClick → `byok.update(id, value)`；`prompt` 非空且 `prompt.provider === id` 时 `autoFocus`）/ `Clear`（`IconX`，`byok.clear(id)`）+ `children`。`labels` 默认英文：`{ title: 'API keys', description: 'Keys stay in this browser and are sent per request in a header.', save: 'Save', clear: 'Clear', unlock: 'Unlock', close: 'Close', serverKey: 'Server key' }`（`serverKey` 作 `title`/`aria-label` 用于图标）。

- [ ] **Step 4: 跑测试确认通过**；typecheck；eslint。

---

### Task E: Transcript 家族（`src/view/transcript.tsx`）与 view 汇总

**Files:**
- Create: `packages/ai/src/view/transcript.tsx`、`packages/ai/src/view/index.ts`
- Modify: `packages/ai/src/index.ts`（追加 `export * from './view'`）
- Test: `packages/ai/test/view-transcript.test.tsx`

**Interfaces:**

```ts
export interface TranscriptProviderProps { status: ChatClientState, interrupts?: readonly ChatInterrupt[], addToolApprovalResponse?: (input: { id: string, approved: boolean }) => Promise<void> | void, children: ReactNode }
export function TranscriptProvider(props): ReactElement
export function useTranscript(): { status: ChatClientState, interrupts: readonly ChatInterrupt[], addToolApprovalResponse?: (input: { id: string, approved: boolean }) => Promise<void> | void } // 守卫 hook
export interface TranscriptProps extends Omit<MessageScrollerViewportProps, 'className' | 'children'> { children: ReactNode, autoScroll?: boolean, defaultScrollPosition?: MessageScrollerDefaultScrollPosition, className?: string }
export function Transcript(props): ReactElement
export interface TranscriptMessageProps { message: UIMessage, align?: 'start' | 'end', children?: ReactNode, className?: string }
export interface TranscriptMessageState { role: string, streaming: boolean }
export const TranscriptMessage: MemoExoticComponent<(props: TranscriptMessageProps) => ReactElement>
export interface TranscriptPartsProps { message: UIMessage, className?: string }
export function TranscriptParts(props): ReactElement
export interface TranscriptActionsProps { children: ReactNode, className?: string }
export function TranscriptActions(props): ReactElement // role="toolbar"; data-hidden 当 status === 'streaming'
export type TranscriptActionProps = ButtonProps
export function TranscriptAction(props): ReactElement // Button variant="ghost" size="icon-xs"
export interface TranscriptEmptyProps { children: ReactNode, className?: string }
export function TranscriptEmpty(props): ReactElement // Empty
export interface TranscriptPendingProps { children: ReactNode, className?: string }
export function TranscriptPending(props): ReactElement // Marker role="status" + MarkerContent shimmer
export interface TranscriptErrorProps { error: Error, children: ReactNode, className?: string }
export function TranscriptError(props): ReactElement // role="alert" data-code
```

- [ ] **Step 1: 写失败测试**

```tsx
// packages/ai/test/view-transcript.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PartRenderersProvider } from '../src/runtime/renderers'
import { Transcript, TranscriptActions, TranscriptError, TranscriptMessage, TranscriptParts, TranscriptProvider } from '../src/view/transcript'

const user = { id: 'u1', role: 'user', parts: [{ type: 'text', content: 'Hi' }] } as never
const assistant = { id: 'a1', role: 'assistant', parts: [{ type: 'thinking', content: 'hmm' }, { type: 'tool-call', id: 'c1', name: 'get_weather', arguments: '{}', state: 'complete', output: { c: 1 } }, { type: 'text', content: '**Bold**' }] } as never

describe('Transcript', () => {
  it('throws the branded error outside a provider', () => {
    expect(() => render(<Transcript><div /></Transcript>)).toThrow(/cadenza-ai: TranscriptContext is missing/)
  })

  it('renders rows with role attributes, dispatches parts, and hides actions while streaming', () => {
    const { container, rerender } = render(
      <TranscriptProvider status="ready">
        <Transcript>
          <TranscriptMessage message={user} />
          <TranscriptMessage message={assistant}>
            <TranscriptParts message={assistant} />
            <TranscriptActions><button type="button">Copy</button></TranscriptActions>
          </TranscriptMessage>
        </Transcript>
      </TranscriptProvider>,
    )
    const rows = container.querySelectorAll('[data-slot=transcript-message]')
    expect(rows[0]!.getAttribute('data-role')).toBe('user')
    expect(rows[0]!.querySelector('[data-slot=bubble]')?.dataset.variant).toBe('muted')
    expect(rows[1]!.querySelector('[data-slot=bubble]')?.dataset.variant).toBe('ghost')
    expect(container.querySelector('[data-slot=reasoning]')).not.toBeNull()
    expect(container.querySelector('[data-slot=tool-call-card]')).not.toBeNull()
    expect(container.querySelector('[data-slot=markdown]')).not.toBeNull()
    expect(container.querySelector('[data-slot=transcript-actions]')?.hasAttribute('data-hidden')).toBe(false)
    rerender(
      <TranscriptProvider status="streaming">
        <Transcript>
          <TranscriptMessage message={assistant}><TranscriptActions><button type="button">Copy</button></TranscriptActions></TranscriptMessage>
        </Transcript>
      </TranscriptProvider>,
    )
    expect(container.querySelector('[data-slot=transcript-actions]')?.hasAttribute('data-hidden')).toBe(true)
  })

  it('uses a registered tool renderer and groups consecutive tool calls', () => {
    const two = { id: 'a2', role: 'assistant', parts: [{ type: 'tool-call', id: 'x', name: 'a', arguments: '{}', state: 'complete' }, { type: 'tool-call', id: 'y', name: 'b', arguments: '{}', state: 'complete' }] } as never
    const { container } = render(
      <TranscriptProvider status="ready">
        <PartRenderersProvider renderers={{ toolCall: { a: () => <i data-testid="custom">A</i> } }}>
          <Transcript><TranscriptMessage message={two} /></Transcript>
        </PartRenderersProvider>
      </TranscriptProvider>,
    )
    expect(container.querySelector('[data-slot=tool-call-group]')?.getAttribute('data-count')).toBe('2')
    expect(screen.getByTestId('custom')).toBeTruthy()
  })

  it('TranscriptError exposes the code', () => {
    const err = Object.assign(new Error('Stopped'), { code: 'aborted' })
    const { container } = render(<TranscriptProvider status="error"><TranscriptError error={err}>Stopped</TranscriptError></TranscriptProvider>)
    const el = container.querySelector('[data-slot=transcript-error]')!
    expect(el.getAttribute('role')).toBe('alert')
    expect(el.getAttribute('data-code')).toBe('aborted')
  })
})
```

- [ ] **Step 2: 跑测试确认失败** — FAIL

- [ ] **Step 3: 实现**

`TranscriptProvider`：context `{ status, interrupts, addToolApprovalResponse }`（`useMemo`）；`useTranscript` 守卫抛 `cadenza-ai: TranscriptContext is missing. Transcript parts must be placed within <TranscriptProvider>.`。

`Transcript`：`useTranscript()`（只为守卫）；`<MessageScrollerProvider autoScroll={autoScroll ?? true} defaultScrollPosition={defaultScrollPosition ?? 'end'}><MessageScroller className={cn('…', className)} data-slot="transcript"><MessageScrollerViewport {...viewportProps}><MessageScrollerContent>{children}</MessageScrollerContent></MessageScrollerViewport></MessageScroller></MessageScrollerProvider>`——`className` 落根 `MessageScroller`（string）；其余 props（含 `preserveScrollOnPrepend`）透传 Viewport。

`TranscriptMessage`（`memo`）：`const { status } = useTranscript()`；`streaming` = `status === 'streaming' && isLast`?——「本条正在流」的判定：没有 `isLast` 输入时用 `message.metadata?.tanstack?.finishReason === undefined && status === 'streaming'` 不可靠；简化：`TranscriptMessage` 接受可选 `streaming?: boolean`（caller 对最后一条传 `status === 'streaming'`），默认 false；`data-streaming={dataAttr(streaming)}`。结构：`<MessageScrollerItem messageId={message.id} scrollAnchor={role === 'user'} data-slot="transcript-message" data-role={role}><Message align={align ?? (role === 'user' ? 'end' : 'start')}><MessageContent><Bubble variant={role === 'user' ? 'muted' : 'ghost'} align=…><BubbleContent>{parts}</BubbleContent></Bubble>{footer}</MessageContent></Message></MessageScrollerItem>`；children 缺省 = `<TranscriptParts message />`；children 里的 `TranscriptActions` 需要落到 `MessageFooter`——约定 `TranscriptActions` 自己渲染 `<MessageFooter><div role="toolbar" …></MessageFooter>`，caller 把它作为 `TranscriptMessage` 的 children 之一放在 `TranscriptParts` 之后即可（Bubble 只包 parts：`TranscriptMessage` 用 `Children.toArray` 把 `TranscriptActions` 类型的子元素从 Bubble 里抽到 MessageContent 尾部——`findComposedPart` 不可得时用 `child.type === TranscriptActions` 判定）。

`TranscriptParts`：`const { renderers, labels } = usePartRenderers()`；`const { status, interrupts, addToolApprovalResponse } = useTranscript()`；`startedAtRef = useRef(new Map<number, number>())`，首次见到 index 为 thinking 时 `set(i, Date.now())`；遍历 parts：连续 `tool-call` ≥2 → 收进 `ToolCallGroup count`（`ToolCallGroupTrigger`{labels.toolGroup(n)}）；单个 tool-call → `renderers.toolCall?.[part.name] ?? renderers.toolCall?.default ?? defaultToolRenderer`，`defaultToolRenderer` = `<ToolCallCard part result interrupt streaming>{approval}</ToolCallCard>`，其中 `result` = 同消息里 `tool-result` part 且 `toolCallId === part.id`；`interrupt` = `interrupts.find(i => i.kind === 'tool-approval' && i.toolCallId === part.id)`；`approval` = `part.state === 'approval-requested'` 时：有 interrupt → `<ApprovalActions interrupt><ApprovalApprove>{labels.approve}</ApprovalApprove><ApprovalDeny>{labels.deny}</ApprovalDeny></ApprovalActions>`，无 interrupt 而有 `part.approval` → 两个 `Button` 直接调 `addToolApprovalResponse({ id: part.approval.id, approved })`；`tool-result` part 不单独渲染（`renderers.toolResult` 有则用）；thinking → `renderers.thinking ?? <Reasoning content complete={isThinkingComplete(message, i, status)} startedAt>{complete ? labels.thought(seconds) : labels.thinking}</Reasoning>`；text → `renderers.text ?? <Markdown content streaming={status === 'streaming' && isLastPart} />`；image/audio/video/document → `renderers[type] ?? <MediaPart part />`；structured-output → `renderers.structuredOutput ?? <StructuredOutput part />`；ui-resource → `renderers.uiResource?.(…) ?? null`；末尾 `sourcesOf(message)` 非空 → `<Sources sources>{labels.sources(n)}</Sources>`。

`TranscriptActions`：`<MessageFooter><div role="toolbar" data-slot="transcript-actions" data-hidden={dataAttr(status === 'streaming')} className={cn('flex gap-1 data-hidden:invisible', className)}>`。`TranscriptAction` = `Button variant="ghost" size="icon-xs" data-slot="transcript-action"`。`TranscriptEmpty` = `Empty data-slot="transcript-empty"`。`TranscriptPending` = `Marker role="status" data-slot="transcript-pending"` > `MarkerContent className="shimmer"`。`TranscriptError` = `<div role="alert" data-slot="transcript-error" data-code={(error as { code?: string }).code}>`。

`view/index.ts` 逐文件 `export *`；`src/index.ts` 追加 `export * from './view'`。构建后 `grep -c "use client" packages/ai/dist/index.mjs` ≥ 1，`pnpm --filter @gedatou/cadenza-ai run build` 无 error（publint 的 `./providers/*` 警告在 Phase 1a Task 6 后消失）。

- [ ] **Step 4: 跑测试确认通过**；`pnpm vitest run packages/ai`（全部）；typecheck；eslint `packages/ai`。

- [ ] **Step 5: 提交** — `feat(ai): transcript, parts, composer, thread list and byok views`。

---

## Self-review

- **Spec coverage**：§API 面 L2 全部导出（含 `Source`、`DraftAttachment.file?/part?`、`touch` upsert、`createByok` coverage、`useServerCoverage`、`PartLabels`）→ Task A；§视图层 部件契约表 26 行 → B（8）/ C（11）/ D（10）/ E（9）；`ContextUsage` 按 spec 是 P2，不在本计划。
- **Placeholder scan**：Markdown 的 streamdown 插件导出名与 `ByokClient` 是否暴露 coverage 两处标为「实施前 grep」，其余均有代码或逐步说明。
- **Type consistency**：`ThreadIndex.touch` / `threadPersistence` / `ThreadListRename → index.rename` 一致；`ToolRendererProps` 在 A 与 E 一致；`ComposerSubmit` 从 context 读 status 与 `Composer.status` 一致；`TranscriptMessage.streaming?` 是本计划新增的可选 prop（spec 组件树写 `data-streaming`，未定来源——裁定由 caller 传）。
- **与 spec 的两处裁定补充**：`ToolCallGroupTrigger` 作为标题部件（spec 只写「标题文案 children」）；`TranscriptActions` 自带 `MessageFooter` 并由 `TranscriptMessage` 按元素类型提到 Bubble 外。
