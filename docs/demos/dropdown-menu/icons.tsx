import type { ReactElement } from 'react'
import { AnimateIcon, CopyIcon, PencilIcon, ShareIcon, StarIcon } from '@gedatou/cadenza-icons'
import {
  Button,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuPopup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@gedatou/cadenza-ui'

// Icons go straight into the item — item styles already size and space a
// leading svg.
export default function IconsDemo(): ReactElement {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        Actions
      </DropdownMenuTrigger>
      <DropdownMenuPopup>
        <AnimateIcon animateOnHover asChild>
          <DropdownMenuItem>
            <PencilIcon />
            Edit
          </DropdownMenuItem>
        </AnimateIcon>
        <AnimateIcon animateOnHover asChild>
          <DropdownMenuItem>
            <CopyIcon />
            Duplicate
          </DropdownMenuItem>
        </AnimateIcon>
        <AnimateIcon animateOnHover asChild>
          <DropdownMenuItem>
            <StarIcon />
            Favourite
          </DropdownMenuItem>
        </AnimateIcon>
        <DropdownMenuSeparator />
        <AnimateIcon animateOnHover asChild>
          <DropdownMenuItem>
            <ShareIcon />
            Share
          </DropdownMenuItem>
        </AnimateIcon>
      </DropdownMenuPopup>
    </DropdownMenu>
  )
}
