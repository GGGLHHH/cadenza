import type { ReactElement } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuPopup,
  DropdownMenuTrigger,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@gedatou/cadenza-ui'
import { IconDots, IconFileMusic } from '@tabler/icons-react'

// ItemActions hosts a DropdownMenu: the trigger renders through a ghost icon
// Button so the row keeps a single overflow affordance.
export default function DropdownDemo(): ReactElement {
  return (
    <div className="flex flex-col gap-4 inline-full max-inline-md">
      <Item variant="outline">
        <ItemMedia variant="icon">
          <IconFileMusic />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>score-final.pdf</ItemTitle>
          <ItemDescription>2.4 MB · updated yesterday</ItemDescription>
        </ItemContent>
        <ItemActions>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="More" />}>
              <IconDots />
            </DropdownMenuTrigger>
            <DropdownMenuPopup align="end">
              <DropdownMenuItem>Rename</DropdownMenuItem>
              <DropdownMenuItem>Download</DropdownMenuItem>
              <DropdownMenuItem>Delete</DropdownMenuItem>
            </DropdownMenuPopup>
          </DropdownMenu>
        </ItemActions>
      </Item>
    </div>
  )
}
