import type { ReactElement } from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@gedatou/cadenza-ui'
import {
  ChartColumnIcon,
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
    badge: '24',
  },
  {
    name: 'Sales & Marketing',
    url: '#',
    icon: ChartColumnIcon,
    badge: '12',
  },
  {
    name: 'Travel',
    url: '#',
    icon: MapPinIcon,
    badge: '3',
  },
  {
    name: 'Support',
    url: '#',
    icon: MessageCircleQuestionIcon,
    badge: '21',
  },
  {
    name: 'Feedback',
    url: '#',
    icon: SendIcon,
    badge: '8',
  },
]

// shadcn's sidebar-menu-badge example: a SidebarMenuBadge count at the end of
// each menu item.
export default function SidebarMenuBadgeDemo(): ReactElement {
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
                      <SidebarMenuBadge>{project.badge}</SidebarMenuBadge>
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
