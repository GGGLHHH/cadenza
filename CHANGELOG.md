# Changelog

All packages of this repository share one version. Each section is written at release time from the commits since the previous tag, by `pnpm release` (see bump.config.ts).

## v0.9.0

[compare changes](https://github.com/GGGLHHH/cadenza/compare/v0.8.0...v0.9.0)

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

### 🚀 Enhancements

- **ui:** Animate the picker popovers with animate-ui ([cf13639](https://github.com/GGGLHHH/cadenza/commit/cf13639))
- **ui:** Move dialog, alert dialog and tooltip onto animate-ui ([2426305](https://github.com/GGGLHHH/cadenza/commit/2426305))
- **ui:** Move select, combobox, dropdown menu and cascader onto animate-ui ([79dbc89](https://github.com/GGGLHHH/cadenza/commit/79dbc89))
- **ui:** Animate the collapsible panel with animate-ui ([cf02741](https://github.com/GGGLHHH/cadenza/commit/cf02741))
- **ui:** ⚠️  Move tabs onto animate-ui's indicator and panel motion ([2c0b784](https://github.com/GGGLHHH/cadenza/commit/2c0b784))
- **ui:** Move the form controls onto animate-ui ([64aef6d](https://github.com/GGGLHHH/cadenza/commit/64aef6d))
- **ui:** Give the time-column cells animate-ui's press ([843614e](https://github.com/GGGLHHH/cadenza/commit/843614e))
- **ui:** Give infinite select animate-ui's highlight and checks ([8703f92](https://github.com/GGGLHHH/cadenza/commit/8703f92))
- **ui:** ⚠️  Open InfiniteCombobox in animate-ui's combobox popup ([f469c03](https://github.com/GGGLHHH/cadenza/commit/f469c03))
- **ui:** Stagger in the rows a load-more appends ([d45e5b6](https://github.com/GGGLHHH/cadenza/commit/d45e5b6))
- **ui:** Give input otp animate-ui's glyph, ring and ripple motion ([d28967a](https://github.com/GGGLHHH/cadenza/commit/d28967a))
- **ui:** Give every button animate-ui's press ([5397703](https://github.com/GGGLHHH/cadenza/commit/5397703))
- **ui:** Hold the button press long enough for a tap to show ([8afdfbf](https://github.com/GGGLHHH/cadenza/commit/8afdfbf))
- **ui:** Echo a too-short press on every animate-ui press ([bc363ce](https://github.com/GGGLHHH/cadenza/commit/bc363ce))
- **ui:** Stretch a tapped switch's thumb like a held one ([0e58298](https://github.com/GGGLHHH/cadenza/commit/0e58298))
- **ui:** Serve animate-ui's animated icons at @gedatou/cadenza-ui/icons ([a8292aa](https://github.com/GGGLHHH/cadenza/commit/a8292aa))
- **ui:** Draw every icon in the library from the animated set ([07a78bf](https://github.com/GGGLHHH/cadenza/commit/07a78bf))
- **ai:** Draw the view's icons from the animated set ([d80a339](https://github.com/GGGLHHH/cadenza/commit/d80a339))
- **ui:** Draw sixteen more shapes the animated set lacks ([a5b162e](https://github.com/GGGLHHH/cadenza/commit/a5b162e))
- **ui:** Publish avatar, breadcrumb, card, label, popover and separator ([b9ff630](https://github.com/GGGLHHH/cadenza/commit/b9ff630))
- **ui:** Build the sidebar on animate-ui's sidebar primitive ([deb5477](https://github.com/GGGLHHH/cadenza/commit/deb5477))
- **ui:** Fade scroll areas with animate-ui's scroll fade ([c0a46a5](https://github.com/GGGLHHH/cadenza/commit/c0a46a5))
- **ui:** ⚠️  Jump to any page from DataPagination ([74e1da2](https://github.com/GGGLHHH/cadenza/commit/74e1da2))
- **ui:** Publish AvatarGroup on animate-ui's avatar group ([8a778eb](https://github.com/GGGLHHH/cadenza/commit/8a778eb))
- **icons:** Publish the animated icons as @gedatou/cadenza-icons, drawn from data ([590cd53](https://github.com/GGGLHHH/cadenza/commit/590cd53))

### 🩹 Fixes

- **ui:** Refuse to open a pending select in the seam ([7fa8e0d](https://github.com/GGGLHHH/cadenza/commit/7fa8e0d))
- **ui:** Build select items on animate-ui's item and indicator ([5194441](https://github.com/GGGLHHH/cadenza/commit/5194441))
- **ui:** Build dropdown menu rows on animate-ui's items ([8a0e912](https://github.com/GGGLHHH/cadenza/commit/8a0e912))
- **ui:** Swap the select trigger's label with animate-ui's value ([6dfb699](https://github.com/GGGLHHH/cadenza/commit/6dfb699))
- **ui:** Use animate-ui's combobox input in infinite select ([7632c4b](https://github.com/GGGLHHH/cadenza/commit/7632c4b))
- **ui:** Keep transform out of the buttons' css transition ([4a78686](https://github.com/GGGLHHH/cadenza/commit/4a78686))
- **ui:** Keep transform out of the toggles' css transition ([453ba70](https://github.com/GGGLHHH/cadenza/commit/453ba70))
- **ui:** Measure the switch thumb's rest width when the press starts ([2b2c534](https://github.com/GGGLHHH/cadenza/commit/2b2c534))
- **ui:** Keep the press off parts animate-ui renders without one ([89fd3ae](https://github.com/GGGLHHH/cadenza/commit/89fd3ae))
- **ui:** Keep infinite select and cascader rows from covering each other's text ([cdfae3c](https://github.com/GGGLHHH/cadenza/commit/cdfae3c))
- **ui:** Lift the collapsible panel's clip once it settles open ([3ecfe69](https://github.com/GGGLHHH/cadenza/commit/3ecfe69))
- **ui:** Fix the type errors in ScrollFade and the arrival ref ([372ef6c](https://github.com/GGGLHHH/cadenza/commit/372ef6c))
- **docs:** Square the stacked code blocks in the preview card ([8a686d0](https://github.com/GGGLHHH/cadenza/commit/8a686d0))

### 💅 Refactors

- **ui:** Replay a too-short press through animate-ui itself ([ee1325c](https://github.com/GGGLHHH/cadenza/commit/ee1325c))

### 📖 Documentation

- Note that motion comes from animate-ui and its licence ([32af849](https://github.com/GGGLHHH/cadenza/commit/32af849))
- Add the animated icons page ([d5b60e2](https://github.com/GGGLHHH/cadenza/commit/d5b60e2))
- Draw every icon on the site from the animated set ([08c5a68](https://github.com/GGGLHHH/cadenza/commit/08c5a68))
- Add the sidebar page with shadcn's examples and the sidebar blocks ([3cc2ad8](https://github.com/GGGLHHH/cadenza/commit/3cc2ad8))
- Fade the site's scrollers and document the new fade ([f346822](https://github.com/GGGLHHH/cadenza/commit/f346822))
- Add the avatar page ([eaf634c](https://github.com/GGGLHHH/cadenza/commit/eaf634c))
- Move the site's copy button, theme toggle and search onto animate-ui ([88c72d4](https://github.com/GGGLHHH/cadenza/commit/88c72d4))
- Give ScrollFade a page of its own ([15e7cc5](https://github.com/GGGLHHH/cadenza/commit/15e7cc5))
- Import the icons from @gedatou/cadenza-icons ([7eb3650](https://github.com/GGGLHHH/cadenza/commit/7eb3650))

### 📦 Build

- **deps:** Bump @base-ui/react to 1.9 and motion to 14 ([156876c](https://github.com/GGGLHHH/cadenza/commit/156876c))
- **deps:** Bump input-otp to 1.5 for animate-ui's peer range ([c006f80](https://github.com/GGGLHHH/cadenza/commit/c006f80))
- **deps:** Meet animate-ui's peer ranges for @shadcn/react and react-aria-components ([24e3daa](https://github.com/GGGLHHH/cadenza/commit/24e3daa))
- Write the changelog from the commits at release time ([860e928](https://github.com/GGGLHHH/cadenza/commit/860e928))
- **deps:** Add @floating-ui/react for the avatar group and animate-ui to the docs ([c6a8827](https://github.com/GGGLHHH/cadenza/commit/c6a8827))

#### ⚠️ Breaking Changes

- **ui:** ⚠️  Move tabs onto animate-ui's indicator and panel motion ([2c0b784](https://github.com/GGGLHHH/cadenza/commit/2c0b784))
- **ui:** ⚠️  Open InfiniteCombobox in animate-ui's combobox popup ([f469c03](https://github.com/GGGLHHH/cadenza/commit/f469c03))
- **ui:** ⚠️  Jump to any page from DataPagination ([74e1da2](https://github.com/GGGLHHH/cadenza/commit/74e1da2))
