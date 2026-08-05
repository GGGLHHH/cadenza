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

`Key` / `Selection` / `SortDescriptor` 现在是本库自己的类型（结构不变），
不再从 `react-aria-components` 再导出。

### 全面对齐 Base UI 习惯（第二批，同版发布）

对 `@base-ui/react@1.7.0` 源码逐条实证调查后，行为、命名、context 习惯全面对齐
（规范固化在仓库 skill `base-ui-conventions`）：

**协议**

- **change 回调统一 `(value, eventDetails)`**：第二参永远存在，形状与 Base UI 同构
  （`reason` / `event` / `cancel()` / `allowPropagation()`）。`cancel()` 是真协议——
  内部状态写入前检查，取消即跳过。reason 复用 Base UI 词表（`input-change` /
  `clear-press` / `escape-key` / `item-press`…），表格自造 `sort-press` /
  `select-all-press` 两词。通知型不带 cancel（`onSortChange` 是 generic details——
  排序全受控，没有可取消的内部状态）。`createChangeEventDetails` /
  `ChangeEventDetails` 从包根导出
- **受控空值改用 `null`**：`undefined` 专属「非受控」，受控性首渲染锁定
  （切换在 DEV 下 `console.error`）。`InfiniteSelect` / `InfiniteCombobox` /
  `DataTable` 单选清空从 `value={undefined}` 改为 `value={null}`，
  单选 `onChange` 的空参数从 `undefined` 改为 `null`
- **data-\* 布尔一律空串**（`data-pending=""`，Base UI 值形），不再写 `"true"`。
  自建组件根新增 `data-loading` / `data-empty` / `data-error`（DataTable、InfiniteSelect）
- **表单序列化**：`InfiniteSelect` / `InfiniteCombobox` 新增 `name`——有 name 才渲染
  隐藏 input（多选每值一个；combobox 渲染在触发器旁、弹层外，草稿不序列化）
- **context 缺失统一抛** `cadenza-ui: XxxContext is missing. …`；
  `SearchFieldInput` 等部件在 provider 外从「静默死件」改为抛错

**改名（第二批）**

| 0.3.0-pre | 0.3.0 |
| --- | --- |
| `SearchField.onChange` / `onClear` | `onValueChange`（清除并入 `reason: 'clear-press' \| 'escape-key'`） |
| `SearchFieldClearButton` | `SearchFieldClear` |
| `SearchFieldRenderProps` | `SearchFieldState` |
| `InfiniteSelect.onInputChange` | `onInputValueChange`（透传 Base UI details） |
| `InfiniteSelectSearch` | `InfiniteSelectInputGroup`（词表词：icon+input 的输入组） |
| `InfiniteSelectClearButton` / `ConfirmButton` | `InfiniteSelectClear` / `InfiniteSelectClose`（具名动作不带 Button 后缀；「关闭并提交」= Close） |
| `InfiniteCombobox.lockScroll` | `modal` |
| `Tab` / `TabList` / `TabPanel` / `TabIndicator` | `TabsTab` / `TabsList` / `TabsPanel` / `TabsIndicator`（Base UI 平铺名 `<Family><Part>`；`tabListVariants` → `tabsListVariants`） |
| `DataTableColumn.isRowHeader` / `allowsSorting` | `rowHeader` / `sortable`（0.2 里最后两个 React Aria 词形） |
| `DataPagination.showLimitChanger` | 移除——`limitOptions={[]}` 用缺席表达（全库无 `show*` 布尔） |
| `Button.loading` | 移除，只留 `pending`（单词单义，无别名对） |
| `LoadingOverlay.isLoading` | `loading`（裸形容词。适配器豁免只覆盖「整体 spread 的 react-query 字段」，这个组件从不接 spread） |
| `ScrollBar` | `ScrollAreaScrollbar`（平铺名 `<Family><Part>`；Base UI 的部件就叫 `ScrollArea.Scrollbar`） |
| `SelectContent` / `SelectContentProps` | `SelectPopup` / `SelectPopupProps`（弹出内容在 Base UI 词表里叫 Popup；`$B/select/` 下只有 popup/positioner/portal，没有 content。Content 专指「被移入弹层的内容容器」） |
| `DataTable` / `InfiniteSelect` / `InfiniteCombobox` 的 `onChange` | `onValueChange`（受控三件套 `value`/`defaultValue`/`onValueChange`；裸 `onChange` 专属原生 DOM 元素。与 `useInfiniteSelectSelection()` 早已使用的名字对齐） |

**其他**

- `SelectProps` 改为泛型别名 `SelectProps<Value, Multiple>`——之前经
  `ComponentProps` 实例化，`onValueChange` 的值类型退化
- 保留不动（有意）：react-query 适配面的 `isLoading` / `isFetchingNextPage` /
  `hasNextPage` / `isError`（换取 `{...list}` 整体 spread，成文豁免——**边界就是
  适配器 props**，内部 context 与 `LoadingOverlay` 都已换回裸形容词）；
  `SelectLabel` 的词义冲突（shadcn 继承，注释已澄清）

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

- **修:弹层开着时点 `FieldLabel` 会「关掉又打开」**(闪烁)。标签指向的正是自家
  触发器,不该算「外部按下」——Base UI 在弹层外按下就关(`outside-press`,同一次
  手势松手时还有 `cancel-open`),而浏览器随即把标签的 click 转发给触发器、触发器
  再翻转一次。封装层把这两个关闭 `cancel()` 掉(判据:`label.control === 触发器`,
  隐式包裹的 `<label>` 一并覆盖),让转发的 click 独自完成开合。真正的外部点击
  照常关闭。`InfiniteCombobox` 早有同款处理,这次是 Select 补齐
- **默认在场(三态)成为家法,Select 打样**:不写 children,根组件用 `items`
  渲染完整默认组合(触发器+回显+清除+弹层+选项)。分组形态的 `items` 拍平渲染
  (Base UI 用法:该形态只喂标签解析,渲染分组是组合词汇——`SelectGroup`/
  `SelectLabel` 手写,DEV 下有警告指路);
  `SelectTrigger` 不给 children 也自动含 `SelectValue` 与清除。新增根 props:
  `placeholder` / `aria-label` / `clearable`(默认 `true`,总开关——`false`
  连显式组合的 `SelectClear` 一并关掉)。写了 children 的层完全归使用方
- **新增 `SelectClear`**：写进 `SelectTrigger`，有值时 ✕ 替换 chevron 的位置,
  点击清空(单选 `null` / 多选 `[]`,`reason: 'clear-press'`)且不开弹层;
  空值 / disabled / readOnly 不渲染。标记部件——HTML 禁止 button 套 button,
  封装层把它提升为触发器的兄弟真 `<button>`(在 Tab 序里,清除的唯一键盘路径)。
  为此封装层的 `Select` 根接管了值状态(对 Base UI 永远受控),非受控用法也能清;
  `onValueChange` 的 reason 并入 `'clear-press'`(`SelectChangeEventReason`)
- **新增 `SelectEmpty`**:与选项并排写进 `SelectPopup`,列表无选项时自动现身
  (`:only-child` 纯 CSS)。走隐式分组时零约束;手写组时:数据为空别渲染空组壳
- **`SelectGroup` 可省略**:`SelectPopup` 检测不到组时自动包一层隐式分组
  (列表内边距住在组上,之前不写组会贴边)。写了自己的组就完全不干预
- **两个默认值在封装层翻转**：`modal` 默认 `false`（Base UI 默认 `true`——打开
  即锁页面滚动与外部交互），`alignItemWithTrigger` 默认 `false`（Base UI/shadcn
  默认 `true` 的 macOS 式选中项对齐，关掉就是普通贴边下拉）。两者都仍是普通
  prop，传入即恢复上游行为。注意上游的滚动锁条件是
  `alignItemWithTrigger || modal`——两个都关才真正不锁滚动
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

- `TabsPanel` 的 DOM 现在标 `data-slot="tabs-panel"`(此前落地的是 vendored 的
  `tabs-content`——shadcn 的 Radix 时代用词,库内零消费者)
- **修:组合在 Fragment 里的 `TabsViewport` 检测不到**,会被再包一层。让位检测改用
  全库统一的 `findComposedPart`(它会看穿 Fragment),不再手写 `child.type ===`
- **`TabsIndicator` 默认在场**(默认在场家法):`TabsList` 自动渲染滑动指示器
  ——这就是本库 tabs 的长相;`indicator={false}` 关掉,自己组合一只则默认让位
- **修复:`orientation="vertical"` 之前从未真正生效**——vendored 层(shadcn
  base-nova)的根把 `orientation` 解构成纯视觉的 `data-orientation` 属性,
  **从不传给 Base UI**:纵向的 `aria-orientation`、方向键换轴(↑/↓)、
  activation direction 一直全坏,列表竖排只是 CSS 恰好读了那个手写属性。
  seam 现在直渲 Base UI Root(vendored 那行类照抄并注明手工同步),
  纵向语义全部就位,回归测试钉住
- **面板交叉滑动默认在场**:Base UI 官方 animated-panels 同款参数
  (opacity 175ms / translate 350ms cubic-bezier(0.22,1,0.36,1)、±50% 行程、
  进出相反)。官方要求手写 viewport 容器,这里根组件隐式代劳——连续的
  TabsPanel 子元素自动收进新部件 **TabsViewport**(同格 grid 叠放 + overflow
  裁剪),布局零跳动。三态:不写→默认;自己写 TabsViewport→结构归你;
  viewport={false}→回退免容器的进场微滑。位移过渡写在 translate 属性上
  (Tailwind v4 的位移类设的是它,写 transform 会变瞬跳,浏览器实测钉住)
- **默认激活方式反了**：Base UI 默认手动（方向键只移焦点，Enter/Space 才切换）。
  依赖旧默认的地方在 `TabList` 上显式加 `activateOnFocus`
- `items` + 函数 children 的动态集合形态消失，改用普通 `.map()`
- `useTabsState` 和 `TabsContext` 移除。`TabIndicator` 现在渲染在 `TabList` 内部
  （Base UI 的 List 原样渲染 children），仍然跟随悬停 → 焦点 → 选中

### SearchField

- **修:给 `SearchFieldInput` 传 `onChange` 会冻死输入框** —— 内部的文本接线写在
  `{...props}` 前面,被调用方的同名 handler 顶掉,受控值再也不动。现在与
  `onKeyDown` 一样串联在 spread 之后
- **新增 `clearable` 总开关**(默认开):`false` 连显式组合的 `SearchFieldClear`
  一并关掉;Escape 清空是输入框自己的键盘语义,不受它管
- 根元素是纯 `<div>`，`className` 收窄成 `string`。状态走 `data-empty` /
  `data-disabled` / `data-readonly`
- 函数 children 的状态从 `{ isEmpty, isDisabled, isReadOnly }` 改成
  `{ empty, disabled, readOnly }`
- **`onSubmit` 补第二参**:`(value, eventDetails)`,`SearchFieldSubmitEventDetails`
  是 generic 详情(`reason: 'keyboard'`,无 `cancel()`——提交不写内部状态,
  没有可跳过的东西)。同时 `onSubmit` 加入根 props 的 `Omit` 名单:根是 `<div>`,
  与原生同名 handler 相交会要求回调同时满足两个签名(旧的一参签名恰好蒙混过关)

### InfiniteSelect / InfiniteCombobox

- **修:非受控用法每次渲染都误报「defaultValue 变了」** —— seam 把 `defaultValue`
  规范化成数组时每帧新建引用,受控守卫按引用比较就一直响,顺带让面板 context 的
  `useMemo` 恒失效。现在身份稳住了
- `InfiniteSelectActionsProvider` 去掉 `@internal` 标记:文档一直教人在「不用便利层、
  自己组弹层」时用它,它本来就是公开的
- **裸 `InfiniteSelect` 补默认组合**(默认在场家法):不写 children 渲染
  `InfiniteSelectInputGroup` + `InfiniteSelectList`,新增根 prop `searchPlaceholder`;
  写了 children 整条通道归使用方
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
- `useInfiniteSelectSelection()` 返回的 `onValueChange` **第二参改必填**：它是回调槽
  （交给 Base UI 的 `Combobox.Root`，那边永远传详情），不是命令式 setter。自己驱动时
  用 `createChangeEventDetails('none')` 构造

### DataTable

- **修:可点的行现在能用键盘触达**(`tabIndex` + Enter/Space 走与点击同一条路径)。
  `selectionColumn` 默认关,此时点行是唯一的选中手势 —— 只认鼠标等于把键盘用户
  挡在门外,也与文件头「每个可交互部件都是真控件」的承诺相悖
- **修:`DataTableLoadingMore` 传 `ref` 会顶掉翻页哨兵的观察器**(React 19 里
  `ref` 是普通 prop),现在合并而非替换;哨兵行同时补上注释里早就承诺的
  `aria-hidden`,读屏不再把它数成一条数据行
- **换一批行自动回到行区顶部**：点「下一页」不再把上一页的滚动偏移套在新数据上
  （实测:每页 50、滚到 1020px 翻页,原本停在第 2 页的第 26 行)。表格看不到页码,
  判据是**首行 id**——翻页 / 换每页条数 / 排序 / 搜索会变(回顶),无限滚动追加与
  原地刷新不变(不动)。只归零纵向,横向偏移留着(列没变)。`InfiniteSelect`
  的列表同规则
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

- `viewportClassName` / `viewportStyle` 放宽成 Base UI 的 `(state) => …` 形态:
  viewport 是 Base UI 部件,状态里的 `scrolling` 与四个溢出方向标志正是 scroll-fade
  要读的东西(旧注释说「viewport 没有 Base UI 状态可依赖」,那句是错的)
- `viewportRender` 移除：它只为 React Aria 的 `Virtualizer` 存在（那个虚拟化器要求
  集合元素本身就是滚动器），TanStack Virtual 不需要，零调用方
- **补上类型导出** `ScrollAreaProps` / `ScrollAreaScrollbarProps`：根组件此前是全库
  唯一没有公开 props 类型的组件（内联匿名类型，业务层包一层拿不到）

### 修掉的两处视觉回归

迁移过程中悄悄丢了选中行的底色，两处成因不同，都不报错：

- `styles.css` 的 `@custom-variant data-selected` 只匹配 `[data-selected="true"]`
  （React Aria / cmdk 的写法），而 **Base UI 把布尔状态属性写成空字符串**。它是那一组
  变体里唯一缺第二条分支的。于是 `Combobox.Item` 上的 `data-selected:` 工具类全是死 CSS
- `DataTable` 的行写 `data-selected`，但 base-nova 的 `TableRow` 只样式化
  `data-[state=selected]`（Radix 词汇，随 shadcn 预设继承而来），两边对不上

## 0.2.1

见 git 历史。
