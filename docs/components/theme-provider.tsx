'use client'

import type { ReactElement, ReactNode } from 'react'
import { ThemeProvider as NextThemeProvider } from 'next-themes'
import { useIsHome } from '@/lib/use-is-home'

/**
 * 全站的主题 provider。两条规矩:**默认暗色**,以及**首页锁死暗色**。
 *
 * `defaultTheme='dark'` 是没存过偏好时的落点 —— 第一次来的人看到的是暗色,
 * 不再跟系统走。`enableSystem` 因此一并摘掉:它开着也没用,ModeSwitcher 只在
 * light / dark 之间 toggle,没有任何一条路径能再把 theme 置成 'system',
 * 留着只是个骗人的开关。真要恢复跟随系统,是把这两处一起改回去。
 *
 * `forcedTheme` 只覆盖落到 DOM 上的主题,不动用户保存的偏好 —— 所以在首页
 * 设了暗色,点进文档仍然回到人家自己选的那套,离开首页不留痕迹。
 *
 * 注意它**不会**改 `resolvedTheme`:那个值一直反映用户偏好,首页拿它去挑颜色
 * 会挑错(用户偏好亮色时它返回 'light',而页面是暗的)。所以 home-backdrop /
 * home-cursor 里的配色是写死的暗色常量,不读主题。
 *
 * 判断放在 client 组件里是因为 layout 是 RSC,拿不到当前路径;usePathname 在
 * SSR 阶段也有值,所以 next-themes 注入的那段 inline script 一并带上了
 * forcedTheme,首页不会先闪一下亮色再转暗。
 */
export function ThemeProvider({ children }: { children: ReactNode }): ReactElement {
  const isHome = useIsHome()

  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="dark"
      disableTransitionOnChange
      forcedTheme={isHome ? 'dark' : undefined}
    >
      {children}
    </NextThemeProvider>
  )
}
