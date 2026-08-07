'use client'

import type { ReactElement } from 'react'
import { IconMoon, IconSun } from '@tabler/icons-react'
import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'

// 空订阅:服务端快照恒 false、客户端快照恒 true,水合完成后自动翻转一次。
const emptySubscribe = (): (() => void) => () => {}

export function ModeSwitcher(): ReactElement {
  const { resolvedTheme, setTheme } = useTheme()
  // 主题只在客户端可知,首帧渲染占位避免水合不一致
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

  return (
    <button
      type="button"
      className="
        inline-flex items-center justify-center rounded-md text-foreground
        transition-colors block-8 inline-8
        hover:bg-muted
        [&_svg]:block-4.5 [&_svg]:inline-4.5
      "
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      <span className="sr-only">切换主题</span>
      {mounted && (resolvedTheme === 'dark' ? <IconMoon /> : <IconSun />)}
    </button>
  )
}
