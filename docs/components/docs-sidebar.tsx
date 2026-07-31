'use client'

import type { ReactElement, ReactNode } from 'react'
import type { source } from '@/lib/source'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

type PageTree = typeof source.pageTree
type PageTreeNode = PageTree['children'][number]

function SidebarLink({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: ReactNode
}): ReactElement {
  return (
    <Link
      href={href}
      data-active={active}
      className="
        relative flex items-center rounded-md border border-transparent px-2
        text-[0.8rem] font-medium text-foreground/80 transition-colors
        block-[30px] inline-fit
        hover:text-foreground
        data-[active=true]:border-accent data-[active=true]:bg-accent
        data-[active=true]:text-foreground
      "
    >
      {children}
    </Link>
  )
}

function SidebarNode({ node }: { node: PageTreeNode }): ReactElement | null {
  const pathname = usePathname()

  if (node.type === 'page') {
    return (
      <div className="flex flex-col gap-0.5 px-2">
        <SidebarLink href={node.url} active={node.url === pathname}>
          {node.name}
        </SidebarLink>
      </div>
    )
  }

  if (node.type === 'folder') {
    return (
      <div className="flex flex-col">
        <p className="
          px-4 pbs-6 pbe-2 text-xs font-medium text-muted-foreground
        "
        >
          {node.name}
        </p>
        <div className="flex flex-col gap-0.5 px-2">
          {node.children.map(child =>
            child.type === 'page'
              ? (
                  <SidebarLink
                    key={child.url}
                    href={child.url}
                    active={child.url === pathname}
                  >
                    {child.name}
                  </SidebarLink>
                )
              : null)}
        </div>
      </div>
    )
  }

  return null
}

export function DocsSidebar({
  tree,
  className,
}: {
  tree: PageTree
  className?: string
}): ReactElement {
  return (
    <aside
      className={cn(
        `
          sticky inset-bs-[calc(var(--header-height)+0.6rem)] z-30 hidden
          flex-col overflow-hidden
          block-[calc(100svh-var(--header-height)-1.5rem)] inline-full
          lg:flex
        `,
        className,
      )}
    >
      <div className="
        no-scrollbar flex scroll-fade-y flex-col overflow-y-auto pbs-8 pbe-12
      "
      >
        {tree.children.map(node => (
          <SidebarNode
            key={node.$id ?? (node.type === 'page' ? node.url : String(node.name))}
            node={node}
          />
        ))}
      </div>
    </aside>
  )
}
