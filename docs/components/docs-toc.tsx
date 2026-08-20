'use client'

import type { ReactElement, ReactNode } from 'react'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { getDictionary } from '@/lib/dictionary'
import { cn } from '@/lib/utils'

function useActiveItem(itemIds: string[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting)
            setActiveId(entry.target.id)
        }
      },
      { rootMargin: '0% 0% -80% 0%' },
    )

    for (const id of itemIds) {
      const element = document.getElementById(id)
      if (element)
        observer.observe(element)
    }

    return () => observer.disconnect()
  }, [itemIds])

  return activeId
}

export function DocsTableOfContents({
  toc,
  className,
}: {
  toc: {
    title?: ReactNode
    url: string
    depth: number
  }[]
  className?: string
}): ReactElement | null {
  const { lang } = useParams<{ lang: string }>()
  const itemIds = useMemo(() => toc.map(item => item.url.replace('#', '')), [toc])
  const activeHeading = useActiveItem(itemIds)

  if (toc.length === 0)
    return null

  return (
    <div className={cn('flex flex-col gap-2 p-4 pbs-0 text-sm', className)}>
      <p className="text-xs font-medium text-muted-foreground block-6">{getDictionary(lang).toc}</p>
      {toc.map(item => (
        <a
          key={item.url}
          href={item.url}
          data-active={item.url === `#${activeHeading}`}
          data-depth={item.depth}
          className="
            text-[0.8rem] text-muted-foreground no-underline transition-colors
            hover:text-foreground
            data-[active=true]:font-medium data-[active=true]:text-foreground
            data-[depth=3]:ps-4
            data-[depth=4]:ps-6
          "
        >
          {item.title}
        </a>
      ))}
    </div>
  )
}
