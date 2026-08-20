'use client'

import type { ReactElement } from 'react'
import { IconMoon, IconSun } from '@tabler/icons-react'
import { useTheme } from 'next-themes'
import { useParams } from 'next/navigation'
import { useSyncExternalStore } from 'react'
import { getDictionary } from '@/lib/dictionary'

// 空订阅:服务端快照恒 false、客户端快照恒 true,水合完成后自动翻转一次。
const emptySubscribe = (): (() => void) => () => {}

export function ModeSwitcher(): ReactElement | null {
  const { lang } = useParams<{ lang: string }>()
  const { forcedTheme, resolvedTheme, setTheme } = useTheme()
  // 主题只在客户端可知,首帧渲染占位避免水合不一致
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

  // 主题被这一页锁死时(首页就是),setTheme 改不动落到 DOM 上的主题 ——
  // 留个按得动却不生效的开关比没有开关更糟。判断条件是「被强制了」而不是
  // 「这是首页」:哪一页要锁死是 theme-provider 的事,这里不必知道
  if (forcedTheme !== undefined)
    return null

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
      <span className="sr-only">{getDictionary(lang).themeToggle}</span>
      {mounted && (resolvedTheme === 'dark' ? <IconMoon /> : <IconSun />)}
    </button>
  )
}
