'use client'

import { usePathname } from 'next/navigation'
import { i18n } from '@/lib/i18n'

/**
 * 当前是不是首页。首页强制暗色(见 components/theme-provider.tsx),
 * 是全站唯一有这个待遇的路由。
 *
 * 判断按**浏览器地址**来,不是 proxy 内部 rewrite 后的路径:hideLocale 之下
 * 中文首页就是 `/`,英文是 `/en`。别写成 `/zh` —— 那个路径会被 proxy 弹回。
 */
export function useIsHome(): boolean {
  const pathname = usePathname()
  return pathname === '/' || i18n.languages.some(lang => pathname === `/${lang}`)
}
