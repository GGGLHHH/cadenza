'use client'

import type { ReactElement } from 'react'
import SplashCursor from '@/components/reactbits/SplashCursor'
import { useMediaQuery } from '@/lib/use-media-query'

/**
 * 鼠标划过时在页面上推开一团流体。原生 WebGL 的 Navier-Stokes 模拟,
 * 没有第三方依赖,但它是首页最重的一件东西 —— 每帧要跑十几个 render pass。
 *
 * 关掉了默认的 RAINBOW_MODE,固定成紫色。首页锁死暗色,所以这里也不必(更不能)
 * 去读 `resolvedTheme` —— forcedTheme 不改那个值,读它会拿到用户自己的偏好。
 * 想换回彩虹就打开 RAINBOW_MODE 并删掉 COLOR。
 *
 * 两道门跟背景那边同理,但对流体来说更要紧:
 * - reduced-motion:满屏跟着鼠标翻涌的流体正是这个设置要挡的东西
 * - pointer: fine:没有鼠标就没有「划过」,触屏上它只会白烧 GPU
 */
const SPLASH_COLOR = '#7C3AED'

export function HomeCursor(): ReactElement | null {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)')
  const finePointer = useMediaQuery('(pointer: fine)')

  if (reduced || !finePointer)
    return null

  return (
    <SplashCursor
      RAINBOW_MODE={false}
      COLOR={SPLASH_COLOR}
      TRANSPARENT
      DENSITY_DISSIPATION={4.2}
      SPLAT_RADIUS={0.14}
      SPLAT_FORCE={5200}
      DYE_RESOLUTION={1024}
    />
  )
}
