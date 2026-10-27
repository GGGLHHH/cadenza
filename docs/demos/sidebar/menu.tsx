import type { ReactElement } from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
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

// shadcn's sidebar-menu example: a SidebarMenu of link buttons built from data.
export default function SidebarMenuDemo(): ReactElement {
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
                      <SidebarMenuButton render={<a href={project.url} />}>
                        <project.icon animateOnHover />
                        <span>{project.name}</span>
                      </SidebarMenuButton>
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
