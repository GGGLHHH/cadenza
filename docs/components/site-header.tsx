import type { ReactElement } from 'react'
import Link from 'next/link'
import { CommandMenu } from '@/components/command-menu'
import { LocaleSwitcher } from '@/components/locale-switcher'
import { ModeSwitcher } from '@/components/mode-switcher'
import { getDictionary } from '@/lib/dictionary'
import { localizedHref } from '@/lib/i18n'

export function SiteHeader({ lang }: { lang: string }): ReactElement {
  const dict = getDictionary(lang)
  return (
    <header className="
      sticky inset-bs-0 z-50 border-be bg-background inline-full
    "
    >
      <div className="
        mx-auto flex items-center gap-4 px-4 block-(--header-height) inline-full
        max-inline-350
        lg:px-8
      "
      >
        <Link
          href={localizedHref(lang, '/')}
          className="flex items-center gap-2 text-base font-semibold"
        >
          Cadenza
        </Link>
        <nav className="
          flex items-center gap-4 text-sm font-medium text-muted-foreground
        "
        >
          <Link
            href={localizedHref(lang, '/docs')}
            className="
              transition-colors
              hover:text-foreground
            "
          >
            {dict.header.docs}
          </Link>
          <Link
            href={localizedHref(lang, '/playground')}
            className="
              transition-colors
              hover:text-foreground
            "
          >
            {dict.header.playground}
          </Link>
          <Link
            href={localizedHref(lang, '/docs/components/data-table')}
            className="
              transition-colors
              hover:text-foreground
            "
          >
            {dict.header.components}
          </Link>
        </nav>
        <div className="ms-auto flex items-center gap-2">
          <CommandMenu />
          <LocaleSwitcher />
          <ModeSwitcher />
        </div>
      </div>
    </header>
  )
}
