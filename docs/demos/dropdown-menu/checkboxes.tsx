import type { ReactElement } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuPopup,
  DropdownMenuTrigger,
} from '@gedatou/cadenza-ui'

// Checkbox items: a click toggles in place and the menu stays open — a
// settings menu survives its own switches.
export default function CheckboxesDemo(): ReactElement {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        View
      </DropdownMenuTrigger>
      <DropdownMenuPopup>
        {/* GroupLabel must sit inside a Group (or RadioGroup) — Base UI wires aria-labelledby through the group's context */}
        <DropdownMenuGroup>
          <DropdownMenuGroupLabel>Appearance</DropdownMenuGroupLabel>
          <DropdownMenuCheckboxItem defaultChecked>Show line numbers</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem defaultChecked>Word wrap</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem>Show indent guides</DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
      </DropdownMenuPopup>
    </DropdownMenu>
  )
}
