'use client'

import type { ReactElement } from 'react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { getDictionary } from '@/lib/dictionary'

// 判语言用 useParams(rewrite 后的路由参数),算目标 URL 用 usePathname
// (浏览器地址,默认语言无前缀)—— rewrite 场景下两者不同源,不能混用。
export function LocaleSwitcher(): ReactElement {
  const { lang } = useParams<{ lang: string }>()
  const pathname = usePathname()
  const dict = getDictionary(lang)
  const english = lang === 'en'
  const target = english
    ? pathname.replace(/^\/en(?=\/|$)/, '') || '/'
    : `/en${pathname === '/' ? '' : pathname}`

  return (
    <Link
      href={target}
      aria-label={english ? dict.header.switchToChinese : dict.header.switchToEnglish}
      className="
        inline-flex items-center justify-center rounded-md px-1.5 text-sm
        font-medium text-foreground transition-colors block-8 min-inline-8
        hover:bg-muted
      "
    >
      {english ? '中文' : 'EN'}
    </Link>
  )
}
