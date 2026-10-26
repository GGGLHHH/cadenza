# @gedatou/cadenza-ui

无障碍 React 组件库：行为交给 [Base UI](https://base-ui.com)，外观用 shadcn 的 `base-nova` 预设（Tailwind v4 + cva）。

**文档与交互 demo：<https://cadenza-ui-docs.vercel.app>** —— Button、Tabs、SearchField、
InputGroup、ScrollArea、MessageScroller 与 Message / Bubble / Marker / Attachment、
DataTable、DataPagination、InfiniteSelect / InfiniteCombobox，
每页附 Props 与状态（`data-*` / render props）对照表。

## 安装

```bash
pnpm add @gedatou/cadenza-ui
pnpm add -D tailwindcss tw-animate-css
```

入口 CSS：

```css
@import "tailwindcss";
@import "@gedatou/cadenza-ui/styles.css";
```

`styles.css` 自带 `@source "./dist"`，Tailwind 会自动扫到组件用的类名，不用额外配置。它只提供设计 token 和组件依赖的 `*` 边框重置，不会去动你的 `body` 或字体。

组件动画由 [animate-ui](https://animate-ui.com)（基于 [Motion](https://motion.dev)）驱动，作为依赖随包自动安装，
不用另外装。animate-ui 采用 **MIT + Commons Clause** 许可：可以用在应用、网站和产品里（含商用），
但不得原样再分发或出售它的组件本身。

## 用法

```tsx
import { Button, LinkButton } from '@gedatou/cadenza-ui'

export function Toolbar() {
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => console.log('clicked')}>
        Save
      </Button>
      <LinkButton variant="link" href="/docs">文档</LinkButton>
    </>
  )
}
```

`variant`、`size` 之外的 props 全部透传给对应的 Base UI 组件（`onClick`、`disabled`、`render` 等）。

落在 Base UI 槽位上的 `className` 支持函数形式 ——
`className={({ selected }) => …}`，参数就是各组件文档页状态表里的那组状态。

## 动画图标

`@gedatou/cadenza-ui/icons` 提供 392 个带动画的图标，来自 [animate-ui](https://animate-ui.com)
的 lucide 风格图标集，每个图标有自己的动画（铃铛摇摆、齿轮转动……），由 `AnimateIcon` 的触发方式驱动：

```tsx
import { AnimateIcon, Bell, Settings } from '@gedatou/cadenza-ui/icons'

export function Header() {
  return (
    <>
      {/* 悬停图标本身时播放 */}
      <Bell animateOnHover />
      {/* 悬停整个按钮时，里面的图标跟着动 */}
      <AnimateIcon animateOnHover>
        <button type="button">
          <Settings />
          设置
        </button>
      </AnimateIcon>
    </>
  )
}
```

这些图标派生自 animate-ui（作者 Elliot Sutton），遵循 animate-ui 的 **MIT + Commons Clause** 许可，
许可全文与来源见 [ANIMATE-UI-LICENSE.md](./ANIMATE-UI-LICENSE.md)。

## 暗色模式

`.dark` class 和 `data-theme="dark"` 两种约定都认，next-themes 之类的主题方案直接可用。

## License

[MIT](../../LICENSE.md)。`src/icons/animate-ui/` 下的动画图标除外，它们遵循 animate-ui 的许可，见 [ANIMATE-UI-LICENSE.md](./ANIMATE-UI-LICENSE.md)。
