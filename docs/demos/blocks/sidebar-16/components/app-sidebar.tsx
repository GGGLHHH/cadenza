import type { ComponentProps, ReactElement } from 'react'
import {
  BookOpenIcon,
  BotIcon,
  ChartColumnIcon,
  FrameIcon,
  MapPinIcon,
  MessageCircleQuestionIcon,
  SendIcon,
  SlidersHorizontalIcon,
  TerminalIcon,
} from '@gedatou/cadenza-icons'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@gedatou/cadenza-ui'
import { NavMain } from './nav-main'
import { NavProjects } from './nav-projects'
import { NavSecondary } from './nav-secondary'
import { NavUser } from './nav-user'

const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  navMain: [
    {
      title: 'Playground',
      url: '#',
      icon: (
        <TerminalIcon animateOnHover />
      ),
      isActive: true,
      items: [
        {
          title: 'History',
          url: '#',
        },
        {
          title: 'Starred',
          url: '#',
        },
        {
          title: 'Settings',
          url: '#',
        },
      ],
    },
    {
      title: 'Models',
      url: '#',
      icon: (
        <BotIcon animateOnHover />
      ),
      items: [
        {
          title: 'Genesis',
          url: '#',
        },
        {
          title: 'Explorer',
          url: '#',
        },
        {
          title: 'Quantum',
          url: '#',
        },
      ],
    },
    {
      title: 'Documentation',
      url: '#',
      icon: (
        <BookOpenIcon animateOnHover />
      ),
      items: [
        {
          title: 'Introduction',
          url: '#',
        },
        {
          title: 'Get Started',
          url: '#',
        },
        {
          title: 'Tutorials',
          url: '#',
        },
        {
          title: 'Changelog',
          url: '#',
        },
      ],
    },
    {
      title: 'Settings',
      url: '#',
      icon: (
        <SlidersHorizontalIcon animateOnHover />
      ),
      items: [
        {
          title: 'General',
          url: '#',
        },
        {
          title: 'Team',
          url: '#',
        },
        {
          title: 'Billing',
          url: '#',
        },
        {
          title: 'Limits',
          url: '#',
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: 'Support',
      url: '#',
      icon: (
        <MessageCircleQuestionIcon animateOnHover />
      ),
    },
    {
      title: 'Feedback',
      url: '#',
      icon: (
        <SendIcon animateOnHover />
      ),
    },
  ],
  projects: [
    {
      name: 'Design Engineering',
      url: '#',
      icon: (
        <FrameIcon animateOnHover />
      ),
    },
    {
      name: 'Sales & Marketing',
      url: '#',
      icon: (
        <ChartColumnIcon animateOnHover />
      ),
    },
    {
      name: 'Travel',
      url: '#',
      icon: (
        <MapPinIcon animateOnHover />
      ),
    },
  ],
}
export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>): ReactElement {
  return (
    // Upstream sizes the panel with h-[calc(100svh-var(--header-height))]!.
    // In the docs frame that loses to the frame's own (more specific)
    // block-full!, so the panel is frame-tall and pushed down by the header;
    // the bottom padding pulls its content back above the frame's bottom edge.
    <Sidebar
      className="inset-bs-(--header-height) pbe-(--header-height)"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<a href="#" />}>
              <div className="
                flex aspect-square items-center justify-center rounded-lg
                bg-sidebar-primary text-sidebar-primary-foreground block-8
                inline-8
              "
              >
                <TerminalIcon animateOnHover className="block-4 inline-4" />
              </div>
              <div className="grid flex-1 text-start text-sm/tight">
                <span className="truncate font-medium">Acme Inc</span>
                <span className="truncate text-xs">Enterprise</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
        <NavSecondary items={data.navSecondary} className="mbs-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
