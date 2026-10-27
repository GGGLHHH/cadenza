import type { ReactElement, ReactNode } from 'react'
import { ChevronUpDownIcon, PlusIcon } from '@gedatou/cadenza-icons'
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuItem,
  DropdownMenuPopup,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'

export function TeamSwitcher({
  teams,
}: {
  teams: {
    name: string
    logo: ReactNode
    plan: string
  }[]
}): ReactElement | null {
  const { isMobile } = useSidebar()
  const [activeTeam, setActiveTeam] = useState<(typeof teams)[number] | undefined>(teams[0])
  if (activeTeam === undefined) {
    return null
  }
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
                "
              />
            )}
          >
            <div className="
              flex aspect-square items-center justify-center rounded-lg
              bg-sidebar-primary text-sidebar-primary-foreground block-8
              inline-8
            "
            >
              {activeTeam.logo}
            </div>
            <div className="grid flex-1 text-start text-sm/tight">
              <span className="truncate font-medium">{activeTeam.name}</span>
              <span className="truncate text-xs">{activeTeam.plan}</span>
            </div>
            <ChevronUpDownIcon className="ms-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuPopup
            className="inline-fit"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuGroupLabel className="text-xs text-muted-foreground">
                Teams
              </DropdownMenuGroupLabel>
              {teams.map((team, index) => (
                <DropdownMenuItem
                  key={team.name}
                  onClick={() => setActiveTeam(team)}
                  className="gap-2 p-2"
                >
                  <div className="
                    flex items-center justify-center rounded-md border block-6
                    inline-6
                  "
                  >
                    {team.logo}
                  </div>
                  {team.name}
                  <DropdownMenuShortcut>
                    ⌘
                    {index + 1}
                  </DropdownMenuShortcut>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="gap-2 p-2">
                <div className="
                  flex items-center justify-center rounded-md border
                  bg-transparent block-6 inline-6
                "
                >
                  <PlusIcon className="block-4 inline-4" />
                </div>
                <div className="font-medium text-muted-foreground">
                  Add team
                </div>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuPopup>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
