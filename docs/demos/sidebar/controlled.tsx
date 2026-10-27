import type { ReactElement } from 'react'
import {
  Button,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
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
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  SendIcon,
} from '@gedatou/cadenza-ui/icons'
import { useState } from 'react'
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

// shadcn's sidebar-controlled example: SidebarProvider driven by `open` /
// `onOpenChange`, toggled from an ordinary button outside the sidebar.
export default function SidebarControlledDemo(): ReactElement {
  const [open, setOpen] = useState(true)

  return (
    <SidebarFrame>
      <SidebarProvider open={open} onOpenChange={setOpen}>
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
        <SidebarInset>
          <header className="flex items-center justify-between px-4 block-12">
            <Button
              onClick={() => setOpen(open => !open)}
              size="sm"
              variant="ghost"
            >
              {open ? <PanelLeftCloseIcon /> : <PanelLeftOpenIcon />}
              <span>
                {open ? 'Close' : 'Open'}
                {' '}
                Sidebar
              </span>
            </Button>
          </header>
        </SidebarInset>
      </SidebarProvider>
    </SidebarFrame>
  )
}
