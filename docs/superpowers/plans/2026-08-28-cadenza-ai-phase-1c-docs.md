# cadenza-ai Phase 1c — docs 分区（PR-5）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 docs 站新增 `AI 会话` 分区：七页 zh/en、25 个无密钥 demo（24 个 P1 + Playground）、共享的 demo 骨架，把 `@gedatou/cadenza-ai` 的每个 P1 能力各证明一次，并让 Playground 通过 `/api/ai/chat` 用真实 BYOK key 跑通。

**Architecture:** demo 全部走 `./mock` 的 `scripted()`（Playground 例外），共享 `docs/demos/ai/{scripts.ts,tools.ts,chat-shell.tsx}`：`ChatShell` 把 `useChat` 接到 `TranscriptProvider / Transcript / TranscriptMessage / Composer` 上，各 demo 只提供脚本与差异化 props；`ResettableDemo` 搬到 `docs/demos/lib/` 并加 `onReset`，每个 demo 外层包一次。页面按 `writing-component-docs` 的骨架：hero 复用本页首个 demo，`## 使用` 必写，尾部「状态与 className → 键盘交互 → 导出的类型 → Props」，`## Props` 永远最后；纯指南页（scripted / playground）以 `## API` 收尾。

**Tech Stack:** Next 16 + fumadocs（`docs/`，dev 下 `next.config.ts` 把 `@gedatou/cadenza-ai*` alias 到 `packages/ai/src`）、`@gedatou/cadenza-ai`（root / `./mock` / `./server` / `./providers/*`）、`@gedatou/cadenza-ui`、`@tanstack/ai-react` 的 `useChat` / `fetchServerSentEvents` / `indexedDBPersistence` / `useAudioRecorder` / `useByok`、streamdown 样式。

**Spec:** `docs/superpowers/specs/2026-08-28-cadenza-ai-design.md` §docs 分区（页表、H2 串、demo 清单、Reset 约定、route 清单）、§客户端运行时「`useChat` 接线」、§视图层。家法：`.claude/skills/writing-component-docs/SKILL.md`。视图 API 以 `docs/superpowers/plans/2026-08-28-cadenza-ai-phase-1b.md` 的 Interfaces 与 `packages/ai/src/view/*.tsx` 实际导出为准（实施前 `grep -n '^export' packages/ai/src/view/*.tsx`）。

## Global Constraints

- 页面：frontmatter 只有 `title` / `description`；hero `<ComponentPreview name="ai/…" align="stretch" />` 紧跟 frontmatter，前面零 prose；`## 使用` = import 代码块 + 最小 JSX 代码块；每节形态「一句引导 → preview → 展开」；节名只用词典里的唯一名（受控 / 表单 / 状态与 className / 键盘交互 / 导出的类型 / Props）；`## Props` 每个记录的部件一个 H3（一行定位 + 迷你表 `Prop | 类型 | 默认值 | 说明` + 顺序规则行）；zh 与 en 1:1（节数、demo、表行一致）；demo 与代码块里的可见文案是英文。
- demo：`docs/demos/ai/<name>.tsx`，default export，顶部注释写「证明什么」，注册进 `docs/demos/index.tsx`（key `ai/<name>`）；只演示，不在 demo 里补组件该会的行为；每个 demo 外层 `ResettableDemo`；每个持久化 demo 独立 `databaseName` / `key`；同页多个 demo 不共享 `useChat` 实例。
- 代码风格与仓库一致：无分号、单引号、显式返回类型、`'use client'` 只在需要的文件（demo 文件被 registry `lazy` 进客户端，`docs/demos/index.tsx` 已是 client；demo 自身不必写指令，但含 hook 的共享文件写）。
- 验证限定路径：`pnpm exec eslint --fix docs/demos/ai docs/demos/lib docs/content/docs/ai docs/app/globals.css`（`.mdx` 不被 eslint 扫，`.md` 会）、`pnpm --filter docs typecheck`、`pnpm --filter docs run build`；视觉用 agent-browser 在**自己起的** `PORT=3001` dev server 上截图（先探 3000 是否已有服务可复用，用完按 PID 收）；IME / 拖放不在 jsdom 断言，用 Playwright 真浏览器点一遍（memory：`verify-rac-press-with-playwright`）。
- 提交：`docs(ai): conversation, parts, composer, threads, providers, scripted pages and playground`；trailer `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`；不 push。

---

### Task 1: 站点接线 —— `ResettableDemo` 搬迁、CSS、分区元数据

**Files:**
- Create: `docs/demos/lib/resettable.tsx`（从 `docs/demos/message-scroller/resettable.tsx` 搬来并加 `onReset`）
- Delete: `docs/demos/message-scroller/resettable.tsx`
- Modify: 11 个 `docs/demos/message-scroller/*.tsx` 的 `import { ResettableDemo } from './resettable'` → `from '../lib/resettable'`
- Modify: `docs/app/globals.css`（`@import '@gedatou/cadenza-ai/styles.css'`；`@source '../../packages/ai/src'`）
- Create: `docs/content/docs/ai/meta.json`、`meta.en.json`
- Modify: `docs/content/docs/meta.json`（`pages` 加 `"ai"`，放在 `forms` 之后）

**Interfaces（Produces）:**

```ts
export interface ResettableDemoProps { children: ReactNode, className?: string, /** 每次重挂前调用；持久化 demo 用它清自己的库 */ onReset?: () => void | Promise<void> }
export function ResettableDemo(props: ResettableDemoProps): ReactElement
```

- [ ] **Step 1: 搬迁 `ResettableDemo`**

```tsx
// docs/demos/lib/resettable.tsx
import type { ReactElement, ReactNode } from 'react'
import { Button } from '@gedatou/cadenza-ui'
import { IconRefresh } from '@tabler/icons-react'
import { Fragment, useState } from 'react'

// Demo-only scaffolding. Bumping the key remounts just this one demo, so every
// piece of state inside it starts over; `onReset` runs first so a demo that
// persists (IndexedDB, localStorage) can wipe its own store before remounting.
export function ResettableDemo({
  children,
  className = 'max-inline-sm',
  onReset,
}: {
  children: ReactNode
  className?: string
  onReset?: () => void | Promise<void>
}): ReactElement {
  const [generation, setGeneration] = useState(0)

  return (
    <div className={`
      mx-auto flex flex-col gap-2 inline-full
      ${className}
    `}
    >
      <div className="flex justify-end">
        <Button
          aria-label="Reset demo"
          size="icon-sm"
          variant="ghost"
          onClick={async () => {
            await onReset?.()
            setGeneration(count => count + 1)
          }}
        >
          <IconRefresh />
        </Button>
      </div>
      <Fragment key={generation}>{children}</Fragment>
    </div>
  )
}
```

`git mv docs/demos/message-scroller/resettable.tsx docs/demos/lib/resettable.tsx` 后再改内容；11 处 import 用 Edit 逐个改（memory：批量替换必须断言命中——改完 `grep -rn "from './resettable'" docs/demos` 必须为 0，`grep -rln "lib/resettable" docs/demos/message-scroller | wc -l` 必须为 11）。

- [ ] **Step 2: CSS**

`docs/app/globals.css` 第 2 行之后加：

```css
@import '@gedatou/cadenza-ai/styles.css';
```

`@source '../../packages/ui/src';` 之后加：

```css
/* 同理：cadenza-ai 的 styles.css 只 @source ./dist，仓库内读源码 */
@source '../../packages/ai/src';
```

`@gedatou/cadenza-ai/styles.css` 自带 `@import 'streamdown/styles.css'`、katex css 与 `@source './dist'`；streamdown 的运行时类名来自它的 dist，`@source './dist'` 相对于 `packages/ai/styles.css` 指向 `packages/ai/dist`——不覆盖 streamdown 自身。所以再加一行让 Tailwind 扫到 streamdown 的产物：

```css
@source '../node_modules/streamdown/dist/*.js';
```

（路径相对 `docs/app/globals.css`：pnpm 只把 streamdown 链到 `docs/node_modules`，仓库根没有。实测：指向 `../../node_modules` 时 `list-disc` 等类不生成，列表没有圆点。）

```css
```

验证（memory：Tailwind 类要 grep 产物 CSS）：起 dev 后 `curl -s http://localhost:3001/docs/ai/conversation | grep -oE 'href="[^"]*\.css"'` 拿到 css 链接，`curl` 它并 `grep -c 'streamdown'`（>0）与 `grep -c 'katex'`（>0）。

- [ ] **Step 3: 分区元数据**

```json
// docs/content/docs/ai/meta.json
{ "title": "AI 会话", "defaultOpen": true, "pages": ["conversation", "parts", "composer", "threads", "providers", "scripted", "playground"] }
```

```json
// docs/content/docs/ai/meta.en.json
{ "title": "AI Chat", "defaultOpen": true, "pages": ["conversation", "parts", "composer", "threads", "providers", "scripted", "playground"] }
```

`docs/content/docs/meta.json` 的 `pages` 改为 `["index", "themes", "components", "forms", "ai", "utils"]`。

- [ ] **Step 4: 验证** — `pnpm exec eslint --fix docs/demos` 0 error；`pnpm --filter docs typecheck`；起 dev（探 3000，否则 `PORT=3001`）打开 `/docs/components/message-scroller` 确认 11 个 demo 的 Reset 仍工作（agent-browser 截一张）。

---

### Task 2: 共享 demo 骨架 —— `scripts.ts` / `tools.ts` / `chat-shell.tsx`

**Files:**
- Create: `docs/demos/ai/scripts.ts`、`docs/demos/ai/tools.ts`、`docs/demos/ai/chat-shell.tsx`

**Interfaces（Produces，所有 demo 依赖）:**

```ts
// scripts.ts —— 排练策划的语境（与 message-scroller demo 同一世界观），全部英文
export const REPLIES: { plan: string, table: string, math: string, long: string } // Markdown 文本
export function planningReply(): Step[] // reasoning → tool('get_time') → text(REPLIES.plan) → usage
export function rehearsalScript(): Script // respond([...]) 路由：'table' → 表格；'math' → KaTeX；'slow' → 长文逐字；默认 echo
// tools.ts
export const getTime: ClientTool // toolDefinition({ name:'get_time', inputSchema: z.object({ tz: z.string() }) })（client 侧只声明，不执行）
export const move: ClientTool // needsApproval: true，inputSchema { type:'object', additionalProperties:true }（与 mock 的 INPUT_SCHEMA 一致，审批绑定才对得上）
export const getViewport: ClientTool // .client(() => ({ width: innerWidth, height: innerHeight }))
// chat-shell.tsx
export interface ChatShellProps {
  chat: UseChatReturn // 由 demo 调 useChat 后传入（demo 自己决定 options）
  placeholder?: string // 默认 'Ask about the programme…'
  empty?: ReactNode // 空态内容（TranscriptEmpty 的 children）
  renderActions?: (message: UIMessage) => ReactNode // 每条 assistant 行的 TranscriptActions 内容
  toolbar?: ReactNode // ComposerToolbar 里 Submit 之前的额外控件
  attachments?: ReactNode // Composer 顶部（附件条）
  editing?: { id: string, text: string } | null // 编辑重发态（Composer editing + 预填）
  onEditCancel?: () => void
  onCommit?: (text: string) => void | Promise<void> // 默认 chat.sendMessage(text)
  className?: string // 外框，默认 'block-120'
}
export function ChatShell(props: ChatShellProps): ReactElement
```

- [ ] **Step 1: `scripts.ts`**

```ts
import type { Script, Step } from '@gedatou/cadenza-ai/mock'
import { echo, reasoning, respond, text, tool, usage } from '@gedatou/cadenza-ai/mock'

export const REPLIES = {
  plan: `Ravel's **Pavane** opens; La Mer follows; interval after La Mer.\n\n- Pavane — 6 min\n- La Mer — 24 min\n- Interval — 20 min\n- Firebird — 21 min\n\nCurtain down before ten if the downbeat is on time.`,
  table: `| Work | Minutes | Section |\n| --- | ---: | --- |\n| Pavane | 6 | strings, winds |\n| La Mer | 24 | full |\n| Firebird | 21 | full + harps |`,
  math: `Total music: $6 + 24 + 21 = 51$ minutes, so with a $20$-minute interval the evening runs\n\n$$T = 51 + 20 = 71\\ \\text{minutes}$$`,
  long: Array.from({ length: 12 }, (_, i) => `Paragraph ${i + 1}: the section leaders should hear the running order before the dress rehearsal, so nobody discovers a change on the night.`).join('\n\n'),
}

/** The hero flow: think → tool → markdown → usage. */
export function planningReply(): Step[] {
  return [
    reasoning('The hall prefers the loudest work last, and the harps should move once.'),
    tool('get_time', { tz: 'Europe/Paris' }, { output: { iso: '2026-10-14T19:30:00+02:00' } }),
    text(REPLIES.plan),
    usage({ inputTokens: 412, outputTokens: 96 }),
  ]
}

/** What most demos answer with: a small router over the last user message. */
export function rehearsalScript(): Script {
  return respond([
    [/table/i, [text(REPLIES.table)]],
    [/math|minutes/i, [text(REPLIES.math)]],
    [/slow|long/i, [text(REPLIES.long, { chunk: 'char', pace: 8 })]],
    [/plan|programme|program/i, planningReply()],
  ], echo())
}
```

- [ ] **Step 2: `tools.ts`**

```ts
import { toolDefinition } from '@gedatou/cadenza-ai'
import { z } from 'zod'

export const getTime = toolDefinition({ name: 'get_time', description: 'Current time in a timezone', inputSchema: z.object({ tz: z.string() }) })

// Same permissive schema the scripted transport hashes, so the client binds the approval interrupt.
export const move = toolDefinition({ name: 'move', description: 'Move a work in the running order', inputSchema: { type: 'object', additionalProperties: true }, needsApproval: true })

export const getViewport = toolDefinition({ name: 'get_viewport', description: 'Size of the reader’s window', inputSchema: z.object({}) })
  .client(() => ({ width: window.innerWidth, height: window.innerHeight }))
```

`toolDefinition(...).client(fn)` 是否存在与 `needsApproval` 的位置以 `packages/ai/node_modules/@tanstack/ai/dist/esm/activities/chat/tools/tool-definition.d.ts` 为准（`server<TContext>` 已确认在 133 行；`client` 同文件查）。

- [ ] **Step 3: `chat-shell.tsx`**

```tsx
'use client'
import type { UseChatReturn } from '@gedatou/cadenza-ai'
import type { UIMessage } from '@tanstack/ai-client'
import type { ReactElement, ReactNode } from 'react'
import {
  Composer,
  ComposerSubmit,
  ComposerTextarea,
  ComposerToolbar,
  Transcript,
  TranscriptActions,
  TranscriptEmpty,
  TranscriptError,
  TranscriptMessage,
  TranscriptParts,
  TranscriptPending,
  TranscriptProvider,
} from '@gedatou/cadenza-ai'
import { Kbd } from '@gedatou/cadenza-ui'

export interface ChatShellProps {
  chat: UseChatReturn
  placeholder?: string
  empty?: ReactNode
  renderActions?: (message: UIMessage) => ReactNode
  toolbar?: ReactNode
  attachments?: ReactNode
  editing?: { id: string, text: string } | null
  onEditCancel?: () => void
  onCommit?: (text: string) => void | Promise<void>
  className?: string
}

// The one composition every demo shares: transcript above, composer below.
// Demos differ only in the script they feed useChat and the slots they fill.
export function ChatShell({ chat, placeholder = 'Ask about the programme…', empty, renderActions, toolbar, attachments, editing = null, onEditCancel, onCommit, className = 'block-120' }: ChatShellProps): ReactElement {
  const last = chat.messages.at(-1)
  return (
    <TranscriptProvider status={chat.status} interrupts={chat.interrupts} addToolApprovalResponse={chat.addToolApprovalResponse}>
      <div className={`
        flex flex-col rounded-xl border
        ${className}
      `}
      >
        <Transcript>
          {chat.messages.length === 0 && empty !== undefined && <TranscriptEmpty>{empty}</TranscriptEmpty>}
          {chat.messages.map(message => (
            <TranscriptMessage key={message.id} message={message} streaming={chat.status === 'streaming' && message === last}>
              <TranscriptParts message={message} />
              {message.role === 'assistant' && renderActions && <TranscriptActions>{renderActions(message)}</TranscriptActions>}
            </TranscriptMessage>
          ))}
          {chat.status === 'submitted' && <TranscriptPending>Thinking…</TranscriptPending>}
          {chat.error && <TranscriptError error={chat.error}>{chat.error.message}</TranscriptError>}
        </Transcript>
        <Composer
          status={chat.status}
          editing={editing !== null}
          defaultValue={editing?.text}
          key={editing?.id ?? 'new'}
          onValueCommitted={text => void (onCommit ? onCommit(text) : chat.sendMessage(text))}
          onStop={() => chat.stop()}
          onEditCancel={onEditCancel}
          className="border-bs"
        >
          {attachments}
          <ComposerTextarea placeholder={placeholder} />
          <ComposerToolbar>
            {toolbar}
            <span className="ms-auto text-xs text-muted-foreground">
              <Kbd>↵</Kbd>
              {' '}
              send
            </span>
            <ComposerSubmit aria-label="Send" />
          </ComposerToolbar>
        </Composer>
      </div>
    </TranscriptProvider>
  )
}
```

`UseChatReturn` 是否从 `@gedatou/cadenza-ai` 转出（root `export * from '@tanstack/ai-react'`，其 `index.d.ts` 导出 `UseChatReturn` 类型——实施前 grep）；`chat.interrupts` 的类型是 `BoundInterrupts`（`ReadonlyArray<ChatInterrupt>`），与 `TranscriptProvider.interrupts` 兼容；`Composer` 的 `defaultValue` + `key` 组合实现「编辑时预填」——不用受控 value，避免 demo 里维护输入态。

- [ ] **Step 4: 验证** — `pnpm --filter docs typecheck`（三个文件被 `docs/tsconfig.json` 的 include 覆盖：`grep include docs/tsconfig.json`）；eslint 0 error。

---

### Task 3: 会话页 demo（7）—— `basic` / `streaming` / `markdown` / `states` / `actions` / `usage` / `persistence`

**Files:**
- Create: `docs/demos/ai/basic.tsx`、`streaming.tsx`、`markdown.tsx`、`states.tsx`、`actions.tsx`、`usage.tsx`、`persistence.tsx`
- Modify: `docs/demos/index.tsx`（7 行注册）

每个 demo 的骨架相同（以 `basic` 为准，其余只列差异）：

```tsx
// docs/demos/ai/basic.tsx
import type { ReactElement } from 'react'
import { useChat } from '@gedatou/cadenza-ai'
import { scripted } from '@gedatou/cadenza-ai/mock'
import { useState } from 'react'
import { ResettableDemo } from '../lib/resettable'
import { ChatShell } from './chat-shell'
import { rehearsalScript } from './scripts'
import { getTime } from './tools'

// Proves the whole loop without a key: a scripted reply that thinks, calls a
// tool, streams Markdown and reports usage — and the transcript follows it.
function Body(): ReactElement {
  const [fetcher] = useState(() => scripted(rehearsalScript()))
  const chat = useChat({ fetcher, tools: [getTime] })
  return <ChatShell chat={chat} empty="Try: “Plan the programme.”" />
}

export default function BasicDemo(): ReactElement {
  return (
    <ResettableDemo className="max-inline-2xl">
      <Body />
    </ResettableDemo>
  )
}
```

差异：

| demo | 脚本 / options | 证明点（写进顶部注释） |
|---|---|---|
| `streaming` | `scripted(() => [text(REPLIES.long, { chunk: 'word', pace: 40 })])` | 逐词流；`ComposerSubmit` 在流式中是停止；停止后 `chat.status` 回 `ready`（shell 上方一行 `<p aria-live="polite">status: {chat.status}</p>`） |
| `markdown` | `scripted(respond([[/table/i,[text(REPLIES.table)]],[/math/i,[text(REPLIES.math)]],[/code/i,[text('```ts\nconst plan = ["Pavane", "La Mer"]\n```')]]], [text(REPLIES.plan)]))` + `empty` 给三个 `SuggestionsItem`（`Show a table` / `Do the math` / `Show code`） | GFM 表格 + 复制、KaTeX、代码块高亮 + 复制、流式不完整修复（`pace: 20` 的 char 流）、明暗主题（截两张） |
| `states` | `scripted(sequence([[error('Rate limited', '429')], planningReply()]))` + `empty` = `EmptyHeader/EmptyTitle` + `Suggestions` | 空态 + 建议；`submitted` 时 `TranscriptPending`；第一轮 `TranscriptError`（`data-code="429"`）+ `renderActions` 外再放一个 `Retry` 按钮调 `chat.reload()` → 第二轮成功；`aborted`：长文流中点停止 → 无错误 |
| `actions` | `scripted(rehearsalScript())`；`renderActions` = Copy（`navigator.clipboard.writeText(messageText(m))`）/ Regenerate（`chat.reload()`）/ Edit（对上一条 user 行：`setEditing({ id, text: messageText(user) })`，`onCommit` = `editAndResend(chat, id, text)`）/ Clear（`chat.clear()`） | 复制 / 重生成 / 编辑重发截断（Escape 取消）/ 清空；流式中动作栏 `data-hidden` |
| `usage` | `useUsageTracker()` 接 `onChunk/onFinish`；脚本每轮 `usage({...})`；`renderActions` 显示 `byMessage.get(m.id)` 的 tokens 与 `estimateCost(defaultCatalog.getModel('openai/gpt-5.2')!, u)`；shell 上方 `total` | 每条消息 token / 费用；多轮累加 |
| `persistence` | `useChat({ fetcher, persistence: indexedDBPersistence({ databaseName: 'cadenza-ai-docs-persistence' }), threadId: 'docs-persistence' })`；`ResettableDemo onReset={() => indexedDB.deleteDatabase('cadenza-ai-docs-persistence')}`（`deleteDatabase` 返回请求，包成 Promise 等 `onsuccess`） | 刷新页面对话还在；Reset 同时清库 |

`indexedDBPersistence` 的 options 名（`databaseName`？）以 `packages/ai/node_modules/@tanstack/ai-client/dist/esm/persistence*.d.ts` 为准。

- [ ] **Step 1: 写七个 demo + 注册** — registry 行形如 `'ai/basic': lazy(async () => import('./ai/basic')),`，按 spec 表顺序插在文件末尾一组。
- [ ] **Step 2: 验证** — typecheck、eslint；dev server 上逐个打开 `/docs/ai/conversation`（页面先用临时 mdx 只放 7 个 preview 也行，Task 7 再写正文），agent-browser 各截一张；`actions` 的编辑重发用 Playwright 点一遍（输入 → Escape → 取消）。

---

### Task 4: 部件页 demo（7）—— `reasoning` / `tool-call` / `tool-renderers` / `approval` / `client-tool` / `attachments-in-message` / `custom-events`

**Files:**
- Create: 七个 `docs/demos/ai/*.tsx`
- Modify: `docs/demos/index.tsx`

| demo | 脚本 / options | 证明点 |
|---|---|---|
| `reasoning` | `scripted(() => [reasoning('Loudest work last; harps move once; interval after La Mer.', { chunk: 'word', pace: 60 }), text('Interval after La Mer.')])` | 流式展开 + shimmer；完成自动折叠并显示耗时；手动展开后不再自动折叠（第二轮验证） |
| `tool-call` | `scripted(sequence([[tool('get_time', { tz: 'Europe/Paris' }, { argsChunk: 6, output: { iso: '…' } })], [tool('get_time', { tz: 'Mars/Olympus' }, { error: 'Unknown timezone' })]]))` + 页顶 `Send` 两次按钮 | 7 态逐一（argsChunk 分片 → pending 转圈 → complete ✓；第二轮 error ✗ + `tool-call-error`） |
| `tool-renderers` | `PartRenderersProvider renderers={definePartRenderers({ toolCall: { get_time: TimeCard } })} labels={{ toolGroup: n => \`${n} tool calls\` }}`；`TimeCard` 用 `Item` 画一张卡（`part.arguments` 不完整时 `parsePartialJSON` 兜底）；脚本两个工具：`get_time`（命中自定义）与 `lookup_hall`（回退 default 卡片） | 按名自定义 vs default 回退；不完整参数；`labels` 覆盖 |
| `approval` | `scripted(sequence([[tool('move', { work: 'Firebird', to: 'before interval' }, { approval: true })], ctx => { const d = approvalOf(ctx, 'call-1'); return d?.approved ? [tool.result('call-1', { moved: true, args: d.editedArgs ?? null }), text('Moved.')] : [text('Left where it was.')] }]), { toolCallId: () => 'call-1' })`；`useChat({ fetcher, tools: [move] })`；`renderers.toolCall.move` 自定义：`ApprovalActions` 里除 Approve/Deny 外加一个 `Input` 编辑 `to` 后 `ApprovalApprove editedArgs={{ ...args, to }}` | Approve / Deny / 编辑参数后 Approve；已响应后按钮禁用 |
| `client-tool` | `useChat({ fetcher, tools: [getViewport] })`；脚本 `sequence([[tool('get_viewport', {}, { client: true })], ctx => [text(\`Your window is ${JSON.stringify(clientResultOf(ctx, 'call-1'))}.\`)]])`；第二个按钮演示手动路径：`chat.addToolResult({ toolCallId, tool: 'get_viewport', output: {...} })` | 浏览器执行并自动回传；`addToolResult` 手动路径 |
| `attachments-in-message` | `useChat({ fetcher: scripted(echo()) , initialMessages: [userWithParts] })`，`userWithParts.parts` = text + image（1×1 PNG data）+ document（pdf 占位 data）+ audio（短 webm data） | user 消息里 image / document / audio part 的渲染（`MediaPart`） |
| `custom-events` | 脚本 `[custom('progress', { done: 1, total: 3 }), sleep(300), custom('progress', { done: 2, total: 3 }), sleep(300), custom('progress', { done: 3, total: 3 }), text('Parts checked.')]`；`useChat({ fetcher, onCustomEvent: (name, data) => name === 'progress' && setProgress(data) })`；shell 上方 `<progress value max>` | `onCustomEvent` 驱动进度条 |

- [ ] **Step 1: 写七个 demo + 注册**
- [ ] **Step 2: 验证** — 同 Task 3；`approval` 用 Playwright 走 Approve 与 Deny 两条路径各一次并断言文案。

---

### Task 5: 输入区页 demo（6）—— `composer` / `attachments` / `model-picker` / `thinking-levels` / `suggestions` / `dictate`

**Files:**
- Create: 六个 `docs/demos/ai/*.tsx`
- Modify: `docs/demos/index.tsx`

| demo | 组成 | 证明点 |
|---|---|---|
| `composer` | `ChatShell` + `toolbar` 里放 `<Kbd>Shift</Kbd>+<Kbd>↵</Kbd> newline` 提示；脚本 `echo()` | 自增高、Enter / Shift+Enter、IME（Playwright 里用 `page.keyboard.insertText` + composition 事件）、发送 / 停止、Kbd |
| `attachments` | `const draft = useAttachmentDraft()`；`attachments={<ComposerAttachments items={draft.items} onRemove={id => draft.remove(id)} />}`；`toolbar` 里 `<ComposerAttach accept={draft.accept} multiple onFiles={files => draft.add(files)} />`；`Composer onFiles={files => draft.add(files)}`；`onCommit` = `async text => { const parts = await draft.toParts(); await chat.sendMessage(parts.length ? [{ type: 'text', content: text }, ...parts] : text); draft.clear() }`；脚本 `echo()`（复述 MIME） | 按钮 / 拖放 / 粘贴 / 超限报错（`maxBytes: 64 * 1024` 让超限容易触发）/ 预览条 / 移除 / 成为 part |
| `model-picker` | `const sel = useModelSelection({ key: 'docs-model-picker' })`；`useChat({ fetcher, forwardedProps: sel.forwardedProps })`；`toolbar` = `<ModelPicker catalog={defaultCatalog} value={modelRef(sel.selection)} onValueChange={ref => sel.setModel(ref)} />` + `<ThinkingLevelPicker model={sel.model} value={sel.selection.thinking} onValueChange={sel.setThinking} />`；脚本 `echo()`（复述 `data.model`） | 切模型 → 回复复述；切到无推理模型时 `ThinkingLevelPicker` 消失；切模型后立刻发送不丢（`forwardedProps` 经 `updateOptions` 同步） |
| `thinking-levels` | 不用 shell：一个 `Select` 选模型（`defaultCatalog.models`），下面七个 `ToggleGroup` 项按 `supportedThinkingLevels(model)` 启用，选中值经 `clampThinkingLevel` 收敛并显示 | 7 级 → 可用级别变化 → clamp 收敛 |
| `suggestions` | `empty` = `<Suggestions onValueChange={v => void chat.sendMessage(v)}><SuggestionsItem value="Plan the programme">…</SuggestionsItem>…</Suggestions>` | 点 chip 即发送 |
| `dictate` | `toolbar` 里 `<ComposerDictate onRecording={part => draft.add([part])} />` + `attachments` 条；脚本 `echo()` | 录音 → AudioPart 进附件条 → 发送（真机验证，jsdom 无 MediaRecorder；页面写「需要麦克风权限」） |

`Composer` 的 `value`/`defaultValue` 与 `key` 用法同 Task 2；`ModelPicker.value` 是 `provider/model` ref（`modelRef`）。

- [ ] **Step 1: 写六个 demo + 注册**
- [ ] **Step 2: 验证** — typecheck、eslint、截图；`composer` 的 IME 与 `attachments` 的拖放用 Playwright。

---

### Task 6: 其余 P1 demo（6）—— `threads` / `catalog` / `byok-dialog` / `scripted-basic` / `scripted-routing` / `playground`

**Files:**
- Create: 六个 `docs/demos/ai/*.tsx`
- Modify: `docs/demos/index.tsx`

| demo | 组成 | 证明点 |
|---|---|---|
| `threads` | `const index = useMemo(() => createThreadIndex({ key: 'docs-threads', storage: 'local' }), [])`；`const threads = useThreadIndex(index)`；`const [threadId, setThreadId] = useStoredState('docs-threads:current', '')`；左栏 `ThreadList index value={threadId} onValueChange={setThreadId}` + `SearchField` 过滤 + `groupThreadsByDay` 分组 + 每行 `ThreadListRename` / `ThreadListArchive` / `ThreadListDelete`（Delete 外包 `AlertDialog` 确认）；右栏 `key={threadId}` 重挂的 `Body`：`useChat({ fetcher, persistence: threadPersistence(index, indexedDBPersistence({ databaseName: 'cadenza-ai-docs-threads' })), threadId })`；`onReset` 清 localStorage 两个 key + 删库；`md:` 断点下左栏变 `Dialog` | 新建 / 切换 / 重命名 / 归档 / 删除确认 / 搜索 / 按天分组 / 自动标题 |
| `catalog` | 表格：`defaultCatalog.withProvider(local).providers` × `models` × `input` 图标 × `supportedThinkingLevels` 徽标；`local` = `{ id: 'local', label: 'Local (custom)', byok: null, keyRequired: false, runtime: 'local', models: [{ id: 'llama3.3', name: 'Llama 3.3', provider: 'local', input: ['text'], reasoning: false }] }`；`parseModelRef` 演示一行 | 目录表 + `withProvider` |
| `byok-dialog` | `const byok = useMemo(() => createByok({ catalog: defaultCatalog }), [])`；`useByok(byok)` 显示四种 `KeyStatus`；`useChat({ fetcher: scripted(() => byokMissing('openai')), byok, byokProvider: () => 'openai' })`；`<ByokKeyDialog byok catalog coverage={{ vertex: true, ollama: true }} />`；一个 `Button` 触发 `byok.request('anthropic', 'missing')` | 四种 KeyStatus；脚本 401 → 对话框弹出；coverage 标 |
| `scripted-basic` | 脚本把所有步骤构造器各来一次：`text` / `reasoning` / `tool` / `tool.result` / `custom` / `structured` / `usage` / `sleep` / `finish`（`error` 单独第二轮） | DSL 全览 |
| `scripted-routing` | `respond([[/^\/plan/, planningReply()], [ctx => ctx.turn === 0, [text('First turn.')]]], echo())` + `sequence` 与 `approvalOf` 的用法在 `<ComponentSource>` 里展示 | `respond` + `sequence` + `echo` + `approvalOf` |
| `playground` | 真实：`createByok({ catalog: defaultCatalog })` + `useServerCoverage(byok)`；`useModelSelection()`；`ThreadList`（同 `threads`，`key: 'docs-playground'`）+ `ChatShell` + `ModelPicker` / `ThinkingLevelPicker` / `ByokKeyDialog`；`useChat({ connection: fetchServerSentEvents('/api/ai/chat'), forwardedProps: sel.forwardedProps, byok, byokProvider: () => sel.selection.provider, tools: [getViewport], persistence: threadPersistence(...), threadId })`；`ResettableDemo className="max-inline-none"`；页面 `previewClassName="min-block-160"` | 全家 + 真实 SSE（无 key 时点发送 → 对话框） |

`fetchServerSentEvents(url)` 返回的是 `ChatTransport` 的 `connection`（以 `ai-client/dist/esm/connection-adapters.d.ts` 为准；若它返回 fetcher，改用 `fetcher:`）。`useServerCoverage` 的 `url` 默认 `/api/ai/catalog`；docs 的 i18n proxy 已放行 `/api/*`。

- [ ] **Step 1: 写六个 demo + 注册**
- [ ] **Step 2: 验证** — typecheck、eslint、截图；Playground 在无 key 时发送 → 弹 `ByokKeyDialog`（Playwright）；若本机 env 有 provider key，填进对话框跑一条真回复（不写进任何文件）。

---

### Task 7: 七页 zh/en + README

**Files:**
- Create: `docs/content/docs/ai/{conversation,parts,composer,threads,providers,scripted,playground}.mdx` 与 `.en.mdx`
- Modify: `packages/ai/README.md`（链到 docs 七页）、根 `README.md`（packages/ai 一行已有；补 docs 链接）

各页 H2 串以 spec §docs 分区为准，逐页要点：

- `conversation`：镜像 `docs/content/docs/forms/tanstack-form.mdx` 的开篇口吻（装门面不装底层；API 原样、惯例做默认）；`## 使用` 三段代码：`pnpm add @gedatou/cadenza-ai`、import（`useChat` + Transcript/Composer 家族 + `scripted`）、最小 JSX（`ChatShell` 的精简版）+ 一段 css（`@import '@gedatou/cadenza-ai/styles.css'` 与 `@source`）；`## 思路` 四句归属；`## 解剖` = hero 的完整组件树 ```text + 九部件职责 bullets；`## 会话` 四个 H3（连接 / 渲染消息 / 输入 / 完成 `<ComponentSource name="ai/basic" />`）；`## 流式` … `## 本地持久化` 各一句引导 + preview + 展开；`## 状态与 className` 两张表（`data-role` / `data-streaming` / `data-hidden` / `data-code` / `data-count`；`data-slot` 全表：transcript / transcript-message / transcript-parts / transcript-actions / transcript-action / transcript-empty / transcript-pending / transcript-error / markdown / reasoning / tool-call-card / tool-call-group / approval-actions / sources / structured-output / composer / …）；`## 键盘交互` 表（Enter / Shift+Enter / Escape 流式停止 / Escape 编辑取消 / 视口的滚动键继承 MessageScroller）；`## 导出的类型` root 新增导出全表（目录 / 运行时 / hooks / 视图 Props）；`## Props` 九个 H3。
- `parts`：每个部件节 = 一句引导 + preview + 契约；`## 默认文案` 放 `PartLabels` 全表（键 / 默认英文 / 何时出现）；`## Props` 十个 H3（Markdown / Reasoning / ToolCallCard / ToolCallGroup + Trigger / ApprovalActions / ApprovalApprove / ApprovalDeny / MediaPart / Sources / StructuredOutput）。
- `composer`：`## 附件` 节写明 3 MB 默认上限的来由（Vercel 4.5 MB 请求体）与 `maxBytes`；`## 键盘交互` 表；`## Props`：Composer / ComposerTextarea / ComposerToolbar / ComposerSubmit / ComposerAttach / ComposerAttachments / ComposerDictate / Suggestions / SuggestionsItem / QueueList（P2 demo 未到也先记 Props）/ ModelPicker / ThinkingLevelPicker。
- `threads`：`## 思路`（索引与正文分离的原因：`ChatClientPersistence` 无枚举）；`## 服务端持久化` 配方节只有代码块（`createChatHandler({ persistence })` + `reconstructChat`）；`## Props`：ThreadList / ThreadListGroup / ThreadListGroupLabel / ThreadListItem / ThreadListRename / ThreadListArchive / ThreadListDelete / ThreadListNew。
- `providers`：`## 模型目录`（`ai/catalog`）；`## 思考强度`（七级表 + 附录 A 精简版：每家「off 发什么 / 不可关的模型」）；`## 密钥`（`ai/byok-dialog`；BYOK 头 `x-byok-<id>`；`persistent` 与 passkey 说明）；`## Route handler` 配方（`docs/app/api/ai/chat/route.ts` 原文）；`## 环境变量` 配方（各 provider env 名表，来自 catalog `byok.env`）；`## 自定义 provider` 配方（`definePreset` + `withProvider`）；`## MCP` 配方（TanStack 的 `mcpTools` 一段，标 Phase 3）；`## 不接入的 harness` 一句（realtime / image / live 只在 API 表）；`## 导出的类型` `server` / `providers` 子入口全表；`## Props`：ByokKeyDialog / ByokKeyDialogProvider。
- `scripted`：`## 使用` → `## 思路`（fetcher 形态、事件级 DSL、与真实 route 的关系）→ `## 步骤`（每个构造器一行 + `ai/scripted-basic`）→ `## 多轮`（`sequence` / `respond` / `approvalOf` / `clientResultOf` + `ai/scripted-routing`）→ `## 测试`（vitest 里 `new ChatClient({ fetcher })` 的片段，来自 `packages/ai/test/scripted.test.ts`）→ `## API`（`scripted` / `sequence` / `respond` / `echo` / `byokMissing` / 步骤构造器 / `ScriptContext` 字段表）。
- `playground`：hero `previewClassName="min-block-160"`；`## 使用`（填 key → 选模型 → 发送；key 只在浏览器内存，每次请求以头发送）→ `## 思路`（纯 BYOK 的原因、`useServerCoverage`、`maxDuration`）→ `## 限制`（四家 provider；3 MB 附件；Hobby 60 s / Pro 300 s；无服务端 key 即无费用）→ `## API`（route 两条 + `createByok` / `useServerCoverage` / `fetchServerSentEvents`）。
- en 版逐节翻译，demo 名与表行 1:1；`docs/content/docs/ai/meta.en.json` 已在 Task 1。

- [ ] **Step 1: 写七页 zh**
- [ ] **Step 2: 写七页 en**
- [ ] **Step 3: README** — `packages/ai/README.md` 加「文档」小节链 `/docs/ai/conversation`；根 README 的 packages 表 `packages/ai` 一行补 docs 链接。
- [ ] **Step 4: 验证** — `pnpm --filter docs run build` 通过（mdx 语法错误在这里暴露）；dev 上逐页打开 zh 与 en，agent-browser 截图存 scratchpad；检查每页 `## Props` 是最后一个 H2（`for f in docs/content/docs/ai/*.mdx; do tail -n 40 "$f" | grep -c '^## '; done` 辅助）；`grep -c '<ComponentPreview' docs/content/docs/ai/*.mdx` zh 与 en 逐对相等。
- [ ] **Step 5: 提交** — `docs(ai): conversation, parts, composer, threads, providers, scripted pages and playground`。

---

## Self-review

- **Spec coverage**：spec 页表 7 页 ✓（Task 7）；demo 清单 P1 的 24 个 + `ai/playground` ✓（Task 3–6：7+7+6+6 = 26，多出的一个是 `scripted-basic` 与 `scripted-routing` 在 spec 里合为一行）；P2 demo（tool-group / sources / structured-output / queue / draft / export）留给 PR-7/8；Reset 约定 ✓（Task 1）；route 清单 1/2 已在 PR-2；`ai/transcription` 是 Phase 3。
- **Placeholder scan**：各 demo 以表格给出脚本与组成，代码由 `basic.tsx` 样板 + 表中差异推出；`indexedDBPersistence` options 名、`toolDefinition().client`、`fetchServerSentEvents` 返回形态三处标注「以 d.ts 为准」，实施第一步 grep。
- **Type consistency**：`ChatShell.chat: UseChatReturn`，各 demo 都传 `useChat` 的返回；`onCommit(text)` 与 `Composer.onValueCommitted(value, details)` 之间由 shell 适配；`ThreadList.onValueChange(id, details)` 与 `useStoredState` 的 `set(next)` 之间在 demo 里 `id => setThreadId(id)`。
