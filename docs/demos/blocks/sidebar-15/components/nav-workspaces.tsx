import type { ReactElement, ReactNode } from 'react'
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@gedatou/cadenza-ui'
import { ChevronRightIcon, EllipsisIcon, PlusIcon } from '@gedatou/cadenza-ui/icons'

export function NavWorkspaces({
  workspaces,
}: {
  workspaces: {
    name: string
    emoji: ReactNode
    pages: {
      name: string
      emoji: ReactNode
    }[]
  }[]
}): ReactElement {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Workspaces</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {workspaces.map(workspace => (
            <Collapsible key={workspace.name}>
              <SidebarMenuItem>
                <SidebarMenuButton render={<a href="#" />}>
                  <span>{workspace.emoji}</span>
                  <span>{workspace.name}</span>
                </SidebarMenuButton>
                {/* data-panel-open: Base UI's trigger mirrors the open state
                    under that name (upstream's data-open only lands on the
                    panel and root). */}
                <SidebarMenuAction
                  render={<CollapsibleTrigger />}
                  className="
                    inset-s-2 bg-sidebar-accent text-sidebar-accent-foreground
                    data-panel-open:rotate-90
                  "
                  showOnHover
                >
                  <ChevronRightIcon />
                </SidebarMenuAction>
                <SidebarMenuAction showOnHover>
                  <PlusIcon />
                </SidebarMenuAction>
                <CollapsiblePanel>
                  <SidebarMenuSub>
                    {workspace.pages.map(page => (
                      <SidebarMenuSubItem key={page.name}>
                        <SidebarMenuSubButton render={<a href="#" />}>
                          <span>{page.emoji}</span>
                          <span>{page.name}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsiblePanel>
              </SidebarMenuItem>
            </Collapsible>
          ))}
          <SidebarMenuItem>
            <SidebarMenuButton className="text-sidebar-foreground/70">
              <EllipsisIcon />
              <span>More</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
