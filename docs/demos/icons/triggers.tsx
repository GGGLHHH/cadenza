import type { ReactElement, ReactNode } from 'react'
import { BellIcon, DownloadIcon, HeartIcon, LoaderCircleIcon } from '@gedatou/cadenza-icons'

function Cell({ children, label }: { children: ReactNode, label: string }): ReactElement {
  return (
    <div className="flex flex-col items-center gap-2">
      {children}
      <code className="text-xs text-muted-foreground">{label}</code>
    </div>
  )
}

// The four ways an icon starts playing, side by side: hover it, press it,
// scroll it into view, or let it run on its own in a loop.
export default function TriggersDemo(): ReactElement {
  return (
    <div className="
      grid grid-cols-2 gap-8
      sm:grid-cols-4
    "
    >
      <Cell label="animateOnHover"><BellIcon animateOnHover /></Cell>
      <Cell label="animateOnTap"><HeartIcon animateOnTap /></Cell>
      <Cell label="animateOnView"><DownloadIcon animateOnView /></Cell>
      <Cell label="animate loop"><LoaderCircleIcon animate loop /></Cell>
    </div>
  )
}
