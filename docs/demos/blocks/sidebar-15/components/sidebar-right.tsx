import type { ComponentProps, ReactElement } from 'react'
import { PlusIcon } from '@gedatou/cadenza-icons'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@gedatou/cadenza-ui'
import { Calendars } from './calendars'
import { DatePicker } from './date-picker'
import { NavUser } from './nav-user'

// This is sample data.
const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  calendars: [
    {
      name: 'My Calendars',
      items: ['Personal', 'Work', 'Family'],
    },
    {
      name: 'Favorites',
      items: ['Holidays', 'Birthdays'],
    },
    {
      name: 'Other',
      items: ['Travel', 'Reminders', 'Deadlines'],
    },
  ],
}

export function SidebarRight({
  ...props
}: ComponentProps<typeof Sidebar>): ReactElement {
  return (
    // Upstream also sets h-svh here. This collapsible="none" panel is a plain
    // column the docs frame does not reach, so h-svh would run past the
    // frame's bottom edge; its own block-full already fills the frame.
    <Sidebar
      collapsible="none"
      className="
        sticky inset-bs-0 hidden border-s
        lg:flex
      "
      {...props}
    >
      <SidebarHeader className="border-be border-sidebar-border block-16">
        <NavUser user={data.user} />
      </SidebarHeader>
      <SidebarContent>
        <DatePicker />
        <SidebarSeparator className="mx-0" />
        <Calendars calendars={data.calendars} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <PlusIcon animateOnHover />
              <span>New Calendar</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
