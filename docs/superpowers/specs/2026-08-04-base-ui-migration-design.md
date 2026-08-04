# 底座迁移设计：React Aria Components → Base UI

日期：2026-08-04
分支：`feat/base-ui`
终点版本：`@gedatou/cadenza-ui@0.3.0`（breaking）

## 目标

`packages/ui/package.json` 的 `dependencies` 里不再有 `react-aria-components`。
样式、公开面的组织方式、三层架构、`cn` 契约守门人机制全部保留。

## 为什么可行

`components.json` 的 `style` 是枚举，取值形如 `<base>-<style>`，`base` ∈ {`radix`, `base`, `aria`}，
`style` ∈ {vega, nova, maia, lyra, mira, luma, sera, rhea}。我们现在是 `aria-nova`，
目标是 `base-nova`：**同样的 nova 视觉、neutral 配色、tabler 图标，只换底座**。

`shadcn add -o <name>` 是按组件的，所以 `src/primitives/` 可以一个文件一个文件从 aria
翻到 base，byte-lock（`test/vendored-sources.test.ts`）模型不破——快照里那个文件的哈希变一次而已。

实测依据（2026-08-04，scratchpad 拉了一份 base-nova 做对比）：

| primitive | aria-nova | base-nova | 差异 |
| --- | --- | --- | --- |
| `spinner` | 10 行，纯 svg | 10 行，纯 svg | 无 |
| `field` | 236 行 | 236 行 | 无（不依赖任何底座） |
| `pagination` | 124 行 | 130 行 | 无 RAC 依赖，纯 button + a |
| `table` | 138 行，依赖 RAC `Table`/`Row`/`Cell`… | 114 行，**裸 `<table>`** | 行为全丢 |
| `input-group` | 依赖 RAC `Group` | 纯 div | 极小 |
| `separator` | RAC `Separator` | Base UI `Separator` | 1:1 |
| `checkbox` | 41 行 | 29 行，Base UI `Checkbox` | 1:1 |
| `button` | 92 行，导出 `Button` `LinkButton` `buttonVariants` | 58 行，导出 `Button` `buttonVariants` | **丢 `LinkButton`** |
| `tabs` | 91 行 | 80 行，Base UI `Tabs` | 1:1，且 Base UI 自带 `Tabs.Indicator` |
| `popover` | RAC `DialogTrigger` + `Popover` | Base UI `Popover`，多出 `PopoverContent` | 部件树重排 |
| `select` | 279 行，12 个部件 | 201 行，9 个部件 | **丢 `SelectEmpty` / `SelectInput`，多出滚动箭头** |
| `scroll-area` | 25 行 | 53 行，导出 `ScrollArea` `ScrollBar` | seam 本来就直连 Base UI |
| `combobox` | — | 有 | `infinite-select` 的新底座 |

`@base-ui/react` 需要从 catalog 的 1.6.0 升到 ^1.7.0（base-nova 注册表的要求）。

## 迁移顺序

seam 之间有真实依赖，顺序不是偏好：

```
spinner ← loading-overlay ← button
select ← data-pagination
infinite-select ← infinite-combobox
```

| 阶段 | 组件 | 性质 |
| --- | --- | --- |
| 0 | 基建 | 本文档、`components.json`、catalog、自有类型词汇表 |
| 1 | `spinner` `loading-overlay` `field` `scroll-area` | 白送，验证翻转不炸 |
| 2 | `button` `input-group` | `LinkButton` 重建 |
| 3 | `tabs` | 净减，删手写指示器 |
| 4 | `select` | 形状大改 |
| 5 | `data-pagination` | 吃 4 |
| 6 | `search-field` | 自建 |
| 7 | `infinite-select` | 最大 |
| 8 | `infinite-combobox` | 吃 7 |
| 9 | `data-table` | 唯一阻断"零 RAC"的件 |
| 10 | 清场 | 删依赖、docs、CHANGELOG、0.3.0 |

`tabs`（净减）刻意排在 `select`（形状大改）之前：先用一个变简单的件把五步流程跑通，
再啃会破 API 的件。

## 阶段 0 的三件地基

### 1. 自有类型词汇表

`src/index.ts` 现在从 `react-aria-components` 再导出 `Key` / `Selection` / `SortDescriptor`。
零 RAC 之后要自己定义。

- `Key` 和 `SortDescriptor` 是机械的，阶段 0 就定。
- **`Selection` 不是。** RAC 的 `'all'` 语义（不枚举 key 也能表达全选）Base UI 没有对应概念，
  而 `DataTable` 和 `InfiniteSelect` 的公开面依赖它。这个类型拖到阶段 9 跟 `DataTable`
  一起定，在此之前保持从 RAC 再导出。

### 2. byte-lock 在混血期照常工作

不改测试。每翻一个 primitive，`pnpm test -u` 接受该文件的新哈希，commit 记录说明它换了底座。

### 3. `--dry-run` 漂移信号在混血期是废的

`components.json` 的 `style` 只有一个值。翻成 `base-nova` 之后，对**尚未迁移**的 aria 文件跑
`npx shadcn@latest add -c packages/ui <name> --dry-run` 会全部误报漂移。这是长跑分支上可接受的
临时代价，阶段 10 全部迁完后信号自动恢复正确。

## 每个组件的完成定义

五件事全绿才算切完，缺一不算：

1. `shadcn add -o <name>` 翻 primitive；`pnpm test -u` 接受新哈希
2. seam 重写，逐条过 `.claude/skills/wrapping-base-ui-components/SKILL.md` 的检查单
   （className 路由审计、ref 类型重述、wiring props 解构串联、data-slot、禁用态走 data 属性、
   集合组件保泛型）
3. 单测全绿。现有 157 个里凡是断言 RAC 行为的都要重判，不是改到过为止
4. `docs/content/docs/components/<name>.mdx` 与 `docs/demos/<name>/*` 同步改；`pnpm typecheck` 覆盖 docs
5. 浏览器实测。用 Playwright，不用 CDP 合成指针——`usePress` 会把它判成 virtual pointer 而误报

## 已知会丢的东西

现在就认下来，实施时不再争论：

| 丢的 | 替代 |
| --- | --- |
| `LinkButton` 的路由集成、`isPending` | `<a className={buttonVariants()}>`，禁用态走 `data-disabled:` 镜像 |
| `SelectEmpty` / `allowsEmptyCollection` / `renderEmptyState` | Base UI Select 无空态入口。需要空态的场景改用 Combobox 底座 |
| `DataTable` 的 `role="grid"` 与箭头键单元格导航 | 阶段 9 决策，两个候选：降级到 Tab 遍历，或自己实现 roving tabindex |
| RAC 的 `Virtualizer` / `ListLayout` | TanStack Virtual（本来就是 `data-table` 的虚拟化方案，顺带统一） |
| RAC 的 `ListBoxLoadMoreItem` | IntersectionObserver 哨兵 |

**不丢的：函数 className 契约。** Base UI 同样把 `className` 定为 `string | (state) => string`，
`src/lib/utils.ts` 的 `cn` 守门人机制原样适用。

## 实施中确认的事实（边做边补）

### 顺序被迫调整

`search-field` 从阶段 6 提到阶段 2：翻 `input-group` 的 primitive 直接打断了它
（它原本靠 RAC 的 `SearchField` context 给 `Input` 接线，而 `InputGroupInput` 变成了
Base UI 的 `Input`）。同理，翻 `button` 打断了 `infinite-combobox` 的触发器
（RAC `DialogTrigger` 的 `PressResponder` 接不上 Base UI 的 Button），那 5 个测试
一直红到阶段 8。

**教训：primitive 的依赖图决定了 seam 的迁移顺序，不是 seam 之间的依赖图。**
`button` 和 `input-group` 是最被依赖的两个，翻它们就是翻半个库。

### 公开面的词汇整体换方言

不是可选项，是 `ComponentProps<typeof X>` 直接带来的：`isDisabled` → `disabled`、
`onPress` → `onClick`、`isPending` → `pending`、`selectedKey` → `value`、
`onSelectionChange` → `onValueChange`、`id`（集合 key）→ `value`。

### 各件的实际差异

| 件 | 发现 |
| --- | --- |
| `label` primitive | 丢了 `LabelContext.Provider` 那圈包装，变成裸 `<label>` —— htmlFor 通道反而更直接 |
| `button` | Base UI 无 `isPending`。seam 用 `disabled` + `focusableWhenDisabled` 重组：`aria-disabled` 而非原生 `disabled`、submit 期间改写 `type`、`aria-busy`。**丢了 React Aria 的 assertive 补播报**（需要 live-region 单例，且没有新内容可播） |
| `button` | Base UI 无 Link。`LinkButton` 改走 `nativeButton={false}` + `render={<a>}`，禁用时连 `href` 一起摘掉 |
| `button` | 无状态 render props、无 `data-hovered/pressed/focused`。交互态回到 CSS 伪类 |
| `input-group` | 根与 textarea 变纯 DOM，`className` 诚实收窄成 string。只有 `InputGroupInput` 还是双形态 |
| `tabs` | Base UI 自带 `Tabs.Indicator`，但只跟随**选中**项。本库的指示器还要跟悬停和焦点，所以保留自写版，改成读 DOM（`[data-active]` / `:focus-visible` / 指针监听）—— 反而比读 RAC 状态 context 简单，`useTabsState` 和标记提升机制整个删掉 |
| `tabs` | **默认激活方式相反**：Base UI 默认手动（方向键只移焦点），RAC 默认自动。跟随上游 |
| `tabs` | 无集合 API，`items` + 函数 children 消失，改用 `.map()` |
| `select` | **误选 bug 上游已修**（`SELECTED_DELAY=400` + 8px 拖动）。整套 `PRESS_GRACE_ATTRIBUTE` 守卫 + styles.css 规则 + 8 个测试全部删除 |
| `select` | **标签通道从两条并成一条**：触发器是真 `<button>`，原生 `<label for>` 既命名又转发点击。不再需要第二个 `aria-label`，也不再需要 seam 里那段 `onClickCapture` |
| `select` | `SelectValue` **不看选项列表**，只认根上的 `items` 映射表。不给就印原始值 —— 这是升级时最容易踩的一条 |
| `select` | `SelectPopover` / `SelectList` / `SelectEmpty` / `allowsEmptyCollection` 消失；空态就是普通 JSX，且空集合照样能打开 |
| `combobox` primitive | 上游自己犯了 className misroute（函数 className 灌进 `cva`），已加进 tsconfig 的 `exclude`。**要用它必须先 fork** —— 阶段 7 因此直接建在 `@base-ui/react/combobox` 上，走 `scroll-area.tsx` 的先例 |

### 阶段 7 的落点已确认

Base UI 的 `Combobox.Root` 有两个正好对得上的 prop：

- `inline` + `open` —— 不用它自己的弹层，列表内联渲染。这正是 `InfiniteSelect`
  作为一个内联面板需要的形态（`InfiniteCombobox` 再把它塞进 popover）
- `virtualized` —— 外部虚拟化，自己接 TanStack Virtual

加上 `filter={null}`（我们的过滤在服务端，走 `onInputChange`）、`multiple`、
`Combobox.Empty`、`Combobox.Status`。`ListBoxLoadMoreItem` 换成 IntersectionObserver
哨兵。

## 结果（2026-08-04 完成）

十个阶段全部落地，`packages/ui/package.json` 的依赖表里已无 `react-aria-components`。

| 验证 | 结果 |
| --- | --- |
| 单元测试 | 141 / 141 |
| `pnpm lint` | 0 error，7 个既有 warning |
| `pnpm typecheck` | ui + docs + utils 全绿 |
| 浏览器实测 | 12 个文档页零 console 错误，另加四份逐阶段行为脚本 |

浏览器实测覆盖的关键行为：

- **select 误选**：0/4/10/16px 抖动的快速点击都不误选，按住拖选仍然工作
- **tabs 指示器**：初始就位、跟随悬停、移开滑回、跟随键盘焦点、悬停禁用项不动、垂直换轴，偏差全在 0.4px 内
- **infinite-select 虚拟化**：10000 条只渲染 16 行，撑高 320000px；方向键高亮时焦点仍在输入框
- **data-table**：aria-sort 翻转、表头全选 7/7、滚到底拉下一页、虚拟化 22 行 / 400040px、sticky 表头存活

### 阶段 9 的决策

**降到 Tab 遍历**（用户拍板）。排序入口是真 `<button>`、行选择是真复选框、行头是
`<th scope="row">`、`aria-sort` 说明方向。**丢掉的是 `role="grid"` 和方向键单元格导航** ——
这是整次迁移里唯一一处明确的无障碍退步，换来的是和 shadcn / Radix 生态一致的表格语义。

### 两个风险的实际情况

- **阶段 7 没有推翻计划。** `inline` + `open` + `filter={null}` + `virtualized`（外接 TanStack）
  一次就跑通了。唯一的意外是 jsdom 驱不动 TanStack 的测量循环，所以窗口大小那几条断言
  改成了「spacer 高度」（jsdom 能观测）加浏览器实测。
- **阶段 9 的决策做了**，见上。

### 顺带修掉的债

- `styles.css` 少了一整块无层级规则（select 的误选守卫）
- `tabs.tsx` 从 315 行到 208 行，`select.tsx` 从 346 行到 91 行
- 虚拟化统一到 TanStack 一家（此前 data-table 用 TanStack、infinite-select 用 RAC 的 `Virtualizer`）
- 列表的尾巴（终止行 / 加载指示 / 翻页哨兵）移出了 listbox 与 tbody 的语义之外，
  不再污染 `aria-setsize`，测试里数行也不用绕开它们了
