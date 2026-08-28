# cadenza-ai Phase 0 — 提升 tooltip / badge / kbd / empty / item 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 cadenza-ai 视图层要用的五个 vendored shadcn primitive（tooltip / badge / kbd / empty / item）提升为 `@gedatou/cadenza-ui` 的公开组件，各带 seam、测试、demo 与 zh/en 文档页。

**Architecture:** 三层规则——`packages/ui/src/primitives/*` 一个字节不改（哈希钉死），每个提升 = `packages/ui/src/components/<name>.tsx` seam（转出 / cast 二选一，按 `base-ui-conventions` §8 判形态）+ `src/index.ts` 一行 + `packages/ui/test/<name>.test.tsx` + `docs/demos/<name>/*.tsx` + `docs/content/docs/components/<name>{,.en}.mdx`。五个组件互不依赖，可并行；共享文件（barrel、demo registry、theme-preview-grid）由汇总任务统一改。

**Tech Stack:** React 19、`@base-ui/react` 1.7、cva、vitest + @testing-library（jsdom）、fumadocs MDX、Tailwind v4（eslint `better-tailwindcss` 逻辑属性规则）。

**Spec:** `docs/superpowers/specs/2026-08-28-cadenza-ai-design.md` §视图层「前置提升（Phase 0）」；家法 `.claude/skills/base-ui-conventions/SKILL.md`、`.claude/skills/writing-component-docs/SKILL.md`、`.claude/skills/mirroring-precedents/SKILL.md`。

## Global Constraints

- `packages/ui/src/primitives/**` 与 `src/hooks/**` **不许改一个字节**（`packages/ui/test/vendored-sources.test.ts` 哈希快照）。
- seam 只做：改名到 Base UI 词表、类型说实话（cast）、补 JSDoc；不加样式、不改行为。
- 命名 `<Family><Part>`；弹层内容叫 `Popup`（先例 `DialogPopup`/`DropdownMenuPopup`）。
- 每个公开部件导出 `XxxProps`；有 Base UI state 的导出 `XxxState`；变体维度导出 `XxxVariant`/`XxxSize` 类型别名（先例 `BubbleVariant`、`MarkerVariant`）。
- `className` 落在 Base UI 槽位 → 保留函数形态类型；落在纯 DOM / cva 路由 → 诚实标 `string` 并在 JSDoc 说明是哪条路由。
- docs 页：先读母版（已下载到 scratchpad `masters/<name>.mdx`），骨架照母版，删 Installation / RTL，加「什么时候用（有对比对象才写）→ 状态与 className → 键盘交互（有键盘行为才写）→ 导出的类型（大家族才写）→ Props」；`## Props` 是最后一个 H2；≥2 个部件的页每部件一个 H3；zh 与 en 1:1；demo 英文文案、顶部注释写「证明什么」；hero 复用 `<name>/basic`。
- demo 文件：`docs/demos/<name>/<demo>.tsx`，default export，函数返回类型 `ReactElement`；类名用逻辑属性（`ps-* / inline-* / block-*`），不用任意 px（eslint `enforce-canonical-classes`）。
- 验证命令限定路径：`pnpm vitest run packages/ui/test/<name>.test.tsx`、`pnpm eslint packages/ui/src/components/<name>.tsx packages/ui/test/<name>.test.tsx docs/demos/<name>`、`pnpm --filter @gedatou/cadenza-ui typecheck`；全仓 `pnpm lint` 会被 `.gitnexus` 缓存绊倒，别跑。
- 不起 dev server、不 kill 任何进程；视觉验证由汇总任务做。
- 提交：AG 规范，`feat(ui): promote tooltip, badge, kbd, empty and item`；trailer `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`。

---

### Task 1: Tooltip

**Files:**
- Create: `packages/ui/src/components/tooltip.tsx`
- Create: `packages/ui/test/tooltip.test.tsx`
- Create: `docs/demos/tooltip/{basic,sides,keyboard,disabled}.tsx`
- Create: `docs/content/docs/components/tooltip.mdx`、`tooltip.en.mdx`
- Read: `packages/ui/src/primitives/tooltip.tsx`（vendored）、`packages/ui/src/components/dropdown-menu.tsx:100-125`（cast 先例）、`packages/ui/src/components/dialog.tsx:1-60`（Popup 改名理由）、scratchpad `masters/tooltip.mdx`

**Interfaces:**
- Produces: `Tooltip`, `TooltipTrigger`, `TooltipPopup`, `TooltipProvider`；类型 `TooltipProps`, `TooltipChangeEventDetails`, `TooltipTriggerProps`, `TooltipTriggerState`, `TooltipPopupProps`, `TooltipPopupState`, `TooltipProviderProps`

- [ ] **Step 1: 写失败测试**

```tsx
// packages/ui/test/tooltip.test.tsx
import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { Tooltip, TooltipPopup, TooltipProvider, TooltipTrigger } from '../src/components/tooltip'

it('renders the popup as a tooltip role when open, under the vendored content slot', () => {
  render(
    <TooltipProvider>
      <Tooltip open>
        <TooltipTrigger>Hover</TooltipTrigger>
        <TooltipPopup>Add to library</TooltipPopup>
      </Tooltip>
    </TooltipProvider>,
  )
  const popup = screen.getByRole('tooltip')
  expect(popup.textContent).toContain('Add to library')
  // The seam renames the part to Popup; the slot stays what shadcn wrote,
  // because Kbd's vendored styles key on `in-data-[slot=tooltip-content]`.
  expect(popup.getAttribute('data-slot')).toBe('tooltip-content')
  expect(screen.getByText('Hover').getAttribute('data-slot')).toBe('tooltip-trigger')
})

it('resolves a function className against the popup state', () => {
  render(
    <Tooltip open>
      <TooltipTrigger>Hover</TooltipTrigger>
      <TooltipPopup className={state => (state.open ? 'is-open' : 'is-closed')}>tip</TooltipPopup>
    </Tooltip>,
  )
  expect(screen.getByRole('tooltip').className).toContain('is-open')
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm vitest run packages/ui/test/tooltip.test.tsx`
Expected: FAIL — `Cannot find module '../src/components/tooltip'`

- [ ] **Step 3: 写 seam**

```tsx
// packages/ui/src/components/tooltip.tsx
'use client'

import type { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip'
import type { ComponentProps, ReactElement } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '#primitives/tooltip'

/**
 * The published Tooltip family — Base UI's tooltip in shadcn's base-nova skin.
 *
 * The seam renames one part: shadcn ships `TooltipContent`, which is really
 * Base UI's `Portal → Positioner → Popup` (plus the arrow) folded into one
 * component. Our public surface follows Base UI's flat naming, so it is
 * `TooltipPopup` — the same rule that turned `DialogContent` into
 * `DialogPopup`. The positioner knobs it accepts (`side`, `sideOffset`,
 * `align`, `alignOffset`) stay on the popup; a placement that needs more
 * than those composes `@base-ui/react/tooltip` directly.
 *
 * ```tsx
 * <Tooltip>
 *   <TooltipTrigger render={<Button variant="outline" />}>Hover</TooltipTrigger>
 *   <TooltipPopup>Add to library</TooltipPopup>
 * </Tooltip>
 * ```
 *
 * One thing the rename does NOT change: the popup's `data-slot` is still
 * `tooltip-content`. `Kbd`'s vendored styles key on
 * `in-data-[slot=tooltip-content]` to invert their colours inside a tooltip,
 * and the primitives are byte-pinned — so the slot name is a contract we keep.
 *
 * `TooltipProvider` is optional: it shares one open delay across a group of
 * tooltips (the vendored default is `delay={0}`). Without it every tooltip
 * times itself.
 *
 * `className` on the popup lands on Base UI's Popup slot, so the function
 * form `({ open }) => …` works; the trigger likewise. Style off `data-open`
 * / `data-side` (`'top' | 'bottom' | 'inline-start' | 'inline-end'` …) —
 * hover and focus are CSS pseudo-classes, not data attributes.
 */
export type TooltipProps = TooltipPrimitive.Root.Props
/** `onOpenChange`'s second argument: `reason` (`'trigger-hover'`, `'trigger-focus'`, `'escape-key'`, …) and `cancel()`. */
export type TooltipChangeEventDetails = TooltipPrimitive.Root.ChangeEventDetails
export type TooltipProviderProps = TooltipPrimitive.Provider.Props
export type TooltipTriggerProps = TooltipPrimitive.Trigger.Props
export type TooltipTriggerState = TooltipPrimitive.Trigger.State
/** Popup props plus the four positioner knobs the vendored part forwards. */
export type TooltipPopupProps = ComponentProps<typeof TooltipContent>
export type TooltipPopupState = TooltipPrimitive.Popup.State

/** A cast, not a wrapper: every prop reaches the vendored part by spread; only the name changes. */
export const TooltipPopup = TooltipContent as (props: TooltipPopupProps) => ReactElement

export { Tooltip, TooltipProvider, TooltipTrigger }
```

- [ ] **Step 4: 跑测试确认通过**

Run: `pnpm vitest run packages/ui/test/tooltip.test.tsx`
Expected: PASS（2 tests）。若 `screen.getByRole('tooltip')` 找不到：Base UI Popup 在 `open` 时才挂载且经 Portal 落到 `document.body`，`screen` 查整个 body，应能命中；确认 `open` 是 Root 的受控 prop。

- [ ] **Step 5: 写 demo（四个）**

```tsx
// docs/demos/tooltip/basic.tsx
import type { ReactElement } from 'react'
import { Button, Tooltip, TooltipPopup, TooltipTrigger } from '@gedatou/cadenza-ui'

// The default composition: a trigger that borrows the library Button, and a
// popup that opens on hover and on keyboard focus alike
export default function BasicDemo(): ReactElement {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline" />}>Hover</TooltipTrigger>
      <TooltipPopup>Add to library</TooltipPopup>
    </Tooltip>
  )
}
```

```tsx
// docs/demos/tooltip/sides.tsx
import type { ReactElement } from 'react'
import { Button, Tooltip, TooltipPopup, TooltipTrigger } from '@gedatou/cadenza-ui'

const SIDES = ['top', 'right', 'bottom', 'left'] as const

// `side` is the positioner knob the popup forwards; the arrow follows it
export default function SidesDemo(): ReactElement {
  return (
    <div className="flex flex-wrap gap-2">
      {SIDES.map(side => (
        <Tooltip key={side}>
          <TooltipTrigger render={(
            <Button
              variant="outline"
              className="capitalize"
            />
          )}
          >
            {side}
          </TooltipTrigger>
          <TooltipPopup side={side}>Add to library</TooltipPopup>
        </Tooltip>
      ))}
    </div>
  )
}
```

```tsx
// docs/demos/tooltip/keyboard.tsx
import type { ReactElement } from 'react'
import { Button, Kbd, Tooltip, TooltipPopup, TooltipTrigger } from '@gedatou/cadenza-ui'

// Kbd inside a tooltip inverts its colours on its own — the vendored Kbd
// styles key on the popup's `tooltip-content` slot
export default function KeyboardDemo(): ReactElement {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline" />}>Save</TooltipTrigger>
      <TooltipPopup>
        Save changes
        <Kbd>⌘S</Kbd>
      </TooltipPopup>
    </Tooltip>
  )
}
```

```tsx
// docs/demos/tooltip/disabled.tsx
import type { ReactElement } from 'react'
import { Button, Tooltip, TooltipPopup, TooltipTrigger } from '@gedatou/cadenza-ui'

// A disabled button swallows pointer events, so the trigger is a span around
// it; the tooltip still explains why the action is unavailable
export default function DisabledDemo(): ReactElement {
  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" />}>
        <Button variant="outline" disabled>Delete</Button>
      </TooltipTrigger>
      <TooltipPopup>You need write access to delete</TooltipPopup>
    </Tooltip>
  )
}
```

`keyboard.tsx` 依赖 Task 3 的 `Kbd` 导出——五个任务并行时，本 demo 在汇总任务（Task 6）加 barrel 行之后才能通过 typecheck；单独验证 seam 时先跳过它。

- [ ] **Step 6: 写 docs 页（zh + en）**

骨架（母版 `masters/tooltip.mdx` 去掉 Installation / RTL，节名按词典）：

```
---
title: Tooltip
description: 悬停或键盘聚焦时弹出的说明 —— Base UI 的 Tooltip，内容部件叫 TooltipPopup
---

<ComponentPreview name="tooltip/basic" />

开篇 1–2 段：Base UI tooltip；seam 只改一件事——`TooltipContent` → `TooltipPopup`（Portal→Positioner→Popup 折叠件，四个定位 prop 留在 popup 上）；`data-slot` 仍是 `tooltip-content` 及原因（Kbd 的样式钩子）。

## 使用            import + 最小 JSX（含 render={<Button variant="outline" />}）
## 组成            ```text Tooltip ├── TooltipTrigger └── TooltipPopup；一句 TooltipProvider 是可选的共享延迟
## 方向            → tooltip/sides；`side` 四值 + `sideOffset`/`align`/`alignOffset`
## 键盘快捷键      → tooltip/keyboard；Kbd 反色靠 slot 钩子
## 禁用按钮        → tooltip/disabled；为什么包 span
## 状态与 className  表：data-open / data-closed / data-side / data-instant（Base UI Popup state）↔ 出现时机；data-slot 表：tooltip / tooltip-trigger / tooltip-content（注明是 Popup）/ tooltip-provider
## 键盘交互        表：Tab 聚焦触发器 → 打开；Escape → 关闭；（悬停/离开）
## Props           顺序规则行；### Tooltip（open/defaultOpen/onOpenChange(open, details)/delay/closeDelay/hoverable/disabled…按 Base UI Root.Props）；### TooltipTrigger；### TooltipPopup（side/sideOffset/align/alignOffset + className 函数形态 + 其余 Base UI Popup props 透传）；### TooltipProvider（delay/closeDelay/timeout）
末尾：`N 个类型一并导出：TooltipProps / TooltipChangeEventDetails / …`
```

en 页同骨架，节名 Usage / Composition / Side / With Keyboard Shortcut / Disabled Button / States and className / Keyboard Interaction / Props；站内链接前缀 `/en/docs/...`。

- [ ] **Step 7: lint + typecheck**

Run: `pnpm eslint packages/ui/src/components/tooltip.tsx packages/ui/test/tooltip.test.tsx docs/demos/tooltip && pnpm --filter @gedatou/cadenza-ui typecheck`
Expected: 无错误（`docs/demos/tooltip/keyboard.tsx` 在 Task 6 之前 typecheck 会缺 `Kbd`，属预期）。

---

### Task 2: Badge

**Files:**
- Create: `packages/ui/src/components/badge.tsx`
- Create: `packages/ui/test/badge.test.tsx`
- Create: `docs/demos/badge/{basic,variants,icon,spinner,link,colors}.tsx`
- Create: `docs/content/docs/components/badge.mdx`、`badge.en.mdx`
- Read: `packages/ui/src/primitives/badge.tsx`、`packages/ui/src/components/bubble.tsx`（变体类型别名先例）、scratchpad `masters/badge.mdx`

**Interfaces:**
- Produces: `Badge`, `badgeVariants`；类型 `BadgeProps`, `BadgeVariant`

- [ ] **Step 1: 写失败测试**

```tsx
// packages/ui/test/badge.test.tsx
import { render } from '@testing-library/react'
import { expect, it } from 'vitest'
import { Badge } from '../src/components/badge'

it('mirrors the variant as a data attribute on the badge slot', () => {
  const { container } = render(<Badge variant="outline">New</Badge>)
  const badge = container.querySelector<HTMLElement>('[data-slot=badge]')!
  expect(badge.tagName).toBe('SPAN')
  expect(badge.dataset.variant).toBe('outline')
})

it('renders as a link through render, keeping the badge classes', () => {
  const { container } = render(<Badge render={<a href="/new" />}>New</Badge>)
  const badge = container.querySelector<HTMLElement>('[data-slot=badge]')!
  expect(badge.tagName).toBe('A')
  expect(badge.getAttribute('href')).toBe('/new')
})
```

- [ ] **Step 2: 跑测试确认失败** — `pnpm vitest run packages/ui/test/badge.test.tsx` → FAIL（模块不存在）

- [ ] **Step 3: 写 seam**

```tsx
// packages/ui/src/components/badge.tsx
import type { VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { Badge, badgeVariants } from '#primitives/badge'

/**
 * The published Badge — a small status pill, rendered through Base UI's
 * `useRender` so it can become an `<a>` (or anything) via `render`.
 *
 * ```tsx
 * <Badge variant="outline">Beta</Badge>
 * <Badge render={<a href="/changelog" />}>v0.7</Badge>
 * ```
 *
 * Six variants (`default | secondary | destructive | outline | ghost | link`),
 * mirrored as `data-variant`. An icon or `Spinner` inside the badge should
 * carry `data-icon="inline-start"` / `"inline-end"` — that is what pulls the
 * padding in on that side.
 *
 * `className` is honestly a string: the vendored part passes it into `cva`,
 * whose `cx` is clsx and drops a function silently (the same route, and the
 * same narrowing, as `Button`). The type already says so —
 * `useRender.ComponentProps<'span'>` is `ComponentPropsWithRef<'span'>` — so
 * this is a plain re-export; style off `data-variant` instead.
 */
export type BadgeProps = ComponentProps<typeof Badge>
/** The six looks. Mirrored as `data-variant`. */
export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>

export { Badge, badgeVariants }
```

- [ ] **Step 4: 跑测试确认通过** — 2 tests PASS

- [ ] **Step 5: 写 demo（六个）**

`basic.tsx`：一排四个变体 default / secondary / outline / destructive（hero）。`variants.tsx`：全部六个。`icon.tsx`：`<Badge><IconCheck data-icon="inline-start" />Verified</Badge>` 与尾部图标各一。`spinner.tsx`：`<Badge variant="secondary"><Spinner data-icon="inline-start" aria-hidden />Syncing</Badge>`。`link.tsx`：`render={<a href="#" />}`。`colors.tsx`：`className="bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-200"` 之类三枚。图标来自 `@tabler/icons-react`。每个文件顶部注释写证明什么。

- [ ] **Step 6: 写 docs 页（zh + en）**

骨架（母版去 Installation / RTL）：hero `badge/basic` → 开篇（useRender 与 `render`；cva 路由 className 是 string）→ `## 使用` → `## 变体`（→ badge/variants）→ `## 图标`（→ badge/icon，`data-icon` 两值）→ `## Spinner`（→ badge/spinner，`aria-hidden` 装饰性注入，链 spinner 页）→ `## 链接`（→ badge/link）→ `## 自定义颜色`（→ badge/colors）→ `## 状态与 className`（`data-variant` 表；`data-slot="badge"`）→ `## Props`（顺序规则行；`variant` / `render` / `className: string`（说明 cva 路由）/ 其余 `span` 原生属性含 ref）；末尾「`BadgeProps` / `BadgeVariant` 一并导出」。

- [ ] **Step 7: lint + typecheck** — 同 Task 1 命令，路径换 badge。

---

### Task 3: Kbd

**Files:**
- Create: `packages/ui/src/components/kbd.tsx`
- Create: `packages/ui/test/kbd.test.tsx`
- Create: `docs/demos/kbd/{basic,group,button,tooltip,input-group}.tsx`
- Create: `docs/content/docs/components/kbd.mdx`、`kbd.en.mdx`
- Read: `packages/ui/src/primitives/kbd.tsx`、`packages/ui/src/components/input-group.tsx`（`InputGroupAddon` 用法）、scratchpad `masters/kbd.mdx`

**Interfaces:**
- Produces: `Kbd`, `KbdGroup`；类型 `KbdProps`, `KbdGroupProps`

- [ ] **Step 1: 写失败测试**

```tsx
// packages/ui/test/kbd.test.tsx
import { render } from '@testing-library/react'
import { expect, it } from 'vitest'
import { Kbd, KbdGroup } from '../src/components/kbd'

it('renders real <kbd> elements for both the key and the group', () => {
  const { container } = render(
    <KbdGroup>
      <Kbd>Ctrl</Kbd>
      <Kbd>B</Kbd>
    </KbdGroup>,
  )
  const group = container.querySelector<HTMLElement>('[data-slot=kbd-group]')!
  // The vendored group types itself as a div but renders <kbd>; the seam's
  // cast makes the props type say what the element is.
  expect(group.tagName).toBe('KBD')
  expect(container.querySelectorAll('[data-slot=kbd]')).toHaveLength(2)
  expect(container.querySelector('[data-slot=kbd]')?.tagName).toBe('KBD')
})
```

- [ ] **Step 2: 跑测试确认失败** — FAIL（模块不存在）

- [ ] **Step 3: 写 seam**

```tsx
// packages/ui/src/components/kbd.tsx
import type { ComponentProps, ReactElement } from 'react'
import { Kbd, KbdGroup as KbdGroupPrimitive } from '#primitives/kbd'

/**
 * The published Kbd — a keyboard key, and a group of them.
 *
 * ```tsx
 * <KbdGroup><Kbd>⌘</Kbd><Kbd>K</Kbd></KbdGroup>
 * ```
 *
 * Both are real `<kbd>` elements with no Base UI state underneath, so
 * `className` is a plain string. Dropped inside a `TooltipPopup` the key
 * inverts its colours by itself (the vendored styles key on the popup's
 * `tooltip-content` slot); inside a `Button` or an `InputGroupAddon` it just
 * sits inline.
 *
 * `KbdGroup` is a cast, not a wrapper: the vendored part types its props as a
 * `<div>`'s but renders a `<kbd>` — the seam re-types it to the element it
 * actually is (`ComponentProps<'kbd'>`, ref included). Nothing else changes.
 */
export type KbdProps = ComponentProps<typeof Kbd>
export type KbdGroupProps = ComponentProps<'kbd'>

export const KbdGroup = KbdGroupPrimitive as (props: KbdGroupProps) => ReactElement

export { Kbd }
```

- [ ] **Step 4: 跑测试确认通过** — 1 test PASS

- [ ] **Step 5: 写 demo（五个）**

`basic.tsx`：`<Kbd>Ctrl</Kbd>`、`<Kbd>⌘</Kbd>` 等三枚（hero）。`group.tsx`：`<KbdGroup><Kbd>Ctrl</Kbd><Kbd>B</Kbd></KbdGroup>`。`button.tsx`：`<Button variant="outline">Accept <Kbd>⏎</Kbd></Button>`。`tooltip.tsx`：Tooltip 内 Kbd（依赖 Task 1；同 keyboard demo 的说明）。`input-group.tsx`：`<InputGroup><InputGroupInput placeholder="Search…" /><InputGroupAddon align="inline-end"><Kbd>⌘K</Kbd></InputGroupAddon></InputGroup>`。

- [ ] **Step 6: 写 docs 页（zh + en）**

骨架：hero `kbd/basic` → 开篇 → `## 使用` → `## 组成`（```text Kbd / KbdGroup ├── Kbd └── Kbd）→ `## 分组`（→ kbd/group）→ `## Button`（→ kbd/button）→ `## Tooltip`（→ kbd/tooltip）→ `## InputGroup`（→ kbd/input-group）→ `## 状态与 className`（纯 DOM：`data-slot` 一行带过；tooltip 反色钩子说明）→ `## Props`（### Kbd：className string + 其余 `kbd` 原生属性；### KbdGroup：同，注明 cast 修正了 vendored 的 div 类型）；末尾 `KbdProps / KbdGroupProps 一并导出`。

- [ ] **Step 7: lint + typecheck** — 路径换 kbd。

---

### Task 4: Empty

**Files:**
- Create: `packages/ui/src/components/empty.tsx`
- Create: `packages/ui/test/empty.test.tsx`
- Create: `docs/demos/empty/{basic,outline,background,input-group}.tsx`
- Create: `docs/content/docs/components/empty.mdx`、`empty.en.mdx`
- Read: `packages/ui/src/primitives/empty.tsx`、scratchpad `masters/empty.mdx`

**Interfaces:**
- Produces: `Empty`, `EmptyHeader`, `EmptyMedia`, `EmptyTitle`, `EmptyDescription`, `EmptyContent`；类型 `EmptyProps`, `EmptyHeaderProps`, `EmptyMediaProps`, `EmptyMediaVariant`, `EmptyTitleProps`, `EmptyDescriptionProps`, `EmptyContentProps`

- [ ] **Step 1: 写失败测试**

```tsx
// packages/ui/test/empty.test.tsx
import { render } from '@testing-library/react'
import { expect, it } from 'vitest'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../src/components/empty'

it('lays out header, media, title, description and content under their slots', () => {
  const { container } = render(
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">i</EmptyMedia>
        <EmptyTitle>No threads yet</EmptyTitle>
        <EmptyDescription>Start a conversation to see it here.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>action</EmptyContent>
    </Empty>,
  )
  const q = (slot: string): HTMLElement | null => container.querySelector(`[data-slot=${slot}]`)
  expect(q('empty')).not.toBeNull()
  expect(q('empty-header')).not.toBeNull()
  // shadcn names the media slot `empty-icon` whatever the variant — a
  // vendored quirk the seam documents rather than patches.
  expect(q('empty-icon')?.dataset.variant).toBe('icon')
  expect(q('empty-title')?.textContent).toBe('No threads yet')
  // Typed as a <p> upstream but rendered as a <div>; the seam re-types it.
  expect(q('empty-description')?.tagName).toBe('DIV')
  expect(q('empty-content')?.textContent).toBe('action')
})
```

- [ ] **Step 2: 跑测试确认失败** — FAIL

- [ ] **Step 3: 写 seam**

```tsx
// packages/ui/src/components/empty.tsx
import type { VariantProps } from 'class-variance-authority'
import type { ComponentProps, ReactElement } from 'react'
import { cva } from 'class-variance-authority'
import {
  Empty,
  EmptyContent,
  EmptyDescription as EmptyDescriptionPrimitive,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '#primitives/empty'

/**
 * The published Empty family — the "nothing here yet" block: media, title,
 * description, then whatever action gets the user out of the empty state.
 *
 * ```tsx
 * <Empty>
 *   <EmptyHeader>
 *     <EmptyMedia variant="icon"><IconInbox /></EmptyMedia>
 *     <EmptyTitle>No threads yet</EmptyTitle>
 *     <EmptyDescription>Start a conversation to see it here.</EmptyDescription>
 *   </EmptyHeader>
 *   <EmptyContent><Button>New thread</Button></EmptyContent>
 * </Empty>
 * ```
 *
 * Every part is a plain `<div>`, so `className` is a string. Two vendored
 * quirks worth knowing before you fight them: `EmptyMedia` writes
 * `data-slot="empty-icon"` for both variants (`default | icon`) — the
 * variant itself is `data-variant`; and `EmptyDescription` is typed as a
 * `<p>` upstream but renders a `<div>` — the seam re-types it to the element
 * it is (a cast), so `ref` and event handlers line up.
 */
export type EmptyProps = ComponentProps<typeof Empty>
export type EmptyHeaderProps = ComponentProps<typeof EmptyHeader>
export type EmptyMediaProps = ComponentProps<typeof EmptyMedia>
/** `default` (transparent) or `icon` (a muted rounded tile sized for one icon). Mirrored as `data-variant`. */
export type EmptyMediaVariant = NonNullable<EmptyMediaProps['variant']>
export type EmptyTitleProps = ComponentProps<typeof EmptyTitle>
export type EmptyDescriptionProps = ComponentProps<'div'>
export type EmptyContentProps = ComponentProps<typeof EmptyContent>

export const EmptyDescription = EmptyDescriptionPrimitive as (props: EmptyDescriptionProps) => ReactElement

export { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle }
```

（若 `cva`/`VariantProps` 未用到则删掉对应 import——`EmptyMediaVariant` 直接从 `EmptyMediaProps['variant']` 取，不需要 cva。）

- [ ] **Step 4: 跑测试确认通过** — 1 test PASS

- [ ] **Step 5: 写 demo（四个）**

`basic.tsx`（hero）：icon 媒体 + 标题 + 描述 + `EmptyContent` 里一个 Button。`outline.tsx`：`<Empty className="border">`（母版「Outline」）。`background.tsx`：`className="bg-linear-to-b from-muted/50 to-background"` 之类。`input-group.tsx`：`EmptyContent` 里放 `InputGroup`（搜索框 + 按钮）。母版的 Avatar / Avatar Group 两节因 `Avatar` 未提升整节省去（在 docs 页开篇一句说明，迁移 commit 里也写）。

- [ ] **Step 6: 写 docs 页（zh + en）**

骨架：hero `empty/basic` → 开篇（含「母版的 Avatar 两节省去：Avatar 未提升」）→ `## 使用` → `## 组成`（```text 树）→ `## 描边`（→ empty/outline）→ `## 背景`（→ empty/background）→ `## InputGroup`（→ empty/input-group）→ `## 什么时候用 Empty`（vs `TranscriptEmpty`？不——本库内对比对象是 DataTable 的空态槽 / InfiniteSelect 的 `Empty` 部件：一张两行表）→ `## 状态与 className`（`data-variant` on media；`data-slot` 表含 `empty-icon` 说明）→ `## Props`（六个部件各 H3，迷你表 + 用法片段）；末尾 7 个类型一并导出。

- [ ] **Step 7: lint + typecheck** — 路径换 empty。

---

### Task 5: Item

**Files:**
- Create: `packages/ui/src/components/item.tsx`
- Create: `packages/ui/test/item.test.tsx`
- Create: `docs/demos/item/{basic,variant,size,icon,image,group,header,link,dropdown}.tsx`
- Create: `docs/content/docs/components/item.mdx`、`item.en.mdx`
- Read: `packages/ui/src/primitives/item.tsx`、`packages/ui/src/components/dropdown-menu.tsx`（dropdown demo 用）、scratchpad `masters/item.mdx`

**Interfaces:**
- Produces: `Item`, `ItemGroup`, `ItemSeparator`, `ItemMedia`, `ItemContent`, `ItemTitle`, `ItemDescription`, `ItemActions`, `ItemHeader`, `ItemFooter`；类型同名 `*Props` + `ItemVariant`, `ItemSize`, `ItemMediaVariant`

- [ ] **Step 1: 写失败测试**

```tsx
// packages/ui/test/item.test.tsx
import { render } from '@testing-library/react'
import { expect, it } from 'vitest'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '../src/components/item'

it('mirrors variant and size on the item and lists the group', () => {
  const { container } = render(
    <ItemGroup>
      <Item variant="outline" size="sm">
        <ItemMedia variant="icon">i</ItemMedia>
        <ItemContent>
          <ItemTitle>Thread</ItemTitle>
          <ItemDescription>Yesterday</ItemDescription>
        </ItemContent>
        <ItemActions>x</ItemActions>
      </Item>
    </ItemGroup>,
  )
  const group = container.querySelector<HTMLElement>('[data-slot=item-group]')!
  expect(group.getAttribute('role')).toBe('list')
  const item = container.querySelector<HTMLElement>('[data-slot=item]')!
  expect(item.dataset.variant).toBe('outline')
  expect(item.dataset.size).toBe('sm')
  expect(container.querySelector<HTMLElement>('[data-slot=item-media]')?.dataset.variant).toBe('icon')
  expect(container.querySelector('[data-slot=item-description]')?.tagName).toBe('P')
})

it('renders as a link through render', () => {
  const { container } = render(<Item render={<a href="/t/1" />}>row</Item>)
  const item = container.querySelector<HTMLElement>('[data-slot=item]')!
  expect(item.tagName).toBe('A')
})
```

- [ ] **Step 2: 跑测试确认失败** — FAIL

- [ ] **Step 3: 写 seam**

```tsx
// packages/ui/src/components/item.tsx
import type { ComponentProps } from 'react'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from '#primitives/item'

/**
 * The published Item family — one row of content: media, title and
 * description, and an actions area; optional header and footer spanning the
 * row. `ItemGroup` stacks rows (it is `role="list"`; give each `Item` a
 * `render={<li />}` or `role="listitem"` when that semantics matters), and
 * `ItemSeparator` rules between them.
 *
 * ```tsx
 * <ItemGroup>
 *   <Item render={<a href="/threads/1" />}>
 *     <ItemMedia variant="icon"><IconMessage /></ItemMedia>
 *     <ItemContent>
 *       <ItemTitle>Rehearsal schedule</ItemTitle>
 *       <ItemDescription>Yesterday · 12 messages</ItemDescription>
 *     </ItemContent>
 *     <ItemActions><Button variant="ghost" size="icon-xs" aria-label="More">…</Button></ItemActions>
 *   </Item>
 * </ItemGroup>
 * ```
 *
 * `Item` and `ItemMedia` carry the two knobs: `variant` (`default | outline |
 * muted`; media: `default | icon | image`) and `size` (`default | sm | xs`),
 * all mirrored as `data-variant` / `data-size`. `Item` renders through
 * `useRender`, so `render` turns it into a link or a button with the hover
 * and focus styling following; its `className` is a string (cva route —
 * `useRender.ComponentProps<'div'>` already says so), as is every other
 * part's (plain divs; `ItemDescription` is a real `<p>`).
 *
 * This is the row primitive the `ThreadList` in `@gedatou/cadenza-ai` is
 * built on; it is also what to reach for over `Field` when the row shows
 * content rather than a form control.
 */
export type ItemProps = ComponentProps<typeof Item>
/** The three surfaces. Mirrored as `data-variant`. */
export type ItemVariant = NonNullable<ItemProps['variant']>
/** Row density. Mirrored as `data-size`; `ItemGroup` tightens its gap to match. */
export type ItemSize = NonNullable<ItemProps['size']>
export type ItemGroupProps = ComponentProps<typeof ItemGroup>
export type ItemSeparatorProps = ComponentProps<typeof ItemSeparator>
export type ItemMediaProps = ComponentProps<typeof ItemMedia>
/** `default`, an `icon` tile, or a cropped `image`. Mirrored as `data-variant`. */
export type ItemMediaVariant = NonNullable<ItemMediaProps['variant']>
export type ItemContentProps = ComponentProps<typeof ItemContent>
export type ItemTitleProps = ComponentProps<typeof ItemTitle>
export type ItemDescriptionProps = ComponentProps<typeof ItemDescription>
export type ItemActionsProps = ComponentProps<typeof ItemActions>
export type ItemHeaderProps = ComponentProps<typeof ItemHeader>
export type ItemFooterProps = ComponentProps<typeof ItemFooter>

export {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
}
```

- [ ] **Step 4: 跑测试确认通过** — 2 tests PASS

- [ ] **Step 5: 写 demo（九个）**

`basic.tsx`（hero）：icon 媒体 + 标题/描述 + actions 里一个 outline Button。`variant.tsx`：三个变体各一行。`size.tsx`：三档。`icon.tsx`：`ItemMedia variant="icon"`。`image.tsx`：`variant="image"` + `<img>`（用 `https://avatars.githubusercontent.com/u/124599?v=4` 之类公开图，或 `data:` 占位）。`group.tsx`：`ItemGroup` + `ItemSeparator`。`header.tsx`：`ItemHeader` 放一张横幅 + `ItemContent`。`link.tsx`：`render={<a href="#" />}`。`dropdown.tsx`：actions 里 `DropdownMenu`（`DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="More" />}` + `DropdownMenuPopup` 三项）。母版 Avatar 节省去（Avatar 未提升）。

- [ ] **Step 6: 写 docs 页（zh + en）**

骨架：hero `item/basic` → 开篇 → `## 使用` → `## 组成`（```text 树）→ `## 变体`（→ item/variant）→ `## 尺寸`（→ item/size）→ `## 图标`（→ item/icon）→ `## 图片`（→ item/image）→ `## 分组`（→ item/group）→ `## 页眉`（→ item/header）→ `## 链接`（→ item/link + 代码块）→ `## 下拉菜单`（→ item/dropdown）→ `## 什么时候用 Item`（母版 "Item vs Field" 挪到这里：Field 管表单控件，Item 管内容行）→ `## 状态与 className`（`data-variant` / `data-size` 两张表；`data-slot` 表十行）→ `## Props`（十个部件各 H3，迷你表 + 片段；`Item` 表含 variant/size/render/className）；末尾 13 个类型一并导出。

- [ ] **Step 7: lint + typecheck** — 路径换 item。

---

### Task 6: 汇总接线、全量验证与提交

**Files:**
- Modify: `packages/ui/src/index.ts`（按字母序插入 5 行）
- Modify: `docs/demos/index.tsx` registry（tooltip 4 + badge 6 + kbd 5 + empty 4 + item 9 = 28 行）
- Modify: `docs/components/theme-preview-grid.tsx` `PREVIEWS`（加 `{ title: 'Badge', name: 'badge/variants' }`、`{ title: 'Kbd', name: 'kbd/group' }`、`{ title: 'Empty', name: 'empty/basic' }`、`{ title: 'Item', name: 'item/basic' }`；Tooltip 需悬停不进网格）
- Modify: `packages/ui/README.md` 文档列表句（可选加 Badge / Item）

**Interfaces:**
- Consumes: Task 1–5 的全部导出

- [ ] **Step 1: barrel**

在 `packages/ui/src/index.ts` 按字母序加入：

```ts
export * from './components/badge'
export * from './components/empty'
export * from './components/item'
export * from './components/kbd'
export * from './components/tooltip'
```

- [ ] **Step 2: registry + preview grid**

`docs/demos/index.tsx` 的 `registry` 里按家族分块加入 28 行，形如 `'tooltip/basic': lazy(async () => import('./tooltip/basic')),`。`theme-preview-grid.tsx` 加四条。

- [ ] **Step 3: 全量验证**

Run（依次）：
- `pnpm --filter @gedatou/cadenza-ui run build`（dist 更新；docs prod 走 dist）
- `pnpm vitest run packages/ui/test`（含 `vendored-sources.test.ts` 必须仍绿——证明 primitives 未动）
- `pnpm eslint packages/ui/src/components/{tooltip,badge,kbd,empty,item}.tsx packages/ui/test/{tooltip,badge,kbd,empty,item}.test.tsx docs/demos/{tooltip,badge,kbd,empty,item} docs/components/theme-preview-grid.tsx docs/demos/index.tsx packages/ui/src/index.ts`
- `pnpm --filter @gedatou/cadenza-ui typecheck && pnpm --filter docs typecheck`
- `pnpm --filter docs run build`（MDX 编译 + 静态页生成；五页 zh/en 都要过）
Expected: 全绿。

- [ ] **Step 4: 视觉验证**

先探测 3000 是否已有 dev server（`lsof -nP -iTCP:3000 -sTCP:LISTEN`）；有则复用，没有则 `PORT=3001 pnpm --filter docs dev` 并记 PID。用 agent-browser 打开 `/docs/components/{tooltip,badge,kbd,empty,item}` 与 `/en/docs/components/...`，逐页截图核对：hero 渲染、tooltip 悬停打开、Kbd 在 tooltip 内反色、Empty 描边/背景、Item 三变体三尺寸、dropdown 打开。自己起的进程用完按 PID 收掉。

- [ ] **Step 5: 提交**

```bash
git add packages/ui/src/components/{tooltip,badge,kbd,empty,item}.tsx packages/ui/src/index.ts packages/ui/test/{tooltip,badge,kbd,empty,item}.test.tsx docs/demos/{tooltip,badge,kbd,empty,item} docs/demos/index.tsx docs/components/theme-preview-grid.tsx docs/content/docs/components/{tooltip,badge,kbd,empty,item}.mdx docs/content/docs/components/{tooltip,badge,kbd,empty,item}.en.mdx
git commit -m "feat(ui): promote tooltip, badge, kbd, empty and item

Five vendored base-nova primitives become public components for the
upcoming @gedatou/cadenza-ai views. TooltipContent is renamed TooltipPopup
(Base UI naming, DialogPopup precedent); KbdGroup and EmptyDescription are
re-typed to the elements they actually render; the rest are plain
re-exports with variant type aliases. Each ships tests, demos and zh/en
docs pages mirroring the shadcn masters (Installation / RTL / Avatar
sections omitted — Avatar is not promoted).

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Self-review

- **Spec coverage**：spec §前置提升 表列 tooltip（TooltipContent → TooltipPopup cast）、badge（cva 路由 string）、kbd、empty、item 五项，Task 1–5 一一对应；`progress` 按 spec 延到 P2，不在本计划。
- **Placeholder scan**：demo 步骤对每个文件给出了内容要点与关键 JSX；docs 页给出了逐节骨架与每节要写的事实。无 TBD。
- **Type consistency**：Task 6 barrel 行与 Task 1–5 的导出名一致；`keyboard.tsx`/`kbd/tooltip.tsx` 的跨任务依赖已注明在汇总后 typecheck。
- **计划偏离 spec 的地方**：spec 的 PR-0b（catalog 依赖 + ResettableDemo 搬迁）并入 Phase 1 第一个 PR——catalog 条目在被消费前是投机配置，`ResettableDemo` 的搬迁在 ai demo 出现前没有读者。
