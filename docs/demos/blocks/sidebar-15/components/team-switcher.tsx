import type { ReactElement, ReactNode } from 'react'
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
} from '@gedatou/cadenza-ui'
import { ChevronDownIcon, PlusIcon } from '@gedatou/cadenza-ui/icons'
import { useState } from 'react'

export function TeamSwitcher({
  teams,
}: {
  teams: {
    name: string
    logo: ReactNode
    plan: string
  }[]
}): ReactElement {
  const [activeTeam, setActiveTeam] = useState(teams[0])
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={(
              <SidebarMenuButton className="
                px-1.5 inline-fit
                aria-expanded:bg-muted aria-expanded:text-foreground
              "
              />
            )}
          >
            <div className="
              flex aspect-square items-center justify-center rounded-md
              bg-sidebar-primary text-sidebar-primary-foreground block-5
              inline-5
            "
            >
              {activeTeam.logo}
            </div>
            <span className="truncate font-medium">{activeTeam.name}</span>
            <ChevronDownIcon className="opacity-50" />
          </DropdownMenuTrigger>
          <DropdownMenuPopup
            className="rounded-lg inline-64"
            align="start"
            side="bottom"
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
                    flex items-center justify-center rounded-xs border block-6
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
                  bg-background block-6 inline-6
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
