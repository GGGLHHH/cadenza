# @gedatou/cadenza-ui

无障碍 React 组件库：行为交给 [React Aria Components](https://react-spectrum.adobe.com/react-aria/)，外观用 shadcn 的 `aria-nova` 预设（Tailwind v4 + cva）。

**文档与交互 demo：<https://cadenza-ui-docs.vercel.app>** —— Button、Tabs、SearchField、
InputGroup、ScrollArea、DataTable、DataPagination、InfiniteSelect / InfiniteCombobox，
每页附 Props 与状态（`data-*` / render props）对照表。

## 安装

```bash
pnpm add @gedatou/cadenza-ui react-aria-components
pnpm add -D tailwindcss tw-animate-css
```

入口 CSS：

```css
@import "tailwindcss";
@import "@gedatou/cadenza-ui/styles.css";
```

`styles.css` 自带 `@source "./dist"`，Tailwind 会自动扫到组件用的类名，不用额外配置。它只提供设计 token 和组件依赖的 `*` 边框重置，不会去动你的 `body` 或字体。

## 用法

```tsx
import { Button, LinkButton } from '@gedatou/cadenza-ui'

export function Toolbar() {
  return (
    <>
      <Button variant="outline" size="sm" onPress={() => console.log('pressed')}>
        Save
      </Button>
      <LinkButton variant="link" href="/docs">文档</LinkButton>
    </>
  )
}
```

`variant`、`size` 之外的 props 全部透传给对应的 React Aria 组件（`onPress`、`isDisabled`、`isPending` 等）。

落在 React Aria / Base UI 槽位上的 `className` 支持函数形式 ——
`className={({ isSelected }) => …}`，参数就是各组件文档页状态表里的 render props。

## 暗色模式

`.dark` class 和 `data-theme="dark"` 两种约定都认，next-themes 之类的主题方案直接可用。

## License

[MIT](../../LICENSE.md)
