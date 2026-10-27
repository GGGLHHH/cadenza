import type { CSSProperties, ReactElement } from 'react'
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

// shadcn's sidebar-09 block: collapsible nested sidebars — an icon rail that
// picks a folder, beside a second sidebar listing that folder's mail.
export default function SidebarBlock09(): ReactElement {
  return (
    <SidebarFrame className="block-180">
      <SidebarProvider
        style={
          {
            '--sidebar-width': '350px',
          } as CSSProperties
        }
      >
        <AppSidebar />
        <SidebarInset>
          <header className="
            sticky inset-bs-0 flex shrink-0 items-center gap-2 border-be
            bg-background p-4
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
                  <BreadcrumbLink href="#">All Inboxes</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="
                  hidden
                  md:block
                "
                />
                <BreadcrumbItem>
                  <BreadcrumbPage>Inbox</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">
            {Array.from({ length: 24 }).map((_, index) => (
              <div
                // eslint-disable-next-line react/no-array-index-key -- static placeholders, never reordered
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
