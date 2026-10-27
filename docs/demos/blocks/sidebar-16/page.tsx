import type { ReactElement } from 'react'
import { SidebarInset, SidebarProvider } from '@gedatou/cadenza-ui'
import { SidebarFrame } from '../../lib/sidebar-frame'
import { AppSidebar } from './components/app-sidebar'
import { SiteHeader } from './components/site-header'

// shadcn's sidebar-16 block: a sticky site header above the sidebar — the
// panel starts below --header-height, and the header holds the toggle and a
// search form.
export default function SidebarBlock16(): ReactElement {
  return (
    <SidebarFrame className="block-180">
      <div className="[--header-height:calc(--spacing(14))] block-full">
        <SidebarProvider className="flex flex-col">
          <SiteHeader />
          <div className="flex flex-1">
            <AppSidebar />
            <SidebarInset>
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
          </div>
        </SidebarProvider>
      </div>
    </SidebarFrame>
  )
}
