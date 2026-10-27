import type { ReactElement } from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  Separator,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@gedatou/cadenza-ui'
import { SidebarFrame } from '../../lib/sidebar-frame'
import { AppSidebar } from './components/app-sidebar'

// shadcn's sidebar-12 block: a calendar sidebar — a user menu in the header,
// a month Calendar and collapsible calendar lists with checkbox-style items.
export default function SidebarBlock12(): ReactElement {
  return (
    <SidebarFrame className="block-180">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
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
                <BreadcrumbItem>
                  <BreadcrumbPage>October 2024</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">
            <div className="
              grid auto-rows-min gap-4
              md:grid-cols-5
            "
            >
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-xl bg-muted/50" />
              ))}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </SidebarFrame>
  )
}
