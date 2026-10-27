import type { ReactElement } from 'react'
import { ChartColumnIcon, FrameIcon, MapPinIcon, PlusIcon } from '@gedatou/cadenza-icons'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@gedatou/cadenza-ui'
import { SidebarFrame } from '../lib/sidebar-frame'

// shadcn's sidebar-group-action example: a SidebarGroupAction button beside
// the group label (upstream's toast on click is dropped).
export default function SidebarGroupActionDemo(): ReactElement {
  return (
    <SidebarFrame>
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Projects</SidebarGroupLabel>
              <SidebarGroupAction title="Add Project">
                <PlusIcon animateOnHover />
                <span className="sr-only">Add Project</span>
              </SidebarGroupAction>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton render={<a href="#" />}>
                      <FrameIcon animateOnHover />
                      <span>Design Engineering</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton render={<a href="#" />}>
                      <ChartColumnIcon animateOnHover />
                      <span>Sales & Marketing</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton render={<a href="#" />}>
                      <MapPinIcon animateOnHover />
                      <span>Travel</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    </SidebarFrame>
  )
}
