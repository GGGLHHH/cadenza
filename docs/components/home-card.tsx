'use client'

import type { ReactElement, ReactNode } from 'react'
import SpotlightCard from '@/components/reactbits/SpotlightCard'
import { cn } from '@/lib/utils'

/**
 * 首页卡片:鼠标在卡内移动时,一团光晕跟着走。
 *
 * 光晕颜色走 CSS 变量,不走 `useTheme()`。按 resolvedTheme 三元选色试过一版,
 * 结果是稳定的 hydration 不匹配 —— SSR 期 resolvedTheme 是 undefined,渲出
 * 亮色那套,客户端首帧已经知道是暗色,两边的 style 对不上。变量定义在
 * globals.css,亮暗由 color-mix 自动换算,服务端客户端渲出的是同一个字符串。
 *
 * 断言是因为 vendored 的 SpotlightCard 把 spotlightColor 的类型写成了模板
 * 字面量 `rgba(${number}, ...)`,容不下 var()。放宽它就得改 vendored 文件,
 * 那更贵 —— 值本身是合法 CSS,radial-gradient 吃得下。
 */
const SPOTLIGHT = 'var(--home-spotlight)' as `rgba(${number}, ${number}, ${number}, ${number})`

export function HomeCard({ className, children }: {
  className?: string
  children: ReactNode
}): ReactElement {
  return (
    <SpotlightCard
      className={cn('rounded-xl border bg-card', className)}
      spotlightColor={SPOTLIGHT}
    >
      {children}
    </SpotlightCard>
  )
}
