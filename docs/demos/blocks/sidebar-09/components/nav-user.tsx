import type { ReactElement } from 'react'
import {
  BadgeCheckIcon,
  BellIcon,
  ChevronUpDownIcon,
  CreditCardIcon,
  LogOutIcon,
  SparklesIcon,
} from '@gedatou/cadenza-icons'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuItem,
  DropdownMenuPopup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@gedatou/cadenza-ui'

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}): ReactElement {
  const { isMobile } = useSidebar()
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={(
              <SidebarMenuButton
                size="lg"
                className="
                  data-popup-open:bg-sidebar-accent
                  data-popup-open:text-sidebar-accent-foreground
                  md:p-0 md:block-8
                "
              />
            )}
          >
            <Avatar className="rounded-lg block-8 inline-8">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="rounded-lg">CN</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-start text-sm/tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs">{user.email}</span>
            </div>
            <ChevronUpDownIcon className="ms-auto block-4 inline-4" />
          </DropdownMenuTrigger>
          <DropdownMenuPopup
            className="rounded-lg min-inline-56"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            {/* Base UI's group label must sit in a group; upstream left it bare. */}
            <DropdownMenuGroup>
              <DropdownMenuGroupLabel className="p-0 font-normal">
                <div className="
                  flex items-center gap-2 px-1 py-1.5 text-start text-sm
                "
                >
                  <Avatar className="rounded-lg block-8 inline-8">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-start text-sm/tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuGroupLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <SparklesIcon />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheckIcon />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCardIcon />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BellIcon />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOutIcon />
              Log out
            </DropdownMenuItem>
          </DropdownMenuPopup>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
