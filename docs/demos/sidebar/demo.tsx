import type { ComponentProps, ElementType, ReactElement } from 'react'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuItem,
  DropdownMenuPopup,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@gedatou/cadenza-ui'
import {
  AudioLinesIcon,
  BadgeCheckIcon,
  BellIcon,
  BookOpenIcon,
  BotIcon,
  ChartColumnIcon,
  ChevronRightIcon,
  ChevronUpDownIcon,
  CreditCardIcon,
  EllipsisIcon,
  FolderIcon,
  ForwardIcon,
  FrameIcon,
  GalleryVerticalEndIcon,
  KeyIcon,
  LogOutIcon,
  MapPinIcon,
  PlusIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  TerminalIcon,
  Trash2Icon,
} from '@gedatou/cadenza-ui/icons'
import { useState } from 'react'
import { SidebarFrame } from '../lib/sidebar-frame'

// This is sample data.
const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEndIcon,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioLinesIcon,
      plan: 'Startup',
    },
    {
      name: 'Evil Corp.',
      logo: KeyIcon,
      plan: 'Free',
    },
  ],
  navMain: [
    {
      title: 'Playground',
      url: '#',
      icon: TerminalIcon,
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
      icon: BotIcon,
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
      icon: BookOpenIcon,
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
      icon: SlidersHorizontalIcon,
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
  projects: [
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
  ],
}

function TeamSwitcher({
  teams,
}: {
  teams: {
    name: string
    logo: ElementType
    plan: string
  }[]
}): ReactElement {
  const { isMobile } = useSidebar()
  const [activeTeam, setActiveTeam] = useState(teams[0])

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={(
              <SidebarMenuButton
                size="lg"
                className="
                  data-popup-open:bg-sidebar-accent
                  data-popup-open:text-sidebar-accent-foreground
                "
              />
            )}
          >
            <div className="
              flex aspect-square items-center justify-center rounded-lg
              bg-sidebar-primary text-sidebar-primary-foreground block-8
              inline-8
            "
            >
              <activeTeam.logo className="block-4 inline-4" animateOnHover />
            </div>
            <div className="grid flex-1 text-start text-sm/tight">
              <span className="truncate font-medium">{activeTeam.name}</span>
              <span className="truncate text-xs">{activeTeam.plan}</span>
            </div>
            <ChevronUpDownIcon className="ms-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuPopup
            className="rounded-lg inline-(--anchor-width) min-inline-56"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
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
                    flex items-center justify-center rounded-md border block-6
                    inline-6
                  "
                  >
                    <team.logo className="shrink-0 block-3.5 inline-3.5" />
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
                  bg-transparent block-6 inline-6
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

function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: ElementType
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}): ReactElement {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map(item => (
          <Collapsible
            key={item.title}
            defaultOpen={item.isActive}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger
                render={<SidebarMenuButton tooltip={item.title} />}
              >
                {item.icon !== undefined && <item.icon animateOnHover />}
                <span>{item.title}</span>
                <ChevronRightIcon className="
                  ms-auto transition-transform duration-200
                  group-data-open/collapsible:rotate-90
                "
                />
              </CollapsibleTrigger>
              <CollapsiblePanel>
                <SidebarMenuSub>
                  {item.items?.map(subItem => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton render={<a href={subItem.url} />}>
                        <span>{subItem.title}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsiblePanel>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

function NavProjects({
  projects,
}: {
  projects: {
    name: string
    url: string
    icon: ElementType
  }[]
}): ReactElement {
  const { isMobile } = useSidebar()

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map(item => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton render={<a href={item.url} />}>
              <item.icon animateOnHover />
              <span>{item.name}</span>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger render={<SidebarMenuAction showOnHover />}>
                <EllipsisIcon />
                <span className="sr-only">More</span>
              </DropdownMenuTrigger>
              <DropdownMenuPopup
                className="rounded-lg inline-48"
                side={isMobile ? 'bottom' : 'right'}
                align={isMobile ? 'end' : 'start'}
              >
                <DropdownMenuItem>
                  <FolderIcon className="text-muted-foreground" />
                  <span>View Project</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <ForwardIcon className="text-muted-foreground" />
                  <span>Share Project</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Trash2Icon className="text-muted-foreground" />
                  <span>Delete Project</span>
                </DropdownMenuItem>
              </DropdownMenuPopup>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem>
          <SidebarMenuButton className="text-sidebar-foreground/70">
            <EllipsisIcon className="text-sidebar-foreground/70" />
            <span>More</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}

function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}): ReactElement {
  const { isMobile } = useSidebar()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={(
              <SidebarMenuButton
                size="lg"
                className="
                  data-popup-open:bg-sidebar-accent
                  data-popup-open:text-sidebar-accent-foreground
                "
              />
            )}
          >
            <Avatar className="rounded-lg block-8 inline-8">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="rounded-lg">CN</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-start text-sm/tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs">{user.email}</span>
            </div>
            <ChevronUpDownIcon className="ms-auto block-4 inline-4" />
          </DropdownMenuTrigger>
          <DropdownMenuPopup
            className="rounded-lg inline-(--anchor-width) min-inline-56"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuGroupLabel className="p-0 font-normal">
                <div className="
                  flex items-center gap-2 px-1 py-1.5 text-start text-sm
                "
                >
                  <Avatar className="rounded-lg block-8 inline-8">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-start text-sm/tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuGroupLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <SparklesIcon />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheckIcon />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCardIcon />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BellIcon />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <LogOutIcon />
                Log out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuPopup>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

// shadcn's sidebar-demo example: the full app sidebar collapsing to icons —
// a team switcher, collapsible nav, a projects group with per-item dropdowns,
// and a user menu in the footer.
export default function SidebarAppDemo({
  ...props
}: ComponentProps<typeof Sidebar>): ReactElement {
  return (
    <SidebarFrame>
      <SidebarProvider>
        <Sidebar collapsible="icon" {...props}>
          <SidebarHeader>
            <TeamSwitcher teams={data.teams} />
          </SidebarHeader>
          <SidebarContent>
            <NavMain items={data.navMain} />
            <NavProjects projects={data.projects} />
          </SidebarContent>
          <SidebarFooter>
            <NavUser user={data.user} />
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>
        <SidebarInset>
          <header className="
            flex shrink-0 items-center gap-2 transition-[width,height]
            ease-linear block-16
            group-has-data-[collapsible=icon]/sidebar-wrapper:block-12
          "
          >
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ms-1" />
            </div>
          </header>
        </SidebarInset>
      </SidebarProvider>
    </SidebarFrame>
  )
}
