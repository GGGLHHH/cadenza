# @gedatou/cadenza-ui

## 0.3.0

**底座从 React Aria Components 换成 [Base UI](https://base-ui.com)。** 视觉不变
（shadcn 的 nova 预设，`aria-nova` → `base-nova`），三层架构、`cn` 的函数 className
契约、`data-slot` 约定全部保留。`react-aria-components` 不再是依赖。

```bash
pnpm add @gedatou/cadenza-ui   # 不用再装 react-aria-components
```

### 全库通用的改名

props 的方言整体换了 —— 这不是我们的选择，是 Base UI 的词汇：

| 0.2 | 0.3 |
| --- | --- |
| `onPress` | `onClick` |
| `isDisabled` | `disabled` |
| `isReadOnly` | `readOnly` |
| `isPending` / `isLoading`（Button） | `pending` / `loading` |
| `selectedKey` / `onSelectionChange`（Select / Tabs） | `value` / `onValueChange` |
| `id`（集合条目的 key） | `value` |
| 状态 render props `{ isSelected }` | `{ selected }` |

两个**故意没改**的例外，都在 `DataTableColumn` 上：`isRowHeader` 和 `allowsSorting`。
它们是列描述符的字段，名字如实描述行为，改名换不来正确性——只换来一致性。
上面那张表只管控件的 props。

`Key` / `Selection` / `SortDescriptor` 现在是本库自己的类型（结构不变），
不再从 `react-aria-components` 再导出。

### Button

- `pending` 在 Base UI 里没有对应概念，由封装层重新组装：`disabled` +
  `focusableWhenDisabled`（写 `aria-disabled` 而非原生 `disabled`，焦点不丢）、
  pending 期间把 `type="submit"` 改写成 `"button"`、挂 `aria-busy`
- **丢了 React Aria 的 assertive 补播报** —— 它需要一个 live-region 单例，
  而且没有新内容可播（本库的 Spinner 是装饰性的，基座不塞任何语言的文案）
- **丢了状态 render props 和 `data-hovered` / `data-pressed` / `data-focused`**。
  交互态回到 CSS 伪类（`hover:` / `active:` / `focus-visible:`），
  原生 `<button>` 上它们覆盖全部输入模态
- `LinkButton` 改走 `nativeButton={false}` + `render={<a>}`；禁用时**连 `href` 一起摘掉**
  （光有 `aria-disabled` 的链接仍能从右键菜单打开）

### Select

- **误选那个 bug 由上游修好了**（Base UI 的 400ms 按住 / 8px 拖动双轴），
  封装层那套 `PRESS_GRACE_ATTRIBUTE` 守卫和配套的 styles.css 规则整个删除。
  该导出随之消失
- **标签通道从两条并成一条**：触发器是真 `<button>`，原生 `<label for>` 既给它命名，
  又由浏览器转发点击打开弹层。**升级时把那个多余的 `aria-label` 删掉**
- **`SelectValue` 不看选项列表**：要在触发器上显示标签而不是原始值，
  给根组件一张 `items` 映射表，或用 `<SelectValue>{value => …}</SelectValue>`。
  这是升级时最容易踩的一条
- `SelectPopover` / `SelectList` / `SelectEmpty` / `allowsEmptyCollection` /
  `renderEmptyState` 全部移除。空态就是普通 JSX，而且空集合的 Select 照样能打开
  （0.2 里 react-stately 在 `open()` 就挡住了）

### Tabs

- **默认激活方式反了**：Base UI 默认手动（方向键只移焦点，Enter/Space 才切换）。
  依赖旧默认的地方在 `TabList` 上显式加 `activateOnFocus`
- `items` + 函数 children 的动态集合形态消失，改用普通 `.map()`
- `useTabsState` 和 `TabsContext` 移除。`TabIndicator` 现在渲染在 `TabList` 内部
  （Base UI 的 List 原样渲染 children），仍然跟随悬停 → 焦点 → 选中

### SearchField

- 根元素是纯 `<div>`，`className` 收窄成 `string`。状态走 `data-empty` /
  `data-disabled` / `data-readonly`
- 函数 children 的状态从 `{ isEmpty, isDisabled, isReadOnly }` 改成
  `{ empty, disabled, readOnly }`

### InfiniteSelect / InfiniteCombobox

- 底座换成 Base UI 的 `Combobox`（`inline` 模式），虚拟化换成 TanStack Virtual
- `InfiniteCombobox.isDisabled` → `disabled`，函数 children 拿到的 `isDisabled` → `disabled`，
  `useInfiniteComboboxState` 的 `isOpen` → `open`（`defaultOpen` / `onOpenChange` 本来就对）
- `InfiniteSelectOption.isDisabled` → `disabled`
- **`InfiniteSelectOption.textValue` 移除**：它是 RAC collection builder 的打字定位字段，
  Base UI 这条路上没有读者。过滤在服务端（`filter={null}`），本来就没有客户端 typeahead
- **`renderItem` 参数里的 `highlighted` 移除**：它永远是 `false`——高亮是 Base UI 自己的，
  渲染期读不到。真正的入口是行上的 `data-highlighted`
- `InfiniteCombobox` 的 `closeOnScroll` 移除（Base UI 的弹层跟随锚点，不因滚动关闭）；
  `popoverProps` 换成 Base UI 的定位面（`side` / `sideOffset` / `align`）
- `virtualized` / `rowHeight` 从 `InfiniteSelectList` **移到根组件**（Base UI 也要知道
  行不全在 DOM 里）
- `renderItem` 的参数改成 Base UI 的词汇：`{ item, option, index, selected, disabled, selectionMode }`
- 终止行、加载指示、翻页哨兵移出 listbox 元素 —— 不再是 `role="option"`，
  `getAllByRole('option')` 数到的就是真实行
- 单选点已选中项**不再取消选中**（Base UI 的语义，同原生 `<select>`）；清空走底栏的清除动作

### DataTable

- 底座换成**原生 `<table>`**：排序入口是真 `<button>`（所在 `<th>` 带 `aria-sort`），
  行选择是真复选框，行头是 `<th scope="row">`
- **丢了 `role="grid"` 和方向键单元格导航** —— 这是本次迁移唯一一处明确的无障碍退步。
  键盘走 Tab 遍历表内的可聚焦控件，与 shadcn / Radix 生态的表格一致
- 点击行的路由规则简化成一条：有 `onRowAction` 就触发动作；没有它、也没有
  `selectionColumn`、但开了 `selectionMode` 时切换选中；其余什么都不做
- 新增 `selectAllLabel` / `selectRowLabel`（复选框的无障碍名，英文兜底）
- **表头默认固定**：`maxHeight` 从「无默认」改为默认 `480`（是上限不是高度，
  短表不受影响）。sticky 需要行区自己是滚动容器，没有上限时表头会跟着页面滚走。
  传 `maxHeight={Infinity}` 恢复无上限
- 表格直接渲染裸 `<table>`，不再经过 shadcn `Table` 那层 `overflow-x-auto` 容器 ——
  两层嵌套滚动容器正是 sticky 失效的原因
- `defaultSelectedKeys` 移除

### ScrollArea

- `viewportRender` 移除：它只为 React Aria 的 `Virtualizer` 存在（那个虚拟化器要求
  集合元素本身就是滚动器），TanStack Virtual 不需要，零调用方

### 修掉的两处视觉回归

迁移过程中悄悄丢了选中行的底色，两处成因不同，都不报错：

- `styles.css` 的 `@custom-variant data-selected` 只匹配 `[data-selected="true"]`
  （React Aria / cmdk 的写法），而 **Base UI 把布尔状态属性写成空字符串**。它是那一组
  变体里唯一缺第二条分支的。于是 `Combobox.Item` 上的 `data-selected:` 工具类全是死 CSS
- `DataTable` 的行写 `data-selected`，但 base-nova 的 `TableRow` 只样式化
  `data-[state=selected]`（Radix 词汇，随 shadcn 预设继承而来），两边对不上

## 0.2.1

见 git 历史。
