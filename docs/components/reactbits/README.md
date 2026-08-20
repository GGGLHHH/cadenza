# Vendored React Bits

首页的视觉效果来自 [React Bits](https://reactbits.dev)。它跟 shadcn 一样是
copy-paste 分发，不是 npm 包 —— 所以这里放的是**原样拉下来的源码**，和
`packages/ui/src/primitives` 同一个待遇：eslint 忽略本目录（见
`eslint.config.js` 的 ignores），好让上游更新还能干净地 diff。

**别手改这里的文件。** 需要改行为、配色、降级策略，写在 `docs/components/`
的包装层里（`home-backdrop.tsx` / `home-cursor.tsx` / `home-card.tsx`），
那才是我们的代码。

## 目录

| 文件 | 来源 | 依赖 | 用在哪 |
| --- | --- | --- | --- |
| `LightRays.tsx` | `backgrounds/light-rays` | `ogl` | Hero 背景光柱，鼠标横移时光束偏转 |
| `SplashCursor.tsx` | `animations/splash-cursor` | 无 | 全屏流体，鼠标划过推开一团烟/墨 |
| `SpotlightCard.tsx` | `components/spotlight-card` | 无 | 首页卡片的鼠标跟随光晕 |

`ogl` 只为 LightRays 而装（约 30 kB）。docs 是 private 包不发布，它只进首页的
chunk。SplashCursor 虽然零依赖，但它自带一整套 Navier-Stokes 流体模拟，
41 kB 源码、每帧十几个 render pass —— 是首页最重的一件东西。

## 拉取 / 更新

```bash
npx shadcn@latest add https://reactbits.dev/r/LightRays-TS-TW -o
npx shadcn@latest add https://reactbits.dev/r/SplashCursor-TS-TW -o
npx shadcn@latest add https://reactbits.dev/r/SpotlightCard-TS-TW -o
```

registry 的 JSON（含 `dependencies` 字段）可以直接看：
`curl -s https://reactbits.dev/r/LightRays-TS-TW | jq .dependencies`。
命名是 PascalCase + `-TS-TW`（TypeScript + Tailwind 版本）。**大部分背景要
`ogl` 或 `three`**，挑之前先查这个字段。

## 我们做过的唯一改动

`SpotlightCard.tsx` 的根 className 原本硬编码了 `border-neutral-800
bg-neutral-900`（React Bits 的 demo 是纯深色站）。这个站有亮/暗两套主题，
那两个类会盖掉调用方传的 `bg-card`，所以删掉了，改由调用方给。
其余文件逐字未动。

## 两个反复踩到的点

**颜色只能给 hex。** `LightRays` 的 `hexToRgb` 是 `#rrggbb` 正则，
`SplashCursor` 的 `COLOR` 走 `hexToRGB` —— 而站里的 token 是 oklch，
Lightning CSS 还会把它编译成 `lab()`，从 CSSOM 读回来的值这些正则一个都不认。
所以包装层里两套颜色是写死的常量。

**主题色别过 `useTheme()` 去算 DOM 上的 style。** SSR 期 `resolvedTheme` 是
undefined，客户端首帧已经是暗色，React 当场报 hydration 不匹配（在
`SpotlightCard` 的 style 上踩过）。要么像 `home-card.tsx` 那样交给 CSS 变量
+ `color-mix`，要么像 `home-backdrop` / `home-cursor` 那样用 `useMediaQuery`
门控让 SSR 期整个不渲染 —— 那个 hook 走 `useSyncExternalStore`，服务端快照
恒为 false，hydration 天然一致。
