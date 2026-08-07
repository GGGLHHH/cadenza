# Stepper 设计

日期：2026-08-07
状态：已批准（形态参考 originui-ng stepper-05）

## 背景与目标

需要一个分步（stepper）组件。API 参考 <https://www.originui-ng.com/stepper>（Angular 移植版，其
API 形状来自上游 Origin UI），形态以 **stepper-05** 为准：横向数字指示器 + 分隔线，受控用法，
trigger 可点跳步，完成态打 ✓，异步前进时当前步 indicator 显示 Spinner。

Base UI 没有 stepper，vendored primitives（61 个文件）里也没有——本组件是 **seam 纯自建组合组件**
（SearchField 谱系），不存在转出 / cast / 薄包 / fork 的候选对象。词形按 base-ui-conventions
家法翻译：originui 的 `data-state="active|completed"` 值型枚举拆成 `data-active` / `data-completed`
空串存在对；`valueChange` 输出翻成受控三件套 + eventDetails。

## API 面

部件 7 个，平铺命名，全部渲染纯 DOM（div/button/span/h3/p），`className` 诚实标 `string`：

| 部件 | 底座 | props（`ComponentProps<元素>` 之外） |
|---|---|---|
| `Stepper` | `div` | `value` / `defaultValue`（number，1 起）/ `onValueChange(value, eventDetails)`；`orientation: 'horizontal' \| 'vertical' = 'horizontal'`；`steps?: number`（默认组合）；`loading?: boolean`（只喂默认组合的 item） |
| `StepperItem` | `div` | `step`（必填 number）、`completed?`、`disabled?`、`loading?` |
| `StepperTrigger` | `button type="button"` | —（点击跳到本步；item 禁用则原生 disabled） |
| `StepperIndicator` | `span` | children 替换空闲内容（默认 step 数字）；✓ 与 Spinner 覆盖层是部件自己的语义，由 data 态驱动 |
| `StepperSeparator` | `div aria-hidden` | — |
| `StepperTitle` | `h3` | — |
| `StepperDescription` | `p` | — |

类型导出：`StepperProps` / `StepperItemProps` / … 全套平铺；`StepperChangeEventReason =
'trigger-press' | 'none'`、`StepperChangeEventDetails`。context 与守卫 hook 私有，缺失时抛
`cadenza-ui: XxxContext is missing. …` 模板文案。

## 行为规范

- **受控协议**：`useControllableState`（首渲染锁定）；`onValueChange` 先跑、查 `isCanceled`
  再写内部 state（cancel 是真协议）。第二参永远存在。
- **派生态**（StepperItem 计算，经 item context 下发）：
  - `active = value === step`
  - `completed = completedProp || value > step`（不夹逼、不越界裁剪，对齐 originui）
  - `loading = loadingProp && active`（stepper-05 语义：只有当前步转 Spinner）
- **data-\***：root 写 `data-orientation`（值型，方向）；item 写 `data-active` / `data-completed`
  / `data-disabled` / `data-loading`（`dataAttr` 空串存在型）；trigger 镜像 `data-disabled`。
  部件样式全部经 `group/stepper`、`group/stepper-item` 从这两处读，不再逐部件重复镜像。
- **默认组合（家法 §7.10 A 层）**：`<Stepper steps={4} />` 不写 children 时渲染 stepper-05 结构
  （每步 `Item > Trigger > Indicator` + 步间 `Separator`，非末项 `flex-1`）。写 children 全归
  使用方；`steps` / root `loading` 只喂默认组合（SearchField `placeholder` 先例）。
- **a11y**：trigger 是真按钮，active 时 `aria-current="step"`；separator `aria-hidden`；
  Indicator 默认数字对 SR 可读，Spinner 传 `aria-hidden`（宿主自己的状态通道优先，
  spinner.tsx JSDoc 约定）；库不写任何语言文案。
- **不做**：`linear` 模式、Title/Description 进默认组合、函数 className / State 类型
  （纯 DOM 底座，状态全部走 data-*，CSS 摸得到）。

## 交付物

1. `packages/ui/src/components/stepper.tsx` + `src/index.ts` 导出；
2. `packages/ui/test/stepper.test.tsx`：默认组合渲染与派生态、trigger-press 受控回调 +
   reason、cancel() 拒改、loading 只落在 active 步；
3. `docs/content/docs/components/stepper.mdx` + demos（按 writing-component-docs 规范，
   含 stepper-05 复刻 demo）。
