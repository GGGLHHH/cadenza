import type { ReactElement, ReactNode } from 'react'
import { DocsSidebar } from '@/components/docs-sidebar'
import { source } from '@/lib/source'

export default function DocsLayout({ children }: { children: ReactNode }): ReactElement {
  return (
    <div className="
      mx-auto flex flex-1 items-start px-4 inline-full max-inline-[1400px]
      lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-6 lg:px-8
    "
    >
      <DocsSidebar tree={source.pageTree} />
      <div className="block-full inline-full">{children}</div>
    </div>
  )
}
