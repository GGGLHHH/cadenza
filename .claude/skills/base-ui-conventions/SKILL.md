---
name: base-ui-conventions
description: Use when adding, promoting, or modifying components in packages/ui — naming props/parts/types, designing data-* state attributes, change callbacks (eventDetails), contexts, form serialization, or touching className / ref / data-slot handling in a seam file. Also when a caller-passed prop seems to "overwrite" internal behaviour, or a function className silently does nothing.
---

# Base UI 习惯法(cadenza seam 家法)

2026-08 逐条实证调查 `@base-ui/react@1.7.0` 源码后固定(源码路径:
`packages/ui/node_modules/@base-ui/react/`,下称 `$B`)。目标只有一个:
**seam 自建组件(SearchField、DataTable、InfiniteSelect/Combobox、DataPagination、
LoadingOverlay)必须伪装成 Base UI 家族成员——公开 API 上分不出谁是原生谁是自建。**
拿不准一条规则时,不要猜:去 `$B` 里抽 3 个组件看源码。

## 三层架构(地基,不变)

| 层 | 是谁的 | 规则 |
| --- | --- | --- |
| `src/primitives/`、`src/hooks/` | shadcn 的(base-nova 预设) | **一个字节都不许改**。`vendored-sources.test.ts` 钉死哈希;`pnpm test -u` 只许在合法 re-pull(`shadcn add -o`)后跑 |
| `src/components/` | 我们的 seam | 公开面在这里定形:改名、收窄、包装、修类型,全在 seam 做 |
| `src/lib/utils.ts` 的 `cn` | 我们的 | **契约守门人**:`cn` 组合函数 className(见 §3),vendored 文件不改也能兑现 Base UI 契约 |

## 1 词汇层

### 1.1 props 命名

- **布尔一律裸形容词/名词**:`disabled` `required` `readOnly` `multiple` `modal`
  `open` `inline` `virtualized`。禁止 `is`/`has`/`should`/`show` 前缀。
  全库无任何 `show*` 布尔——「要不要渲染 X」用组合表达(部件不写就不渲染),
  或用值 prop 的缺席表达,不开渲染开关。
- `is` 前缀只属于**谓词函数** props(`isItemEqualToValue`):is = 「这是个返回布尔的函数」。
- 抑制默认行为用 `disableX`;放开默认限制用 `allowX`(原形动词、无三单 s:`allowWheelScrub`);
  事件触发的行为开关用 `<动词>On<事件>`(`openOnInputClick`)。
  普通能力布尔既不是解限也不是抑制,用裸形容词(列可排序 = `sortable`,不是 `allowSorting`)。
- **受控三件套** `x / defaultX / onXChange`,回调名里的 X 与受控 prop **全名**一致:
  `inputValue` → `onInputValueChange`(不是 `onInputChange`)。
  裸 `onChange` 永不用作自定义回调名——它专属原生 DOM 元素。
- **单词单义,无别名对**(`pending`/`loading` 这类二选一,别都留)。
- ref 类 props 叫 `<名词>Ref`(`inputRef`、`actionsRef`);命令式句柄类型叫 `<Part>Actions`
  (`SelectRootActions { unmount }`)。actionsRef 只给有 popup 卸载生命周期的组件。
- 锁页面滚动/阻挡外部交互的 prop 叫 `modal`($B/select/root/SelectRoot.d.ts:83-90),不是 lockScroll。
- **成文豁免(唯一)**:react-query 数据适配面——`InfiniteSelectAdapterProps` / DataTable
  同形字段(`isLoading`/`isFetchingNextPage`/`isError`/`hasNextPage`)刻意镜像 react-query,
  换取 `<DataTable {...list} />` 整体 spread。边界:**仅限 adapter 契约字段**;
  任何新 prop、render/state 参数、data 属性一律 Base UI 词形。

### 1.2 部件分类学

- 平铺命名 `<Family><Part>`:`SearchFieldInput`、`TabsTab`(不是 `Tab`)、`InfiniteSelectList`。
  家族前缀不许省——省了就是别人的词(`Tab` 是 Base UI tabs 的领域名)。
- 词表(全部实证自 `$B` 的 58 个组件目录):
  - **锚定弹层固定三层** `Portal → Positioner → Popup`(+可选 Arrow);
    居中/贴边覆盖层(dialog/drawer)无 Positioner,是 `Portal → Backdrop + Popup`。
    Backdrop 只出现在能 modal 的组件;tooltip/toast 永远没有。
  - 页内展开内容叫 **Panel**(tabs/accordion/collapsible);弹出内容叫 **Popup**;
    「被移入弹层的内容容器」才叫 Content(navigation-menu/drawer)。
  - 值显示叫 **Value**;分组 = **Group + GroupLabel**;可选中列表的行内钩叫 **ItemIndicator**;
    异步列表状态槽叫 **Status** 和 **Empty**;多实例全局服务叫 **Provider**;
    icon+input 的输入组叫 **InputGroup**,纯输入框叫 **Input**。
  - **具名动作按钮用角色词、不带 Button 后缀**:`Clear`、`Close`、`Action`、
    `Increment`/`Decrement`、`ChipRemove`。「关闭并提交」的语义就是 **Close**。
  - 部件本身是领域名词时用名词,不硬套机械名(`TabsTab` 不是 `TabsTrigger`)。
- 已知词义冲突(继承 shadcn,已注释,**不再新增**):本库 `SelectLabel` 是分组标题
  (Base UI 语境的 GroupLabel)。自建组件的分组标题一律叫 `GroupLabel`。

### 1.3 类型导出(用户拍板 2026-08)

- **平铺通道**:`XxxProps` + `XxxState`。有 state 的部件**必导 State 类型**
  (Base UI 连空 State 都导,因为函数 className 的签名需要它)。
  render/children 函数看到的状态类型就叫 `XxxState`,不叫 RenderProps。
  不维护 namespace 双通道(shadcn 层惯例,与 Base UI 平铺通道兼容)。
- **泛型不得在 seam 退化**:`ComponentProps<typeof X>` 会把泛型实例化掉。
  泛型组件用泛型别名转发:`SelectProps<Value, Multiple> = SelectPrimitive.Root.Props<…>`。
- 复用别家部件时类型 re-alias 成自家家族名(Base UI 的 alert-dialog 模式:
  `DialogBackdropProps as AlertDialogBackdropProps`)。

## 2 状态外化(data-* 协议)

来源:`$B/internals/getStateAttributesProps.mjs`(逐行验证过)。

- **布尔 true → `data-x=""`(空串存在型),false → 属性不出现**。
  React 写法统一走 `dataAttr(cond)`(src/lib,返回 `'' | undefined`),
  禁止手写 `|| undefined`(那会渲染 `"true"`,与 Base UI 值形分叉)。
- 非布尔枚举/数值走值型:`data-side="top"`、`data-index="3"`。
  判据:会被 CSS 当**独立状态钩子**用的状态机枚举,拆成名称型存在属性
  (`data-starting-style`/`data-ending-style`,不是 `data-status="starting"`);
  描述几何/方向的用值型。
- **反面态要被样式化时用互补存在对**:`data-open`/`data-closed`、
  `data-valid`/`data-invalid`(校验态为 null 时两者都缺席);
  无样式需求的反面不写属性。
- **交互态 hover/active/focus-visible 走 CSS 伪类,不写 data 属性**。
  Base UI 全库仅四个例外,各有跨部件传播的硬理由(`data-highlighted` 虚焦点、
  `data-pressed` 按住开弹层、`data-focused` Field 状态机、`data-hovering` scroll-area)。
  自建组件不得发明 `data-hover`/`data-focus`。
- **根组件把逻辑态外化**:loading/empty/error 这类 CSS 摸不到的状态写
  `data-loading`/`data-empty`/`data-error`(空串存在型)到根,壳层样式走 CSS 变体,
  不搞 JS/CSS 双通道。
- Field 词表(`disabled`/`valid`/`invalid`/`touched`/`dirty`/`filled`/`focused`)是
  Base UI 最大公共词表(34+ 部件同名重复);自建表单控件要进 Field 生态就写同名属性。
- styles.css 的宽容 `@custom-variant`(`[data-x]:not([data-x="false"])`)**保留**——
  vendored primitives 还在写值型布尔(改不得);但 seam 自己只产空串。

## 3 state 函数契约与合并语义

- 每个渲染 DOM 的 Base UI 部件都支持 `className`/`style`/`render` 的 `(state)=>` 形态
  (`$B/internals/types.d.ts` 的 BaseUIComponentProps,无部件级豁免)。
  seam 包装时**透传原类型**(`ComponentProps<typeof X>['className']`),不窄化;
  底座是纯 div 的组件诚实标 `string` 并在 JSDoc 说明。
- **cn 是守门人**:clsx 静默吞函数,本库 `cn` 遇函数参数返回延迟组合函数。
  照常 `cn(base, className)`,但结果只能落在 Base UI 的 className 槽位;
  灌进普通 DOM 元素 tsc 会拦(cn 返回类型是诚实的条件类型),别 `as` 绕。
  vendored 文件自己 misroute 时(现存两例 accordion/combobox):tsconfig `exclude` + 注释,提升前先 fork。
- state 对象字段裸形容词:`selected` `highlighted` `disabled` `open`(不是 isSelected)。
- **children 函数不是 `(state)=>` 契约**——参数是领域 payload
  (SearchField 的 `{ empty, … }`、ProgressValue 的 `(formattedValue, value)`),
  不必硬套 className(state) 的 state 形状。
- mergeProps 语义(seam 手写合并时必须复刻,源:`$B/merge-props/mergeProps.mjs`):
  普通 prop 右侧(用户)赢;事件 handler 双方都跑、用户先跑;
  className 只拼接不覆盖;render 元素自己的 props 最右赢,唯 ref 强制用合并后的。

## 4 受控协议与 eventDetails(用户拍板:完整复刻)

- **受控判定首渲染锁定** `value !== undefined`,永不改判;DEV 下切换受控性、
  或非受控中途改 defaultValue,console.error 警告(`@base-ui/utils/useControlled.mjs` 语义,
  已对齐进 packages/utils 的 useControllableState)。
  **`undefined` 专属「非受控」;受控空值用 `null`**(不是 undefined、不是 key-presence)。
- **change 回调统一 `(value, eventDetails)`**。eventDetails 与 Base UI 同构
  (src/lib 的 createChangeEventDetails,对照 `$B/internals/createBaseUIEventDetails.mjs`):
  `{ reason, event, cancel(), allowPropagation(), isCanceled, isPropagationAllowed }`。
  **第二参永远存在**——程序性变更也构造 `reason: 'none'`,没有「有时是 undefined」的路径。
- **cancel 是真协议**:内部包装器先调用户回调,再查 `isCanceled`,取消则跳过内部 setState
  (多层回调逐层检查)。**不真跳过就不暴露 cancel**。
- **reason 复用 Base UI 词表**(`$B/internals/reason-parts.mjs`,35 个 kebab-case:
  `trigger-press` `outside-press` `item-press` `close-press` `clear-press` `input-change`
  `input-clear` `input-blur` `escape-key` `focus-out` `none` `initial` `imperative-action` …)。
  造新词前先查这张表。
- 「完成通知」不带 details:`onOpenChangeComplete(open)` 单参;
  「提交」回调 `onValueCommitted(value, details)` 的 details 是 generic、**无 cancel**。
  change 与 commit 是两个回调,不给 onChange 塞模式 flag。

## 5 表单与无障碍缺省

- **可点部件默认渲染真 `<button type="button">`**;只有控件盒(span+隐藏input,
  如 Checkbox)和列表项(div+role,如 SelectItem)默认非 button。
  `nativeButton={false}` + `render={<a>}` 是正式逃逸口(LinkButton 模式)。
- **表单序列化(用户拍板:对齐)**:选择器类组件接 `name`,有 name 才渲染隐藏 input,
  multiple 每值一个($B/select/root/SelectRoot.mjs:372-447 模式)。Base UI 单值用
  **可聚焦的 visually-hidden input** 是为了原生 required 校验和 autofill;两者都不参与的
  组件(server-filtered 的 InfiniteSelect/Combobox)用普通 `type="hidden"` 即可,别抄没有
  读者的机械。弹层宿主的隐藏 input 必须渲染在**弹层外**(trigger 旁)——弹层关闭即卸载。
- `focusableWhenDisabled`:native button 且可聚焦 → 写 `aria-disabled` 不写 disabled 属性、
  焦点不丢;禁用时 handler 提前 return。**Button 的 pending 组装是正面样板**(button.tsx)。
- 禁用视觉走 `data-disabled:` 镜像(`pointer-events-none` 在本库是死代码——
  styles.css 全局 `pointer-events: auto` 为了显示禁止光标)。
- label 通道:seam 的 field.tsx 是 shadcn 纯 DOM 线(`htmlFor` 直连,有 base-nova 上游背书),
  与 Base UI Field context 线**不互通**;「把控件放进 Base UI Field.Root」只对
  Base UI 表单控件成立,JSDoc 必须说清这个边界。
- `required` 双写(隐藏/原生 input 的属性 + 可见元素 `aria-required`);
  invalid 由校验状态驱动,写无值 `data-invalid`,不是控件 prop。

## 6 Context 家法

- **缺 context 在守卫 hook 里抛 Error(dev/prod 都抛)**,文案统一模板:
  `cadenza-ui: XxxContext is missing. Xxx parts must be placed within <Xxx>.`
  品牌前缀 `cadenza-ui: ` 无例外(对照 Base UI 的 `Base UI: ` 前缀习惯)。
- **可选 context 三定式,禁止 `?.` 静默吞缺 Provider**:
  (a) `useXxxContext(optional)` 缺时返回 undefined;
  (b) createContext 给完整默认对象 + NOOP 哨兵字段判断有无 Provider(FieldRootContext 模式);
  (c) 简单标量 context 直接返回。
  「缺 Provider 时组件渲染成死件但不报错」没有任何先例,是 bug。
- **context value 传 Provider 前必 `useMemo`**。显式豁免:value 本身逐键变的
  (SearchFieldContext,注释已说明)——豁免要写注释,防误改也防误仿。
- **context 与 hook 默认私有**(Base UI 公共导出零 context)。
  公开一个 hook = 公共承诺,命名用 `useXxx` 短形式(shadcn useSidebar 先例);
  纯内部布线组件/Provider 标 `@internal` 且不导出。
- 每个 createContext 后跟 dev-only displayName:
  `if (process.env.NODE_ENV !== 'production') XxxContext.displayName = 'XxxContext'`。
- store 模式只属于浮层家族的高频交叉状态(Base UI 只在 dialog/menu/popover/select/toast/
  tooltip 用);seam 自建组件没有开合/定位这类状态,**不引入 store**。
- 一个 part 的多个正交状态可拆多个 context 按变更频率隔离(ComboboxRootContext 文件
  装 5 个 context 的先例),高频字段单独成 context。

## 7 封装检查单(逐项过,不许跳)

1. **className 路由审计**:底层把 caller 的 className 放到哪个元素?
   Base UI 槽位 → 函数契约自动成立;普通 DOM → 类型必须是 string。写进 JSDoc。
2. **ref 类型重述**:底座把 ref 声明在组件类型上而不是 props 里时,
   `ComponentProps<typeof X>` 会丢它。seam 补 `& RefAttributes<对应元素>`。
3. **wiring props 解构串联**:内部要接的回调必须从 props 解构、内部逻辑先跑、caller 的后跑
   (eventDetails 场景反过来:用户回调先跑、内部查 isCanceled——见 §4)。
   写在 `{...props}` 前面 = caller 一传就顶掉接线,静默失效。
4. **data-slot**:每个部件最外层标 `data-slot="kebab-名"`。例外要有契约理由并注释。
5. **禁用态走 data 属性镜像**(见 §5)。
6. **集合组件保泛型**(见 §1.3)。
7. **组合通道只有 children,按位置**。禁止 `slots?`/`content?`/`panel?` 第二 ReactNode 通道
   (`slots` 在 MUI/Base UI 语境是组件替换表,同名不同义)。
   触发器+浮层封装照 DialogTrigger 位置契约:第一个 child 是触发器。
   类型写 `ReactNode | ReactNode[] | ((state) => ReactElement)`,`ReactNode[]` 必须显式。
8. **配置 vs 内容**:数字/枚举/布尔/无障碍名走 prop;调用方要写 JSX 的走组合通道
   (原地渲染 → 普通插槽;位置是组件设计决定 → 标记部件 `findComposedPart` 提升);
   随状态变的内容走 render prop。看到 `xxx?: ReactNode` 出现在 props(children 除外)就停手,
   审计:`grep -rn "?: ReactNode$" packages/ui/src/components/*.tsx`——已清零,别加回去。
9. **标记部件天生带默认值**(不组合就渲染默认视觉),默认视觉一律无语言
   (Spinner/淡出细线,库不往 DOM 塞任何语言的文案);props 类型与落地元素对齐
   (`<tr>` 落地就 `ComponentProps<'tr'>`)。
   列表尾巴(终止行/加载指示/哨兵)渲染在 listbox/tbody 语义之外,不进 `aria-setsize`。
10. **默认在场(三态,用户拍板 2026-08)**:二次封装的价值主张是好默认——完整体验
    「不写就有」,忘写部件导致使用方魔改是默认值的失职,不是使用方的错。
    该默认在场的部件对使用方有三态:**不写 → 默认在场;写 → 定制;显式关闭 → 消失**。
    落点分两层裁量(A+B):
    - **默认组合层(A)**:根组件 children 可选,不给就用数据 props 渲染完整默认组合
      (SearchField 首创;Select 的 `items`+`placeholder`+`aria-label` 一行式)。
      **改语义的部件**(如 clear)只住在这一层和显式组合里,由裸形容词能力开关驱动
      (`clearable` 默认 `true`,是总开关——`false` 连显式组合的也关),不在手写组合里隐式冒出;
      部件级默认组合同理(`SelectTrigger` 无 children → 自动 `SelectValue`+clear)。
    - **部件级隐式(B)**:**无害的结构部件**在组合路径上也自动补
      (`SelectContent` 的隐式 `SelectGroup`)。检测用 `findComposedPart`,
      检测到使用方自己写了就完全让位,绝不双包。
    - 零文案部件(`SelectEmpty` 这类内容槽)不能默认——库不写任何语言的文案。
    - 默认组合渲染数据时**只用 Base UI 已示范的读法**:分组形态的 items 拍平
      (Base UI 的 resolveValueLabel 就是 flatMap),渲染分组是组合词汇,
      默认组合不代写 `SelectGroup`/`SelectLabel`。
    - 写了 children 的层完全归使用方(忘写部件也不补),没写的层保持默认——
      「逐层接管」,不是全有或全无。

## 常见错误(基线实测)

| 错误/借口 | 事实 |
| --- | --- |
| 提升时只复刻模板,不审计契约 | 检查单 1、2 条是必做项,不是风格建议 |
| 「那是既有行为,可能有人依赖覆盖语义」 | 顶掉内部接线不是兼容性,是 bug。按 §7.3 修 |
| 「函数 className 反正没人用」 | 它是 Base UI 文档常规用法,类型公开承诺了它 |
| 「直接改 primitives 那一行更快」 | 改一字节 = 毁上游漂移信号 + 钉死测试红。修 seam、修 cn,或 fork |
| 「类型先放宽,运行时以后再说」 | 半开门(类型许函数、运行时吞掉)是最危险一类,类型和运行时同时说实话 |
| 「data-x={cond \|\| undefined} 反正 CSS 能匹配」 | 渲染成 "true",与 Base UI 空串值形分叉。走 dataAttr |
| 「回调加个 boolean flag 区分来源」 | 来源属于 eventDetails.reason,词表里挑,不开新参数 |

## Red flags —— 出现就停手回查

- 新 prop 名里有 is/has/should/show 前缀,而它不是谓词函数、也不在 adapter 豁免面里
- `onXxxChange` 的 Xxx 与受控 prop 名对不上
- 回调第二参缺失,或有时传有时不传
- 暴露了 cancel() 但内部 setState 前没查 isCanceled
- `use(XxxContext)` 后面跟着 `?.`
- 写了 `Omit<…, 'className'>` 却说不清是哪条路由逼的
- `{...props}` 后面没有任何内部 handler,但组件明明有接线
- `ComponentProps<typeof X>` 直接当公开 props 用,没查 ref/泛型丢没丢
- 在 Base UI 的开放形状(`[key: string]: unknown`)里自选键名,而没查官方 demo 用的哪个键
  (先例:Group 的标题键是 `value`——`{ value: 'Fruits', items }`,不是 label)
- 想给 vendored 文件加一行/改一个类型
