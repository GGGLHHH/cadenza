import type { ReactElement } from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@gedatou/cadenza-ui'
import { SidebarFrame } from '../../lib/sidebar-frame'
import { AppSidebar } from './components/app-sidebar'

// shadcn's sidebar-14 block: a table-of-contents sidebar on the right
// (side="right"), its trigger at the end of the header.
export default function SidebarBlock14(): ReactElement {
  return (
    <SidebarFrame className="block-180">
      <SidebarProvider>
        <SidebarInset>
          <header className="
            flex shrink-0 items-center gap-2 border-be px-4 block-16
          "
          >
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="
                  hidden
                  md:block
                "
                >
                  <BreadcrumbLink href="#">Build Your Application</BreadcrumbLink>
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
            <SidebarTrigger className="ms-auto -me-1 rotate-180" />
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
        <AppSidebar side="right" />
      </SidebarProvider>
    </SidebarFrame>
  )
}
