---
name: wrapping-rac-components
description: Use when adding, promoting, or modifying components in packages/ui — wrapping react-aria-components (RAC) or Base UI, promoting a vendored shadcn primitive out of src/primitives, adding wiring props (onClear/onSubmit-style handlers), or touching className / ref / data-slot handling in a seam file. Also when a caller-passed prop seems to "overwrite" internal behaviour, or a function className silently does nothing.
---

# Wrapping React Aria components (cadenza 家法)

## Overview

本库有三层，规则不同，混用规则就是事故：

| 层 | 是谁的 | 规则 |
| --- | --- | --- |
| `src/primitives/`、`src/hooks/` | shadcn 的（aria-nova 预设） | **一个字节都不许改**。`vendored-sources.test.ts` 钉死哈希；`pnpm test -u` 只许在合法 re-pull（`shadcn add -o`）后跑 |
| `src/components/` | 我们的 seam | 公开面在这里定形：改名、收窄、包装、修类型，全在 seam 做 |
| `src/lib/utils.ts` 的 `cn` | 我们的 | **契约守门人**：`cn` 会组合函数 className（见下），vendored 文件不改也能兑现 RAC 契约 |

核心决策（用户拍板，2026-08）：**className 契约走 React Aria 官方姿势** ——
调用方可以传 `className={({ isSelected }) => …}`，封装层必须让它活着到达 RAC。

## className 契约（最重要的一条）

RAC 和 Base UI 都把 `className` 类型定为 `string | (state => string)`。clsx 会**静默丢弃函数**
（无报错、无警告，类全部消失）。本库的解法在 `cn` 里：任何参数是函数时，`cn` 返回一个
延迟解析的组合函数，交给 RAC/Base UI 在渲染时求值。所以：

- **写封装时照常 `cn(base, className)`** —— 不需要手写 `composeRenderProps`，契约由 cn 保住。
- **`cn` 的结果只能落在 RAC / Base UI 的 className 槽位**。落到普通 DOM 元素
  （`<div className={cn(base, racClassName)}>`）= 把函数灌进 DOM。tsc 会拦（cn 的返回类型是诚实的
  条件类型），别绕。
- vendored 文件自己犯这个错时（现存唯一例：`accordion.tsx` 把 RAC className 灌内层 div），
  改不了字节 → 在 `packages/ui/tsconfig.json` 的 `exclude` 里排除该文件并写明原因；提升它之前必须先 fork。
- 部件本身不是 RAC 底座（纯 div/span）→ props 用 `ComponentProps<'div'>`，className 就是 string，诚实。
- vendored 已把 className 收窄成 string 的部件（button、select、dialog 等 `Omit<…,'className'> & {className?: string}`）：
  类型诚实、无静默丢失，**保持原样**。要为它开函数契约 = 在 seam 用 vendored 导出的 variants 直渲 RAC
  （参照 `components/button.tsx` 的 LinkButton），别改 vendored。

## 提升 / 新增组件检查单（逐项过，不许跳）

1. **className 路由审计**：底层部件把 caller 的 className 放到哪个元素？RAC/Base UI 槽位 → 函数契约自动成立；
   普通 DOM → 类型必须是 string。写进 JSDoc。
2. **ref 类型重述**：RAC 把 ref 声明在组件类型上而不是 props 里，`ComponentProps<typeof X>` 会丢它。
   seam 补 `& RefAttributes<对应元素>`（运行时 React 19 的 spread 本来就带过去了，只是类型要说实话）。
   先例：`search-field.tsx`、`tabs.tsx` 的 TabListProps、`input-group.tsx` 的 cast。
3. **wiring props 解构并串联**：内部要接的 RAC 回调（onClear、onSubmit、onOpenChange…）**必须从 props
   解构出来，内部逻辑先跑、caller 的后跑**。写在 `{...props}` 前面 = caller 一传就整个顶掉你的接线，静默失效。
   先例：`search-field.tsx` 的 onClear。
4. **data-slot**：每个部件最外层标 `data-slot="kebab-名"`。例外要有契约理由并写注释
   （`input-group-control` 是接线契约——先写属性后 spread 的部件，caller 传同名会顶掉它）。
5. **禁用态走 data 属性**：RAC 的 Link/isPending 等场景不渲染原生 `:disabled`，视觉必须用
   `data-disabled:` 镜像（canonical 简写，lint 会把 `data-[disabled]:` 改写成它；先例：LinkButton）。
   `pointer-events-none` 在本库是死代码——styles.css 的无层级规则为了显示禁止光标已全局
   `pointer-events: auto`。
6. **集合组件保泛型**：`<T extends object>` + `items` + 函数 children 双形态。vendored 值组件收窄了泛型
   就在 seam cast 回来（先例：GenericTabsList）。
7. **纯转出的 promotion**（零逻辑 seam）照 `input-group.tsx` 模板：改名导入、重述 props 类型、
   文档注释讲清哪些行为来自 RAC。

## components 层复合件的第二套家法（与 primitives 家法并列，都是对的）

- 封闭复合件（DataTable、DataPagination、InfiniteSelect 根）**不透传 rest/ref**，props 是枚举面板 —— 既定风格。
- 传状态/动作用**裸 React context**（对应 RAC 自己的 XxxStateContext 模式）；RAC 的
  `ContextValue`+`useContextProps` 是给「可合并 props」用的，别硬套。
- 空态显隐：列表整个不渲染时 DOM 里没有 `data-empty` 可选 → 用 JS context 三态互斥（InfiniteSelect 模式）；
  列表还在 DOM 里 → 用 CSS `group-data-empty`（primitives 模式）。

## 常见错误（基线实测的原话）

| 错误/借口 | 事实 |
| --- | --- |
| 提升时只复刻模板，不审计契约 | 基线子代理原样转正了 Switch 的半开门，决策记录里一次没提 className。检查单第 1、2 条是必做项，不是风格建议 |
| “那是既有行为，可能有调用方依赖覆盖语义” | 覆盖掉内部接线不是兼容性，是 bug。wiring prop 必须解构串联（第 3 条），发现同款问题顺手按同款修 |
| “函数 className 反正没人用” | 它是 RAC 文档的头号演示用法（Tab 页就是例子），且类型公开承诺了它 |
| “直接改 primitives 里那一行更快” | 改一个字节 = 毁掉 `--dry-run identical` 的上游漂移信号 + 钉死测试红。修 seam、修 cn，或 fork |
| “类型上先放宽，运行时以后再说” | 半开门（类型许函数、运行时吞掉）是全审计里最危险的一类。类型和运行时必须同时说实话 |

## Red flags —— 出现就停手回查

- 写了 `Omit<…, 'className'>` 却没想清楚是哪条路由逼你收窄的
- `{...props}` 后面没有任何内部 handler，但组件明明有内部接线
- `ComponentProps<typeof X>` 直接当公开 props 用而没查 ref / 泛型丢没丢
- 想给 vendored 文件加一行 / 改一个类型
- tsc 在 vendored 文件里报 className 赋值错 —— 那是 misroute 信号，处理方式见上，不是 `as` 掉
