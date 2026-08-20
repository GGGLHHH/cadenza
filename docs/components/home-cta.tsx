'use client'

import type { ReactElement } from 'react'
import { LinkButton } from '@gedatou/cadenza-ui'
import { useParams } from 'next/navigation'
import { getDictionary } from '@/lib/dictionary'
import { localizedHref } from '@/lib/i18n'

const REPO = 'https://github.com/GGGLHHH/cadenza'

/**
 * 首页是 RSC,不能直接 import cadenza-ui —— dev 下 next.config 把库 alias 到源码
 * 换 Fast Refresh,而源码不是每个文件都带 'use client'(统一 banner 只在 dist 上)。
 * 这个文件就是客户端边界,顺带按 CopyButton 的惯例从 useParams 取 lang 自查文案,
 * 不逐条穿 props。首页自己的 CTA 用库里的 LinkButton,而不是手搓一套按钮样式。
 */
export function HomeCta(): ReactElement {
  const { lang } = useParams<{ lang: string }>()
  const { cta } = getDictionary(lang).home

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <LinkButton href={localizedHref(lang, '/docs')}>{cta.start}</LinkButton>
      <LinkButton
        href={localizedHref(lang, '/docs/components/button')}
        variant="outline"
      >
        {cta.components}
      </LinkButton>
      <LinkButton href={REPO} rel="noreferrer" target="_blank" variant="ghost">
        {cta.github}
      </LinkButton>
    </div>
  )
}
