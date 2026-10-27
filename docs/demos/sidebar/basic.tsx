import type { ReactElement } from 'react'
import {
  CalendarIcon,
  ChevronRightIcon,
  ChevronUpDownIcon,
  CircleUserRoundIcon,
  EllipsisIcon,
  FolderIcon,
  LayoutDashboardIcon,
  MessageSquareIcon,
  PlusIcon,
  SettingsIcon,
  SparklesIcon,
} from '@gedatou/cadenza-icons'
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@gedatou/cadenza-ui'
import { SidebarFrame } from '../lib/sidebar-frame'

const PROJECTS = ['Design system', 'Marketing site', 'Mobile app']

// A sidebar that collapses to icons: header, two groups (a collapsible
// submenu, a badge, hover actions), footer and rail, beside a SidebarInset.
// Click the trigger, the rail, or press ⌘B / Ctrl+B; collapsed, the buttons
// show their tooltip.
export default function SidebarDemo(): ReactElement {
  return (
    <SidebarFrame>
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg">
                  <div className="
                    flex aspect-square items-center justify-center rounded-md
                    bg-sidebar-primary text-sidebar-primary-foreground block-8
                    inline-8
                  "
                  >
                    <SparklesIcon animateOnHover />
                  </div>
                  <div className="grid flex-1 text-start text-sm/tight">
                    <span className="truncate font-medium">Acme Inc</span>
                    <span className="truncate text-xs">Enterprise</span>
                  </div>
                  <ChevronUpDownIcon className="ms-auto" />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Platform</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive tooltip="Dashboard">
                    <LayoutDashboardIcon animateOnHover />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Inbox">
                    <MessageSquareIcon animateOnHover />
                    <span>Inbox</span>
                  </SidebarMenuButton>
                  <SidebarMenuBadge>12</SidebarMenuBadge>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Calendar">
                    <CalendarIcon animateOnHover />
                    <span>Calendar</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <Collapsible className="group/collapsible" render={<SidebarMenuItem />}>
                  <CollapsibleTrigger render={<SidebarMenuButton tooltip="Settings" />}>
                    <SettingsIcon animateOnHover />
                    <span>Settings</span>
                    <ChevronRightIcon className="
                      ms-auto transition-transform duration-350
                      ease-[cubic-bezier(0.215,0.61,0.355,1)]
                      group-data-open/collapsible:rotate-90
                    "
                    />
                  </CollapsibleTrigger>
                  <CollapsiblePanel>
                    <SidebarMenuSub>
                      {['General', 'Team', 'Billing'].map(item => (
                        <SidebarMenuSubItem key={item}>
                          <SidebarMenuSubButton href="#">
                            <span>{item}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsiblePanel>
                </Collapsible>
              </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Projects</SidebarGroupLabel>
              <SidebarGroupAction title="Add project">
                <PlusIcon animateOnHover />
                <span className="sr-only">Add project</span>
              </SidebarGroupAction>
              <SidebarGroupContent>
                <SidebarMenu>
                  {PROJECTS.map(project => (
                    <SidebarMenuItem key={project}>
                      <SidebarMenuButton tooltip={project}>
                        <FolderIcon animateOnHover />
                        <span>{project}</span>
                      </SidebarMenuButton>
                      <SidebarMenuAction showOnHover>
                        <EllipsisIcon />
                        <span className="sr-only">More</span>
                      </SidebarMenuAction>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Account">
                  <CircleUserRoundIcon animateOnHover />
                  <span>shadcn</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        <SidebarInset>
          <header className="flex items-center gap-2 border-be px-4 block-12">
            <SidebarTrigger className="-ms-1" />
            <span className="text-sm font-medium">Dashboard</span>
          </header>
          <div className="grid flex-1 grid-cols-3 content-start gap-4 p-4">
            <div className="aspect-video rounded-xl bg-muted" />
            <div className="aspect-video rounded-xl bg-muted" />
            <div className="aspect-video rounded-xl bg-muted" />
            <div className="col-span-3 rounded-xl bg-muted block-40" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </SidebarFrame>
  )
}
