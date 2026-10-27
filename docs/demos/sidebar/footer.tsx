import type { ReactElement } from 'react'
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuPopup,
  DropdownMenuTrigger,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@gedatou/cadenza-ui'
import { ChevronUpIcon } from '@gedatou/cadenza-ui/icons'
import { SidebarFrame } from '../lib/sidebar-frame'

// shadcn's sidebar-footer example: an account menu pinned to the footer — a
// dropdown that opens upward and matches its trigger's width.
export default function SidebarFooterDemo(): ReactElement {
  return (
    <SidebarFrame>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader />
          <SidebarContent />
          <SidebarFooter>
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
                    Username
                    <ChevronUpIcon className="ms-auto" />
                  </DropdownMenuTrigger>
                  <DropdownMenuPopup
                    side="top"
                    className="inline-(--anchor-width)"
                  >
                    <DropdownMenuItem>
                      <span>Account</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <span>Billing</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuPopup>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
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
