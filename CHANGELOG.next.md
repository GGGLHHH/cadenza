### ⚠️ 升级须知

这一版把 `@gedatou/cadenza-ui` 的动效底座整体换成了 [animate-ui](https://animate-ui.com)：弹层的进出场、条目的滑块、按钮的按压、图标都来自它。下面这些改动会影响现有代码。

**删掉的 API**

| 原来 | 现在 |
| --- | --- |
| `TabsViewport` / `TabsViewportProps` / `Tabs` 的 `viewport` | 删除，panel 不再需要容器 |
| `DataPagination` 的 `firstPageLabel` / `lastPageLabel` | 删除，首页、末页按钮也一起去掉了，改成可以直接点的页码 |
| `SelectPopup` / `ComboboxPopup` 的 `render`，`InfiniteCombobox` 的 `popoverProps.render` | 删除，这个元素由 animate-ui 的 Motion 渲染。`popoverProps` 新增了 `transition` / `exitTransition` |

**行为变化**

- `DataPagination` 默认不再显示 `3 / 13` 这段文字，传了 `pageIndicator` 照样显示。
- `TabsIndicator` 改用 Base UI 自带的 `Tabs.Indicator`：没有样式，位置由 `--active-tab-*` 变量决定，不再跟随 hover 和焦点。只要你自己写了一个，animate-ui 的自动指示器就会关闭。
- `InfiniteCombobox` 的弹层改成了 Combobox popup：
  - `InfiniteComboboxOpenChangeEventReason` 换成了 Base UI Combobox 的那一套 reason；
  - 函数形式 `contentClassName` 收到的 state 从 `PopoverPopupState` 变成了 `ComboboxPopupState`；
  - 弹层比按下操作晚一拍挂载。
- 库里的图标全部换成了 animate-ui 的动画图标，外观会有细微差别。图标是新的独立包 `@gedatou/cadenza-icons`（`pnpm add @gedatou/cadenza-icons`）：每个图标以 `XxxIcon` 一个名字导出（props 类型 `XxxIconProps`），默认对读屏隐藏，传 `aria-label` 则不隐藏。

**类型收紧**

各种 Picker 的 `Trigger` / `Clear`、`InputGroupButton`、`SearchFieldClear` 的 `className` 现在只接受字符串。以前类型上允许传函数，但运行时 cva 会把函数吞掉，连 variant 的类名也一起丢掉。所以只有原本就不生效的写法会编译失败，改用 Base UI 写出的 `data-*` 属性来写样式即可。

**依赖**

- 新增 `@animate-ui/react`。它的许可证带 Commons Clause：可以作为依赖使用，但不能把它本身拿去销售。
- `motion` 从 ^13 升到 ^14（animate-ui 的要求）。如果你的项目还在用 motion 13，就会同时装上两份 motion，你自己的 `MotionConfig`（比如 `reducedMotion`）管不到本库的组件，建议一起升到 14。
- `@base-ui/react` 从 ^1.7 升到 ^1.9。
- 新增 `@floating-ui/react`：新发布的 `AvatarGroup` 用到的 animate-ui tooltip 依赖它。
