import type { ReactElement } from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Separator,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@gedatou/cadenza-ui'
import { SidebarFrame } from '../../lib/sidebar-frame'
import { AppSidebar } from './components/app-sidebar'

// shadcn's sidebar-08 block: an inset sidebar with secondary navigation —
// nav groups whose submenus toggle from a side action, projects, and a
// secondary nav pushed to the bottom above the user menu.
export default function SidebarBlock08(): ReactElement {
  return (
    <SidebarFrame className="block-180">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex shrink-0 items-center gap-2 block-16">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ms-1" />
              <Separator
                orientation="vertical"
                className="
                  me-2
                  data-vertical:self-auto data-vertical:block-4
                "
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="
                    hidden
                    md:block
                  "
                  >
                    <BreadcrumbLink href="#">
                      Build Your Application
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="
                    hidden
                    md:block
                  "
                  />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
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
