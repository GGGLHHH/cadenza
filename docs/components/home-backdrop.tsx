'use client'

import type { ReactElement } from 'react'
import LightRays from '@/components/reactbits/LightRays'
import { useMediaQuery } from '@/lib/use-media-query'

/**
 * Hero 背后从顶部斜射下来的光柱,鼠标横向移动时光束会跟着偏。
 *
 * 配色写死成暗色一套,因为首页整页锁死暗色(见 components/theme-provider.tsx)。
 * 这里**不能**去读 `resolvedTheme` —— next-themes 的 forcedTheme 只覆盖 DOM,
 * 那个值一直反映用户自己的偏好,用户偏好亮色时它返回 'light',在一个黑底页面
 * 上就会挑出深色光柱,等于什么都看不见。
 *
 * 颜色只能给 hex:LightRays 的 hexToRgb 是 `#rrggbb` 正则,站里的 oklch token
 * 经 Lightning CSS 还会变成 lab(),从 CSSOM 读回来它一个都不认。
 * saturation 压到 0:这束光是白的,不该带色。
 *
 * 两处几何都是被硬边逼出来的:mask 收掉 620px 处的下边缘;`inline-screen`
 * + 居中位移把自己从父容器的 `max-inline-[1100px]` 里挣出来铺满视口 ——
 * 不这么做,光柱两侧会各留一条竖直切边,一眼看出是个贴上去的方块。
 * 页面容器那边配了 `overflow-x-clip`,免得这 100vw 撑出横向滚动条。
 */
export function HomeBackdrop(): ReactElement | null {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)')

  // 只挡 reduced-motion,不挡触屏:光柱本身就是一幅静态构图,鼠标跟随只是
  // 加分项,没有指针时它照样成立
  if (reduced)
    return null

  return (
    <div
      aria-hidden
      className="
        pointer-events-none absolute inset-s-1/2 inset-bs-0 -z-10
        -translate-x-1/2 mask-[linear-gradient(to_bottom,black_45%,transparent)]
        opacity-40 block-155 inline-screen
      "
    >
      <LightRays
        raysOrigin="top-center"
        raysColor="#ffffff"
        raysSpeed={0.8}
        lightSpread={1.1}
        rayLength={1.6}
        followMouse
        mouseInfluence={0.12}
        saturation={0}
        noiseAmount={0.06}
        distortion={0.02}
      />
    </div>
  )
}
