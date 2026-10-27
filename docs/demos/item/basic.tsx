import type { ReactElement } from 'react'
import { MessageSquareIcon } from '@gedatou/cadenza-icons'
import {
  Button,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@gedatou/cadenza-ui'

// The canonical row: icon media, title + description, and an action on the
// trailing edge — one Item, all four parts in place.
export default function BasicDemo(): ReactElement {
  return (
    <div className="flex flex-col gap-4 inline-full max-inline-md">
      <Item variant="outline">
        <ItemMedia variant="icon">
          <MessageSquareIcon animateOnHover />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Rehearsal schedule</ItemTitle>
          <ItemDescription>Yesterday · 12 messages</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button variant="outline" size="sm">
            Open
          </Button>
        </ItemActions>
      </Item>
    </div>
  )
}
