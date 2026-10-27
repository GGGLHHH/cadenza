import type { ReactElement } from 'react'
import { EllipsisIcon } from '@gedatou/cadenza-icons'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPopup,
  DropdownMenuTrigger,
  Field,
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@gedatou/cadenza-ui'
import { SidebarFrame } from '../lib/sidebar-frame'

// shadcn's sidebar-floating-example: `variant="floating"` — the panel sits
// inset with rounded corners and a ring; sections open as side dropdowns and
// a newsletter card fills the footer.
export default function SidebarFloatingExample(): ReactElement {
  const data = {
    navMain: [
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
    ],
  }

  return (
    <SidebarFrame>
      <SidebarProvider className="bg-background">
        <Sidebar variant="floating">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" render={<a href="#" />}>
                  <Item className="p-0" size="xs">
                    <ItemContent>
                      <ItemTitle className="text-sm">Documentation</ItemTitle>
                      <ItemDescription>v1.0.0</ItemDescription>
                    </ItemContent>
                  </Item>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarMenu>
                {data.navMain.map(item => (
                  <DropdownMenu key={item.title}>
                    <SidebarMenuItem>
                      <DropdownMenuTrigger
                        render={(
                          <SidebarMenuButton className="
                            data-popup-open:bg-sidebar-accent
                            data-popup-open:text-sidebar-accent-foreground
                          "
                          />
                        )}
                      >
                        {item.title}
                        {' '}
                        <EllipsisIcon className="ms-auto" />
                      </DropdownMenuTrigger>
                      {item.items.length
                        ? (
                            <DropdownMenuPopup side="right" align="start">
                              <DropdownMenuGroup>
                                {item.items.map(subItem => (
                                  <DropdownMenuItem
                                    render={<a href={subItem.url} />}
                                    key={subItem.title}
                                  >
                                    {subItem.title}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuGroup>
                            </DropdownMenuPopup>
                          )
                        : null}
                    </SidebarMenuItem>
                  </DropdownMenu>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarGroup>
              <Card size="sm" className="-mx-2">
                <CardHeader>
                  <CardTitle className="text-sm">
                    Subscribe to our newsletter
                  </CardTitle>
                  <CardDescription>
                    Opt-in to receive updates and news about the sidebar.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form>
                    <Field>
                      <SidebarInput type="email" placeholder="Email" />
                      <Button
                        className="
                          bg-sidebar-primary text-sidebar-primary-foreground
                          inline-full
                        "
                        size="sm"
                      >
                        Subscribe
                      </Button>
                    </Field>
                  </form>
                </CardContent>
              </Card>
            </SidebarGroup>
          </SidebarFooter>
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
