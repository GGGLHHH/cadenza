import type { ReactElement, ReactNode } from 'react'

// Demo-only scaffolding. The Sidebar is sized to the viewport: the panel is
// position: fixed + h-svh, the provider min-h-svh. Inside this frame the
// transform makes the frame the panel's containing block, and the important
// utilities beat those viewport heights (the vendored classes and these are
// in different twMerge groups, so only !important settles it). A demo is then
// the shadcn example as written, wrapped in <SidebarFrame>.
export function SidebarFrame({
  children,
  className = 'block-120',
}: {
  children: ReactNode
  className?: string
}): ReactElement {
  return (
    <div className={`
      transform-[translateZ(0)] overflow-hidden inline-full
      **:data-[slot=sidebar-container]:block-full!
      **:data-[slot=sidebar-wrapper]:block-full!
      **:data-[slot=sidebar-wrapper]:min-block-0!
      ${className}
    `}
    >
      {children}
    </div>
  )
}
