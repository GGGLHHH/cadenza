import type { ReactElement } from 'react'
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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
} from '@gedatou/cadenza-ui'
import {
  ChartLineIcon,
  ChevronRightIcon,
  FileIcon,
  HouseIcon,
  MessageCircleQuestionIcon,
  SendIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  SlidersHorizontalIcon,
  UserIcon,
} from '@gedatou/cadenza-ui/icons'
import { SidebarFrame } from '../lib/sidebar-frame'

// shadcn's sidebar-inset-example: `variant="inset"` — the page content sits
// in a raised card beside the panel; items with children toggle them from a
// SidebarMenuAction chevron, and a secondary menu is pushed to the bottom.
export default function SidebarInsetExample(): ReactElement {
  const data = {
    navMain: [
      {
        title: 'Dashboard',
        url: '#',
        icon: <HouseIcon animateOnHover />,
        isActive: true,
        items: [
          {
            title: 'Overview',
            url: '#',
          },
          {
            title: 'Analytics',
            url: '#',
          },
        ],
      },
      {
        title: 'Analytics',
        url: '#',
        icon: <ChartLineIcon animateOnHover />,
        items: [
          {
            title: 'Reports',
            url: '#',
          },
          {
            title: 'Metrics',
            url: '#',
          },
        ],
      },
      {
        title: 'Orders',
        url: '#',
        icon: <ShoppingBagIcon animateOnHover />,
        items: [
          {
            title: 'All Orders',
            url: '#',
          },
          {
            title: 'Pending',
            url: '#',
          },
          {
            title: 'Completed',
            url: '#',
          },
        ],
      },
      {
        title: 'Products',
        url: '#',
        icon: <ShoppingCartIcon animateOnHover />,
        items: [
          {
            title: 'All Products',
            url: '#',
          },
          {
            title: 'Categories',
            url: '#',
          },
        ],
      },
      {
        title: 'Invoices',
        url: '#',
        icon: <FileIcon animateOnHover />,
      },
      {
        title: 'Customers',
        url: '#',
        icon: <UserIcon animateOnHover />,
      },
      {
        title: 'Settings',
        url: '#',
        icon: <SlidersHorizontalIcon animateOnHover />,
      },
    ],
    navSecondary: [
      {
        title: 'Support',
        url: '#',
        icon: <MessageCircleQuestionIcon animateOnHover />,
      },
      {
        title: 'Feedback',
        url: '#',
        icon: <SendIcon animateOnHover />,
      },
    ],
  }

  return (
    <SidebarFrame>
      <SidebarProvider>
        <Sidebar variant="inset">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
              <SidebarMenu>
                {data.navMain.map(item => (
                  <Collapsible
                    key={item.title}
                    defaultOpen={item.isActive}
                    render={<SidebarMenuItem />}
                  >
                    <SidebarMenuButton
                      render={<a href={item.url} />}
                      isActive={item.isActive}
                    >
                      {item.icon}
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                    {item.items !== undefined && item.items.length > 0
                      ? (
                          <>
                            <CollapsibleTrigger
                              render={(
                                <SidebarMenuAction className="
                                  data-panel-open:rotate-90
                                "
                                />
                              )}
                            >
                              <ChevronRightIcon />
                              <span className="sr-only">Toggle</span>
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
                          </>
                        )
                      : null}
                  </Collapsible>
                ))}
              </SidebarMenu>
            </SidebarGroup>
            <SidebarGroup className="mbs-auto">
              <SidebarGroupContent>
                <SidebarMenu>
                  {data.navSecondary.map(item => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton render={<a href={item.url} />} size="sm">
                        {item.icon}
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarRail />
        </Sidebar>
        <SidebarInset>
          <header className="
            flex shrink-0 items-center gap-2 border-be px-4 block-16
          "
          >
            <SidebarTrigger className="-ms-1" />
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">
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
