import type { ReactElement } from 'react'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuItem,
  DropdownMenuPopup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@gedatou/cadenza-ui'
import {
  BookOpenIcon,
  BotIcon,
  ChartColumnIcon,
  ChevronRightIcon,
  ChevronUpDownIcon,
  FrameIcon,
  MapPinIcon,
  SlidersHorizontalIcon,
  TerminalIcon,
} from '@gedatou/cadenza-ui/icons'
import { useState } from 'react'
import { SidebarFrame } from '../lib/sidebar-frame'

// shadcn's sidebar-icon-example: `collapsible="icon"` — collapsed, the panel
// keeps a rail of icons with tooltips; a team switcher in the header and a
// user menu in the footer.
export default function SidebarIconExample(): ReactElement {
  const data = {
    user: {
      name: 'shadcn',
      email: 'm@example.com',
      avatar: '/avatars/shadcn.jpg',
    },
    teams: [
      {
        name: 'Acme Inc',
        plan: 'Enterprise',
      },
      {
        name: 'Acme Corp.',
        plan: 'Startup',
      },
      {
        name: 'Evil Corp.',
        plan: 'Free',
      },
    ],
    navMain: [
      {
        title: 'Playground',
        url: '#',
        icon: <TerminalIcon animateOnHover />,
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
        icon: <BotIcon animateOnHover />,
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
        icon: <BookOpenIcon animateOnHover />,
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
        icon: <SlidersHorizontalIcon animateOnHover />,
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
        icon: <FrameIcon animateOnHover />,
      },
      {
        name: 'Sales & Marketing',
        url: '#',
        icon: <ChartColumnIcon animateOnHover />,
      },
      {
        name: 'Travel',
        url: '#',
        icon: <MapPinIcon animateOnHover />,
      },
    ],
  }

  const [activeTeam, setActiveTeam] = useState(data.teams[0])

  return (
    <SidebarFrame>
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarHeader>
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
                    <Button
                      size="icon-sm"
                      render={<span />}
                      nativeButton={false}
                      className="block-8 inline-8"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 256 256"
                      >
                        <rect width="256" height="256" fill="none"></rect>
                        <line
                          x1="208"
                          y1="128"
                          x2="128"
                          y2="208"
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="32"
                        >
                        </line>
                        <line
                          x1="192"
                          y1="40"
                          x2="40"
                          y2="192"
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="32"
                        >
                        </line>
                      </svg>
                    </Button>
                    <div className="grid flex-1 text-start text-sm/tight">
                      <span className="truncate font-medium">
                        {activeTeam.name}
                      </span>
                      <span className="truncate text-xs">{activeTeam.plan}</span>
                    </div>
                    <ChevronUpDownIcon />
                  </DropdownMenuTrigger>
                  <DropdownMenuPopup>
                    <DropdownMenuGroup>
                      <DropdownMenuGroupLabel>Teams</DropdownMenuGroupLabel>
                    </DropdownMenuGroup>
                    <DropdownMenuGroup>
                      {data.teams.map(team => (
                        <DropdownMenuItem
                          key={team.name}
                          onClick={() => setActiveTeam(team)}
                        >
                          {team.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                  </DropdownMenuPopup>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Platform</SidebarGroupLabel>
              <SidebarMenu>
                {data.navMain.map(item => (
                  <Collapsible
                    key={item.title}
                    defaultOpen={item.isActive}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger
                        render={<SidebarMenuButton tooltip={item.title} />}
                      >
                        {item.icon}
                        <span>{item.title}</span>
                        <ChevronRightIcon className="
                          ms-auto transition-transform duration-100
                          group-data-open/collapsible:rotate-90
                        "
                        />
                      </CollapsibleTrigger>
                      <CollapsiblePanel>
                        <SidebarMenuSub>
                          {item.items.map(subItem => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                render={<a href={subItem.url} />}
                              >
                                {subItem.title}
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
            <SidebarGroup className="group-data-[collapsible=icon]:hidden">
              <SidebarGroupLabel>Projects</SidebarGroupLabel>
              <SidebarMenu>
                {data.projects.map(item => (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton render={<a href={item.url} />}>
                      {item.icon}
                      {item.name}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
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
                    <Avatar>
                      <AvatarImage src={data.user.avatar} alt={data.user.name} />
                      <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-start text-sm/tight">
                      <span className="truncate font-medium">
                        {data.user.name}
                      </span>
                      <span className="truncate text-xs">{data.user.email}</span>
                    </div>
                    <ChevronUpDownIcon />
                  </DropdownMenuTrigger>
                  <DropdownMenuPopup>
                    <DropdownMenuGroup>
                      <DropdownMenuGroupLabel>
                        <Item size="xs">
                          <ItemMedia>
                            <Avatar>
                              <AvatarImage
                                src={data.user.avatar}
                                alt={data.user.name}
                              />
                              <AvatarFallback>CN</AvatarFallback>
                            </Avatar>
                          </ItemMedia>
                          <ItemContent>
                            <ItemTitle>{data.user.name}</ItemTitle>
                            <ItemDescription>
                              {' '}
                              {data.user.email}
                            </ItemDescription>
                          </ItemContent>
                        </Item>
                      </DropdownMenuGroupLabel>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem>Account</DropdownMenuItem>
                      <DropdownMenuItem>Billing</DropdownMenuItem>
                      <DropdownMenuItem>Settings</DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem>Log out</DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuPopup>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>
        <SidebarInset>
          <header className="
            flex shrink-0 items-center gap-2 border-be transition-[width,height]
            ease-linear block-16
            group-has-data-[collapsible=icon]/sidebar-wrapper:block-12
          "
          >
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ms-1" />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pbs-0">
            <div className="
              grid auto-rows-min gap-4
              md:grid-cols-3
            "
            >
              <div className="aspect-video rounded-xl bg-muted/50" />
              <div className="aspect-video rounded-xl bg-muted/50" />
              <div className="aspect-video rounded-xl bg-muted/50" />
            </div>
            <div className="
              flex-1 rounded-xl bg-muted/50 min-block-screen
              md:min-block-min
            "
            />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </SidebarFrame>
  )
}
