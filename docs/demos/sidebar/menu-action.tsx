import type { ReactElement } from 'react'
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuPopup,
  DropdownMenuTrigger,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@gedatou/cadenza-ui'
import {
  ChartColumnIcon,
  EllipsisIcon,
  FrameIcon,
  MapPinIcon,
  MessageCircleQuestionIcon,
  SendIcon,
} from '@gedatou/cadenza-ui/icons'
import { SidebarFrame } from '../lib/sidebar-frame'

const projects = [
  {
    name: 'Design Engineering',
    url: '#',
    icon: FrameIcon,
  },
  {
    name: 'Sales & Marketing',
    url: '#',
    icon: ChartColumnIcon,
  },
  {
    name: 'Travel',
    url: '#',
    icon: MapPinIcon,
  },
  {
    name: 'Support',
    url: '#',
    icon: MessageCircleQuestionIcon,
  },
  {
    name: 'Feedback',
    url: '#',
    icon: SendIcon,
  },
]

// shadcn's sidebar-menu-action example: each item has a SidebarMenuAction
// opening a dropdown; while it is open the row keeps its accent background.
export default function SidebarMenuActionDemo(): ReactElement {
  return (
    <SidebarFrame>
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Projects</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {projects.map(project => (
                    <SidebarMenuItem key={project.name}>
                      <SidebarMenuButton
                        render={<a href={project.url} />}
                        className="
                          group-has-data-popup-open/menu-item:bg-sidebar-accent
                        "
                      >
                        <project.icon animateOnHover />
                        <span>{project.name}</span>
                      </SidebarMenuButton>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<SidebarMenuAction />}>
                          <EllipsisIcon />
                          <span className="sr-only">More</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuPopup side="right" align="start">
                          <DropdownMenuItem>
                            <span>Edit Project</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <span>Delete Project</span>
                          </DropdownMenuItem>
                        </DropdownMenuPopup>
                      </DropdownMenu>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    </SidebarFrame>
  )
}
