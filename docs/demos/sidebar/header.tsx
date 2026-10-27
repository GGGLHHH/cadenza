import type { ReactElement } from 'react'
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuPopup,
  DropdownMenuTrigger,
  Sidebar,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@gedatou/cadenza-ui'
import { ChevronDownIcon } from '@gedatou/cadenza-ui/icons'
import { SidebarFrame } from '../lib/sidebar-frame'

// shadcn's sidebar-header example: a workspace switcher in the header — a
// dropdown whose trigger is a menu button and whose popup matches its width.
export default function SidebarHeaderDemo(): ReactElement {
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
                      <SidebarMenuButton className="
                        data-popup-open:bg-sidebar-accent
                        data-popup-open:text-sidebar-accent-foreground
                      "
                      />
                    )}
                  >
                    Select Workspace
                    <ChevronDownIcon className="ms-auto" />
                  </DropdownMenuTrigger>
                  <DropdownMenuPopup className="inline-(--anchor-width)">
                    <DropdownMenuItem>
                      <span>Acme Inc</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <span>Acme Corp.</span>
                    </DropdownMenuItem>
                  </DropdownMenuPopup>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
        </Sidebar>
        <SidebarInset>
          <header className="flex items-center justify-between px-4 block-12">
            <SidebarTrigger />
          </header>
        </SidebarInset>
      </SidebarProvider>
    </SidebarFrame>
  )
}
