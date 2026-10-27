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
import { SidebarLeft } from './components/sidebar-left'
import { SidebarRight } from './components/sidebar-right'

// shadcn's sidebar-15 block: two sidebars in one provider — a collapsible
// navigation panel on the left, a fixed calendar column on the right.
export default function SidebarBlock15(): ReactElement {
  return (
    <SidebarFrame className="block-180">
      <SidebarProvider>
        <SidebarLeft />
        <SidebarInset>
          <header className="
            sticky inset-bs-0 flex shrink-0 items-center gap-2 bg-background
            block-14
          "
          >
            <div className="flex flex-1 items-center gap-2 px-3">
              <SidebarTrigger />
              <Separator
                orientation="vertical"
                className="
                  me-2
                  data-[orientation=vertical]:block-4
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
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">
            <div className="
              mx-auto rounded-xl bg-muted/50 block-24 inline-full max-inline-3xl
            "
            />
            <div className="
              mx-auto rounded-xl bg-muted/50 block-screen inline-full
              max-inline-3xl
            "
            />
          </div>
        </SidebarInset>
        <SidebarRight />
      </SidebarProvider>
    </SidebarFrame>
  )
}
