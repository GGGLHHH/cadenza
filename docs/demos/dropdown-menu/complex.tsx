import type { ReactElement } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuItem,
  DropdownMenuPopup,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSubmenu,
  DropdownMenuSubmenuPopup,
  DropdownMenuSubmenuTrigger,
  DropdownMenuTrigger,
} from '@gedatou/cadenza-ui'
import {
  IconLogout,
  IconMail,
  IconMessage,
  IconSettings,
  IconUser,
  IconUserPlus,
} from '@tabler/icons-react'

// Everything at once: groups + icons + shortcuts + a submenu in one menu.
export default function ComplexDemo(): ReactElement {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        Open menu
      </DropdownMenuTrigger>
      <DropdownMenuPopup>
        <DropdownMenuGroup>
          <DropdownMenuGroupLabel>My account</DropdownMenuGroupLabel>
          <DropdownMenuItem>
            <IconUser />
            Profile
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <IconSettings />
            Settings
            <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuSubmenu>
            <DropdownMenuSubmenuTrigger>
              <IconUserPlus />
              Invite members
            </DropdownMenuSubmenuTrigger>
            <DropdownMenuSubmenuPopup>
              <DropdownMenuItem>
                <IconMail />
                Invite by email
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconMessage />
                Direct message
              </DropdownMenuItem>
            </DropdownMenuSubmenuPopup>
          </DropdownMenuSubmenu>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <IconLogout />
          Sign out
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuPopup>
    </DropdownMenu>
  )
}
