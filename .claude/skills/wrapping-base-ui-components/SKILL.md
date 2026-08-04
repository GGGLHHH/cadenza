---
name: wrapping-base-ui-components
description: Use when adding, promoting, or modifying components in packages/ui — wrapping Base UI, promoting a vendored shadcn primitive out of src/primitives, adding wiring props (onClear/onSubmit-style handlers), or touching className / ref / data-slot handling in a seam file. Also when a caller-passed prop seems to "overwrite" internal behaviour, or a function className silently does nothing.
---

# Wrapping Base UI components (cadenza 家法)

## Overview

本库有三层，规则不同，混用规则就是事故：

| 层 | 是谁的 | 规则 |
| --- | --- | --- |
| `src/primitives/`、`src/hooks/` | shadcn 的（base-nova 预设） | **一个字节都不许改**。`vendored-sources.test.ts` 钉死哈希；`pnpm test -u` 只许在合法 re-pull（`shadcn add -o`）后跑 |
| `src/components/` | 我们的 seam | 公开面在这里定形：改名、收窄、包装、修类型，全在 seam 做 |
| `src/lib/utils.ts` 的 `cn` | 我们的 | **契约守门人**：`cn` 会组合函数 className（见下），vendored 文件不改也能兑现 Base UI 契约 |

核心决策（用户拍板，2026-08）：**className 契约走 Base UI 官方姿势** ——
调用方可以传 `className={({ selected }) => …}`，封装层必须让它活着到达 Base UI。

## className 契约（最重要的一条）

Base UI 把 `className` 类型定为 `string | (state => string)`。clsx 会**静默丢弃函数**
（无报错、无警告，类全部消失）。本库的解法在 `cn` 里：任何参数是函数时，`cn` 返回一个
延迟解析的组合函数，交给 Base UI 在渲染时求值。所以：

- **写封装时照常 `cn(base, className)`** —— 不需要手写 `composeRenderProps`，契约由 cn 保住。
- **`cn` 的结果只能落在 Base UI 的 className 槽位**。落到普通 DOM 元素
  （`<div className={cn(base, className)}>`）= 把函数灌进 DOM。tsc 会拦（cn 的返回类型是诚实的
  条件类型），别绕。
- vendored 文件自己犯这个错时（现存两例：`accordion.tsx` 和 `combobox.tsx` 把函数 className 灌进纯 DOM 元素 / cva），
  改不了字节 → 在 `packages/ui/tsconfig.json` 的 `exclude` 里排除该文件并写明原因；提升它之前必须先 fork。
- 部件本身不是 Base UI 底座（纯 div/span）→ props 用 `ComponentProps<'div'>`，className 就是 string，诚实。
- vendored 已把 className 收窄成 string 的部件（button、select、dialog 等 `Omit<…,'className'> & {className?: string}`）：
  类型诚实、无静默丢失，**保持原样**。要为它开函数契约 = 在 seam 用 vendored 导出的 variants 直渲 Base UI
  （参照 `components/button.tsx` 的 LinkButton），别改 vendored。

## 提升 / 新增组件检查单（逐项过，不许跳）

1. **className 路由审计**：底层部件把 caller 的 className 放到哪个元素？Base UI 槽位 → 函数契约自动成立；
   普通 DOM → 类型必须是 string。写进 JSDoc。
2. **ref 类型重述**：底座把 ref 声明在组件类型上而不是 props 里时，`ComponentProps<typeof X>` 会丢它。
   seam 补 `& RefAttributes<对应元素>`（运行时 React 19 的 spread 本来就带过去了，只是类型要说实话）。
   先例：`search-field.tsx`、`tabs.tsx` 的 TabListProps、`input-group.tsx` 的 cast。
3. **wiring props 解构并串联**：内部要接的回调（onClear、onSubmit、onOpenChange…）**必须从 props
   解构出来，内部逻辑先跑、caller 的后跑**。写在 `{...props}` 前面 = caller 一传就整个顶掉你的接线，静默失效。
   先例：`search-field.tsx` 的 onClear。
4. **data-slot**：每个部件最外层标 `data-slot="kebab-名"`。例外要有契约理由并写注释
   （`input-group-control` 是接线契约——先写属性后 spread 的部件，caller 传同名会顶掉它）。
5. **禁用态走 data 属性**：`LinkButton` / `pending` 等场景不渲染原生 `:disabled`，视觉必须用
   `data-disabled:` 镜像（canonical 简写，lint 会把 `data-[disabled]:` 改写成它；先例：LinkButton）。
   `pointer-events-none` 在本库是死代码——styles.css 的无层级规则为了显示禁止光标已全局
   `pointer-events: auto`。
6. **集合组件保泛型**：`<T extends object>` + `items` + 函数 children 双形态。vendored 值组件收窄了泛型
   就在 seam cast 回来（先例：GenericTabsList）。
7. **纯转出的 promotion**（零逻辑 seam）照 `input-group.tsx` 模板：改名导入、重述 props 类型、
   文档注释讲清哪些行为来自 Base UI。

## components 层复合件的第二套家法（与 primitives 家法并列，都是对的）

- 封闭复合件（DataTable、DataPagination、InfiniteSelect 根）**不透传 rest/ref**，props 是枚举面板 —— 既定风格。
- 传状态/动作用**裸 React context**。Base UI 自己的 context 是内部实现，不要去 reach 它。
- 空态显隐：列表整个不渲染时 DOM 里没有 `data-empty` 可选 → 用 JS context 三态互斥（InfiniteSelect 模式）；
  列表还在 DOM 里 → 用 CSS `group-data-empty`（primitives 模式）。

### 组合通道只能是 children，永远不开第二个 ReactNode prop

组合方式只有一种：**children，按位置**。`InfiniteCombobox` 是第一个 child 是触发器、
其余是面板内容；`Select` 是 Trigger / Content 按书写顺序。从不为「第二种内容」开第二个 prop。

所以便利层（InfiniteCombobox 这类"触发器 + 浮层"的封装）**照抄 DialogTrigger 的位置契约**：

```tsx
const [triggerChild, panelSlots] = typeof children === 'function'
  ? [children, null]                                    // 函数形态整个就是触发器
  : (() => { const [first, ...rest] = Children.toArray(children); return [first, rest] as const })()
```

- 禁止 `slots?: ReactNode` / `content?: ReactNode` / `panel?: ReactNode` 这类第二通道。
  `slots`（复数）在 React 生态里已经是 MUI / Base UI 的**组件替换表**（`slots={{ paper: X }}`），
  本仓库同时在用 Base UI，同名不同义是实打实的坑。
- Base UI 的 `render`（元素或函数）是另一回事：替换部件落地的那个元素，不是内容通道。别混。
- 类型上要写 `ReactNode | ReactNode[] | ((state) => ReactElement)`。`ReactNode[]` 必须显式列出：
  TS 只在 children 类型本身是数组类型时才允许多个 JSX children，不会去 `Iterable<ReactNode>` 里找。
- 位置契约的代价写进 JSDoc：触发器不能被 Fragment 包住（那样第一个 child 是 Fragment，
  cloneElement 的接线会落到 Fragment 上）。

### 内容永远不走 prop：`?: ReactNode` 就是站错队

判据是**配置 vs 内容**：

| | 走哪 | 例子 |
| --- | --- | --- |
| **配置** —— 数字 / 枚举 / 布尔 / 尺寸 / 无障碍名 | prop | `rowHeight` `maxHeight` `loadMoreScrollOffset` `scrollbars` `firstPageLabel` |
| **内容** —— 调用方要写 JSX 的东西 | **组合通道**（插槽或标记部件） | 状态文案、加载指示、终止行 |
| **随状态变的内容** | **render prop** `(state) => ReactNode` | `summary` `pageIndicator` `SelectValue` 的函数 children |

所以看到 `xxx?: ReactNode` 出现在 props 上（`children` 除外）就停手。审计命令：

```bash
grep -rn "?: ReactNode$" packages/ui/src/components/*.tsx | grep -v "'children'"
```

**这条已经清零，别再加回去。** 历史欠账（2026-08 清掉）：`loadingMoreIndicator`
（InfiniteSelectList / DataTable / InfiniteCombobox 透传三处）→ `InfiniteSelectLoadingMore` /
`DataTableLoadingMore` 标记部件；`rowsPerPageLabel: ReactNode` → `string`（它是标签，
和 `firstPageLabel` 一族同类，顺带让 `aria-label` 无条件正确）。

**标记部件天生带默认值**，这是它比 prop 强的地方：`findComposedPart` 没找到就是 `undefined`，
owner 照常渲染默认视觉。默认值住在 owner 的渲染处，不在 prop 的 `= xxx` 里，而且标记部件
还能带 `className`，prop 只能带内容。

```tsx
const loadingMoreProps = findComposedPart(children, DataTableLoadingMore)
…
<TableLoadMoreItem {...loadingMoreProps} className={cn(base, loadingMoreProps?.className)}>
  {loadingMoreProps?.children ?? <Spinner aria-hidden />}
</TableLoadMoreItem>
```

默认视觉一律**无语言**（Spinner / 淡出细线 / 分隔线），不是文案 —— 基座零文案，
一个要发 npm 的库不该往 DOM 里塞任何一种语言。

标记部件的 props 类型要跟**落地元素**对齐：`InfiniteSelectNoMore` 渲染成 div →
`ComponentProps<'div'>`；`DataTableLoadingMore` 渲染成 `<tr>`（`<tbody>` 里只能放行）→
`ComponentProps<'tr'>`。写错了 spread 时 `ref` 类型会打架
（`HTMLDivElement` vs `HTMLTableRowElement`）。

翻页时列表末尾必须有反馈，**所以默认值不是锦上添花，是必需品**。

### 部件二分法：普通插槽 / 标记部件

判据是**在哪儿渲染**：

| | 例子 |
| --- | --- |
| **原地渲染 → 普通插槽** | `InfiniteSelectEmpty` |
| **被 owner 提升 → 标记部件** | `InfiniteSelectLoadingOverlay` / `NoMore` / `DataTableLoadingMore` |

选择顺序，停在第一个成立的：

1. **调用方写在哪就能在哪正确渲染？→ 普通插槽。** 零机制，默认选它。
2. **位置是组件的设计决定、不是调用方的排版自由？→ 标记部件。** 自己 `return null`，
   owner 用 `findComposedPart` 捞 props 渲染到只有它知道的位置（绝对定位覆盖层、滚动流末尾）。
   标记部件是**定制入口不是开关** —— 不组合它，默认视觉照样渲染（LoadingOverlay 默认 Spinner、
   NoMore 默认一条淡出细线）。

**列表的尾巴渲染在 listbox / tbody 的语义之外**：终止行、加载指示、翻页哨兵都不是 option，
不进 `aria-setsize`，`getAllByRole('option')` 数到的就是真实行。（React Aria 那版做不到 ——
它的 loader 行必须是 `role="option"`，测试里数行得绕开它。）

## 常见错误（基线实测的原话）

| 错误/借口 | 事实 |
| --- | --- |
| 提升时只复刻模板，不审计契约 | 基线子代理原样转正了 Switch 的半开门，决策记录里一次没提 className。检查单第 1、2 条是必做项，不是风格建议 |
| “那是既有行为，可能有调用方依赖覆盖语义” | 覆盖掉内部接线不是兼容性，是 bug。wiring prop 必须解构串联（第 3 条），发现同款问题顺手按同款修 |
| “函数 className 反正没人用” | 它是 Base UI 文档的常规用法，且类型公开承诺了它 |
| “直接改 primitives 里那一行更快” | 改一个字节 = 毁掉 `--dry-run identical` 的上游漂移信号 + 钉死测试红。修 seam、修 cn，或 fork |
| “类型上先放宽，运行时以后再说” | 半开门（类型许函数、运行时吞掉）是全审计里最危险的一类。类型和运行时必须同时说实话 |

## Red flags —— 出现就停手回查

- 写了 `Omit<…, 'className'>` 却没想清楚是哪条路由逼你收窄的
- `{...props}` 后面没有任何内部 handler，但组件明明有内部接线
- `ComponentProps<typeof X>` 直接当公开 props 用而没查 ref / 泛型丢没丢
- 想给 vendored 文件加一行 / 改一个类型
- tsc 在 vendored 文件里报 className 赋值错 —— 那是 misroute 信号，处理方式见上，不是 `as` 掉
