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

// shadcn block sidebar-02: a docs sidebar whose groups collapse — each section
// label is a collapsible trigger; the page scrolls under a sticky header.
export default function SidebarBlock02(): ReactElement {
  return (
    <SidebarFrame className="block-180">
      <SidebarProvider>
        <AppSidebar />
        {/* The frame clips the page, so the inset scrolls in its place — the
            sticky header needs a scrolling ancestor. */}
        <SidebarInset className="overflow-y-auto">
          <header className="
            sticky inset-bs-0 flex shrink-0 items-center gap-2 border-be
            bg-background px-4 block-16
          "
          >
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
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">
            {Array.from({ length: 24 }).map((_, index) => (
              <div
                key={index}
                className="
                  aspect-video rounded-lg bg-muted/50 block-12 inline-full
                "
              />
            ))}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </SidebarFrame>
  )
}
