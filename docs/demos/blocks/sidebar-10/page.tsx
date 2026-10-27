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
import { NavActions } from './components/nav-actions'

// shadcn's sidebar-10 block: a Notion-style sidebar — team switcher, quick
// links, favorites and collapsible workspaces — with a page-actions popover
// in the header that is itself a non-collapsible Sidebar.
export default function SidebarBlock10(): ReactElement {
  return (
    <SidebarFrame className="block-180">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex shrink-0 items-center gap-2 block-14">
            <div className="flex flex-1 items-center gap-2 px-3">
              <SidebarTrigger />
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
                    <BreadcrumbPage className="line-clamp-1">
                      Project Management & Task Tracking
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="ms-auto px-3">
              <NavActions />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 px-4 py-10">
            <div className="
              mx-auto rounded-xl bg-muted/50 block-24 inline-full max-inline-3xl
            "
            />
            <div className="
              mx-auto rounded-xl bg-muted/50 block-full inline-full
              max-inline-3xl
            "
            />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </SidebarFrame>
  )
}
