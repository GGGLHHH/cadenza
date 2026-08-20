import type { ReactElement } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuPopup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@gedatou/cadenza-ui'
import { IconCopy, IconPencil, IconShare, IconStar } from '@tabler/icons-react'

// Icons go straight into the item — item styles already size and space a
// leading svg.
export default function IconsDemo(): ReactElement {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        Actions
      </DropdownMenuTrigger>
      <DropdownMenuPopup>
        <DropdownMenuItem>
          <IconPencil />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem>
          <IconCopy />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem>
          <IconStar />
          Favourite
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <IconShare />
          Share
        </DropdownMenuItem>
      </DropdownMenuPopup>
    </DropdownMenu>
  )
}
