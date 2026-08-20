import type { ReactElement } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuPopup,
  DropdownMenuSeparator,
  DropdownMenuSubmenu,
  DropdownMenuSubmenuPopup,
  DropdownMenuSubmenuTrigger,
  DropdownMenuTrigger,
} from '@gedatou/cadenza-ui'

// Submenu: nest the Submenu trio inside Popup. Hover or ArrowRight expands it,
// and moving diagonally into the panel keeps focus (Base UI's built-in
// safePolygon, same as Cascader).
export default function SubmenuDemo(): ReactElement {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        File
      </DropdownMenuTrigger>
      <DropdownMenuPopup>
        <DropdownMenuItem>Rename</DropdownMenuItem>
        <DropdownMenuItem>Move to…</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSubmenu>
          <DropdownMenuSubmenuTrigger>Export as</DropdownMenuSubmenuTrigger>
          <DropdownMenuSubmenuPopup>
            <DropdownMenuItem>PDF</DropdownMenuItem>
            <DropdownMenuItem>CSV</DropdownMenuItem>
            <DropdownMenuItem>Markdown</DropdownMenuItem>
          </DropdownMenuSubmenuPopup>
        </DropdownMenuSubmenu>
      </DropdownMenuPopup>
    </DropdownMenu>
  )
}
