import type { ReactElement } from 'react'
import { Button, Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@gedatou/cadenza-ui'
import { IconInbox } from '@tabler/icons-react'

// The full composition: an icon tile, title, description and one action that
// leads the user out of the empty state
export default function BasicDemo(): ReactElement {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconInbox aria-hidden />
        </EmptyMedia>
        <EmptyTitle>No threads yet</EmptyTitle>
        <EmptyDescription>Start a conversation and it will show up here.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button>New thread</Button>
      </EmptyContent>
    </Empty>
  )
}
