import type { ReactElement } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuItem,
  DropdownMenuPopup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@gedatou/cadenza-ui'

// Basic composition: groups + group labels + separators. GroupLabel titles a
// group, not the control.
export default function BasicDemo(): ReactElement {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        My account
      </DropdownMenuTrigger>
      <DropdownMenuPopup>
        <DropdownMenuGroup>
          <DropdownMenuGroupLabel>Account</DropdownMenuGroupLabel>
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Billing</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>Team</DropdownMenuItem>
          <DropdownMenuItem>Subscription</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuPopup>
    </DropdownMenu>
  )
}
