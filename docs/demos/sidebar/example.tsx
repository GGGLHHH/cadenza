import type { ReactElement } from 'react'
import { CheckIcon, ChevronUpDownIcon, SearchIcon } from '@gedatou/cadenza-icons'
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuPopup,
  DropdownMenuTrigger,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
  Label,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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
import { useId, useState } from 'react'
import { SidebarFrame } from '../lib/sidebar-frame'

// shadcn's sidebar-example (the "sidebar" variant): a docs sidebar with a
// version switcher and a search field in the header, grouped links below.
export default function SidebarExample(): ReactElement {
  const data = {
    versions: ['1.0.1', '1.1.0-alpha', '2.0.0-beta1'],
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

  const [selectedVersion, setSelectedVersion] = useState(data.versions[0])
  const searchId = useId()

  return (
    <SidebarFrame>
      <SidebarProvider>
        <Sidebar>
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
                    <Item className="p-0" size="xs">
                      <ItemContent>
                        <ItemTitle className="text-sm">Documentation</ItemTitle>
                        <ItemDescription>
                          v
                          {selectedVersion}
                        </ItemDescription>
                      </ItemContent>
                      <ItemActions>
                        <ChevronUpDownIcon />
                      </ItemActions>
                    </Item>
                  </DropdownMenuTrigger>
                  <DropdownMenuPopup>
                    {data.versions.map(version => (
                      <DropdownMenuItem
                        key={version}
                        onClick={() => setSelectedVersion(version)}
                      >
                        v
                        {version}
                        {' '}
                        {version === selectedVersion && (
                          <CheckIcon className="ms-auto" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuPopup>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
            <form>
              <SidebarGroup className="py-0">
                <SidebarGroupContent className="relative">
                  <Label htmlFor={searchId} className="sr-only">
                    Search
                  </Label>
                  <SidebarInput
                    id={searchId}
                    placeholder="Search the docs..."
                    className="ps-8"
                  />
                  <SearchIcon className="
                    pointer-events-none absolute inset-s-2 inset-bs-1/2
                    -translate-y-1/2 opacity-50 select-none block-4 inline-4
                  "
                  />
                </SidebarGroupContent>
              </SidebarGroup>
            </form>
          </SidebarHeader>
          <SidebarContent>
            {data.navMain.map(item => (
              <SidebarGroup key={item.title}>
                <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {item.items.map(subItem => (
                      <SidebarMenuItem key={subItem.title}>
                        <SidebarMenuButton
                          render={<a href={subItem.url} />}
                          isActive={subItem.isActive}
                        >
                          {subItem.title}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>
          <SidebarRail />
        </Sidebar>
        <SidebarInset>
          <header className="flex shrink-0 items-center gap-2 px-4 block-16">
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
