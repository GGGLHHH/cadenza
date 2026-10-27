import type { ReactElement } from 'react'
import { ChevronRightIcon } from '@gedatou/cadenza-icons'
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
} from '@gedatou/cadenza-ui'
import { SidebarFrame } from '../lib/sidebar-frame'

const items = [
  {
    title: 'Getting Started',
    url: '#',
    items: [
      {
        title: 'Installation',
        url: '#',
      },
      {
        title: 'Project Structure',
        url: '#',
      },
    ],
  },
  {
    title: 'Build Your Application',
    url: '#',
    items: [
      {
        title: 'Routing',
        url: '#',
      },
      {
        title: 'Data Fetching',
        url: '#',
        isActive: true,
      },
      {
        title: 'Rendering',
        url: '#',
      },
      {
        title: 'Caching',
        url: '#',
      },
      {
        title: 'Styling',
        url: '#',
      },
      {
        title: 'Optimizing',
        url: '#',
      },
      {
        title: 'Configuring',
        url: '#',
      },
      {
        title: 'Testing',
        url: '#',
      },
      {
        title: 'Authentication',
        url: '#',
      },
      {
        title: 'Deploying',
        url: '#',
      },
      {
        title: 'Upgrading',
        url: '#',
      },
      {
        title: 'Examples',
        url: '#',
      },
    ],
  },
  {
    title: 'API Reference',
    url: '#',
    items: [
      {
        title: 'Components',
        url: '#',
      },
      {
        title: 'File Conventions',
        url: '#',
      },
      {
        title: 'Functions',
        url: '#',
      },
      {
        title: 'next.config.js Options',
        url: '#',
      },
      {
        title: 'CLI',
        url: '#',
      },
      {
        title: 'Edge Runtime',
        url: '#',
      },
    ],
  },
  {
    title: 'Architecture',
    url: '#',
    items: [
      {
        title: 'Accessibility',
        url: '#',
      },
      {
        title: 'Fast Refresh',
        url: '#',
      },
      {
        title: 'Next.js Compiler',
        url: '#',
      },
      {
        title: 'Supported Browsers',
        url: '#',
      },
      {
        title: 'Turbopack',
        url: '#',
      },
    ],
  },
]

// shadcn's sidebar-menu-collapsible example: each menu item is a Collapsible
// whose trigger folds its SidebarMenuSub open and shut; the first starts open.
export default function SidebarMenuCollapsibleDemo(): ReactElement {
  return (
    <SidebarFrame>
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item, index) => (
                    <Collapsible
                      key={item.title}
                      className="group/collapsible"
                      defaultOpen={index === 0}
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger render={<SidebarMenuButton />}>
                          <span>{item.title}</span>
                          <ChevronRightIcon className="
                            ms-auto transition-transform
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
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    </SidebarFrame>
  )
}
