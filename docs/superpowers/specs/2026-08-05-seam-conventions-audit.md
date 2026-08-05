# seam 全量对齐审计(收口)

2026-08-05。前三轮(`ac4ba84` 协议/命名/context、`bbd955e` Select 打样、
`6d44672` 默认在场、`7fb80d3` 面板动画)都是**逐家族**推进的;本轮反过来,拿
skill `base-ui-conventions` 对 `packages/ui/src/components` 的 13 个文件做一次
全量对照,找的是「没进过流程的文件」和「机械扫不出来的签名细节」。

## 扫法

先跑 skill 里的红旗 grep(`show*`/`is*` 布尔、`?: ReactNode` 第二内容通道、
`data-x={cond || undefined}`、`use(Ctx)?.`、createContext↔displayName 配对、
data-slot 覆盖、`Omit<>` 理由),**全清**;再逐文件读公开面。偏差全部落在
grep 扫不到的地方——这本身是结论的一部分:机械检查只挡得住已知词形,
挡不住「这个文件根本没人对齐过」。

## 判定与处置

| 位置 | 违反 | 处置 |
| --- | --- | --- |
| `scroll-area.tsx` | §1.3 类型导出 / §1.2 平铺命名 | 全库唯一没有公开 props 类型的组件(内联匿名),补 `ScrollAreaProps` / `ScrollAreaScrollbarProps`;`ScrollBar`(shadcn 裸名)→ `ScrollAreaScrollbar`(Base UI 的部件名是 `ScrollArea.Scrollbar`) |
| `loading-overlay.tsx` | §1.1 裸形容词 | `isLoading` → `loading`。适配器豁免只覆盖「整体 spread 的 react-query 字段」,这个组件从不接 spread |
| `infinite-select.tsx` | §4 第二参 | `useInfiniteSelectSelection().onValueChange` 的 `eventDetails?` 改必填 |
| `search-field.tsx` | §4 commit 详情 | `onSubmit(value)` → `(value, eventDetails)`,generic 详情、无 `cancel()` |
| 两处私有 context | §1.1 词形不向内传染 | `DataTableState` / `InfiniteSelectState` → `*StateContextValue`,字段 `{ empty, error }`;顺手删掉两个字段:`isFetchingNextPage` 零消费者、DataTable 的 `isLoading` 同样 |
| `SelectContext.hasValue` / `InfiniteSelectContextValue.hasItems` | §1.1 自造 `has` 前缀 | 都 → `filled`(Base UI Field 词表里「有值/有内容」的裸词)。同一 context 里的 `hasNextPage` / `isFetchingNextPage` **保留**:那是适配器契约字段的原样转发,自定义 part 读了还要还给同一个适配器,注释已标明边界 |

## 三条教训

1. **豁免面要写边界,不然会渗**。「react-query 词形」的豁免本是为了
   `<DataTable {...list} />` 一次 spread,却顺着数据流渗进了独立组件的 prop 和
   私有 context 的字段名。豁免条款现在多一句:不接 spread 的组件不在豁免面里。

2. **回调槽和命令式 setter 的第二参不是一回事**。`onXxxChange` 是要交给别人
   当回调槽的,喂它的一方永远传详情,签名可选就是替调用方开一条「有时没有」
   的路;`setValue`/`clear` 由使用方主动调,给默认详情反而正是在履行「第二参
   永远存在」。两者混为一谈会把对的也改错。

3. **自建 prop 与宿主原生 handler 同名 = 类型相交,不是覆盖**。
   `SearchFieldProps` 从 `ComponentProps<'div'>` 起手,自带一个 `onSubmit`,
   于是类型变成 `SubmitEventHandler<HTMLDivElement> & ((value, details) => void)`
   ——旧的一参签名恰好能满足两边,补上第二参才炸。根组件解构走、永不落到元素上
   的自建 prop,名字要进 `Omit` 名单。这条已写进检查单第 2 项。

## 结果

177 单测全绿(`onSubmit` 一例改成断言 generic 详情:reason `'keyboard'`、
event 是真 `KeyboardEvent`、**没有** `cancel`),tsc ×3、lint 0 error、
build + publint 干净。文档同步:loading-overlay / search-field / scroll-area
三页 props 表,infinite-select 与 data-table 的标记部件说明,两个 demo。
