import type { ReactElement } from 'react'
import { BellOffIcon } from '@gedatou/cadenza-icons'
import { Button, Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@gedatou/cadenza-ui'

// A background is just className on the root: bg-* and gradient utilities
// compose with the baked layout classes
export default function BackgroundDemo(): ReactElement {
  return (
    <Empty className="bg-linear-to-b from-muted/50 to-background">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <BellOffIcon animateOnHover aria-hidden />
        </EmptyMedia>
        <EmptyTitle>No notifications</EmptyTitle>
        <EmptyDescription>You are all caught up. New activity will appear here.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" size="sm">
          Refresh
        </Button>
      </EmptyContent>
    </Empty>
  )
}
