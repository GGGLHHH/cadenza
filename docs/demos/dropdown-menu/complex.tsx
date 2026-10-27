import type { ReactElement } from 'react'
import { AnimateIcon, LogOutIcon, MailIcon, MessageSquareIcon, SettingsIcon, UserIcon, UserPlusIcon } from '@gedatou/cadenza-icons'
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
          <AnimateIcon animateOnHover asChild>
            <DropdownMenuItem>
              <UserIcon />
              Profile
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </DropdownMenuItem>
          </AnimateIcon>
          <AnimateIcon animateOnHover asChild>
            <DropdownMenuItem>
              <SettingsIcon />
              Settings
              <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
            </DropdownMenuItem>
          </AnimateIcon>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuSubmenu>
            <AnimateIcon animateOnHover asChild>
              <DropdownMenuSubmenuTrigger>
                <UserPlusIcon />
                Invite members
              </DropdownMenuSubmenuTrigger>
            </AnimateIcon>
            <DropdownMenuSubmenuPopup>
              <AnimateIcon animateOnHover asChild>
                <DropdownMenuItem>
                  <MailIcon />
                  Invite by email
                </DropdownMenuItem>
              </AnimateIcon>
              <AnimateIcon animateOnHover asChild>
                <DropdownMenuItem>
                  <MessageSquareIcon />
                  Direct message
                </DropdownMenuItem>
              </AnimateIcon>
            </DropdownMenuSubmenuPopup>
          </DropdownMenuSubmenu>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <AnimateIcon animateOnHover asChild>
          <DropdownMenuItem>
            <LogOutIcon />
            Sign out
            <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
          </DropdownMenuItem>
        </AnimateIcon>
      </DropdownMenuPopup>
    </DropdownMenu>
  )
}
