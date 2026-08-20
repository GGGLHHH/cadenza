import type { ReactElement } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuPopup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@gedatou/cadenza-ui'
import { IconTrash } from '@tabler/icons-react'

// variant="destructive" is for irreversible actions: text, icon, and the
// focused background all shift to the warning colour for the whole row.
export default function DestructiveDemo(): ReactElement {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        Project
      </DropdownMenuTrigger>
      <DropdownMenuPopup>
        <DropdownMenuItem>Rename</DropdownMenuItem>
        <DropdownMenuItem>Archive</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <IconTrash />
          Delete project
        </DropdownMenuItem>
      </DropdownMenuPopup>
    </DropdownMenu>
  )
}
