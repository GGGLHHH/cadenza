import type { ReactElement } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuPopup,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@gedatou/cadenza-ui'

// Shortcut is a right-aligned key hint, purely visual — it binds no keyboard
// events.
export default function ShortcutsDemo(): ReactElement {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        Edit
      </DropdownMenuTrigger>
      <DropdownMenuPopup>
        <DropdownMenuItem>
          Undo
          <DropdownMenuShortcut>⌘Z</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          Redo
          <DropdownMenuShortcut>⇧⌘Z</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          Cut
          <DropdownMenuShortcut>⌘X</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          Copy
          <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          Paste
          <DropdownMenuShortcut>⌘V</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuPopup>
    </DropdownMenu>
  )
}
