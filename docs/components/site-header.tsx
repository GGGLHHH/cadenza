import type { ReactElement } from 'react'
import Link from 'next/link'
import { CommandMenu } from '@/components/command-menu'
import { ModeSwitcher } from '@/components/mode-switcher'

export function SiteHeader(): ReactElement {
  return (
    <header className="
      sticky inset-bs-0 z-50 border-be bg-background inline-full
    "
    >
      <div className="
        mx-auto flex items-center gap-4 px-4 block-(--header-height) inline-full
        max-inline-[1400px]
        lg:px-8
      "
      >
        <Link
          href="/docs"
          className="flex items-center gap-2 text-base font-semibold"
        >
          Cadenza
        </Link>
        <nav className="
          flex items-center gap-4 text-sm font-medium text-muted-foreground
        "
        >
          <Link
            href="/docs"
            className="
              transition-colors
              hover:text-foreground
            "
          >
            文档
          </Link>
          <Link
            href="/docs/components/data-table"
            className="
              transition-colors
              hover:text-foreground
            "
          >
            组件
          </Link>
        </nav>
        <div className="ms-auto flex items-center gap-2">
          <CommandMenu />
          <ModeSwitcher />
        </div>
      </div>
    </header>
  )
}
