# @gedatou/cadenza-icons

414 个带动画的图标：392 个来自 [animate-ui](https://animate-ui.com) 的 lucide 风格图标集，每个有自己的动画（铃铛摇摆、齿轮转动……）；
另外 22 个是 animate-ui 没有的图形，取自 [Tabler](https://tabler.io/icons)，配 animate-ui 通用的描边绘制。播放由 `AnimateIcon` 的触发方式驱动。

```bash
pnpm add @gedatou/cadenza-icons
```

```tsx
import { AnimateIcon, BellIcon, SettingsIcon } from '@gedatou/cadenza-icons'

export function Header() {
  return (
    <>
      {/* 悬停图标本身时播放 */}
      <BellIcon animateOnHover />
      {/* 悬停整个按钮时，里面的图标跟着动 */}
      <AnimateIcon animateOnHover>
        <button type="button">
          <SettingsIcon />
          设置
        </button>
      </AnimateIcon>
    </>
  )
}
```

- 每个图标一个模块、`sideEffects: false`：只用到的图标会进包，其余的会被摇掉。
- 每个图标只有一个名字 `XxxIcon`，props 类型是 `XxxIconProps`。
- 默认对读屏隐藏（`aria-hidden`）；传 `aria-label`、`aria-labelledby` 或 `role` 时不隐藏。
- 依赖 `@animate-ui/react` 与 `motion`，peer 是 `react` / `react-dom` 19。

[@gedatou/cadenza-ui](../ui) 的组件用的就是这套图标。完整文档见 [Icons](https://cadenza-ui-docs.vercel.app/docs/components/icons)。

## 维护

- `pnpm --filter @gedatou/cadenza-icons sync:icons`：从 animate-ui 的 shadcn 注册表重新拉取，转换成本包的数据形式
  （图形与动画参数，由 `src/create-icon.tsx` 渲染）。转换器严格匹配图标模板，遇到模板以外的写法直接报错；
  加 `--out <dir>` 可以先输出到别处看会改什么。
- `pnpm --filter @gedatou/cadenza-icons draw:icons`：重新生成 Tabler 补形 `src/drawn.ts`。

## 许可

animate-ui 的图标遵循它的 **MIT + Commons Clause** 许可（见 [ANIMATE-UI-LICENSE.md](./ANIMATE-UI-LICENSE.md)），
Tabler 的图形是 MIT，其余部分是 MIT。详见 [LICENSE.md](./LICENSE.md)。
