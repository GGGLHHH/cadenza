import type { ReactElement } from 'react'
import { ChevronDownIcon, MessageCircleQuestionIcon, SendIcon } from '@gedatou/cadenza-icons'
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@gedatou/cadenza-ui'
import { SidebarFrame } from '../lib/sidebar-frame'

// shadcn's sidebar-group-collapsible example: the group label is the
// Collapsible's trigger, folding the whole group away.
export default function SidebarGroupCollapsibleDemo(): ReactElement {
  return (
    <SidebarFrame>
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <Collapsible defaultOpen className="group/collapsible">
              <SidebarGroup>
                <SidebarGroupLabel
                  render={<CollapsibleTrigger />}
                  className="
                    text-sm
                    hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                  "
                >
                  Help
                  <ChevronDownIcon className="
                    ms-auto transition-transform
                    group-data-open/collapsible:rotate-180
                  "
                  />
                </SidebarGroupLabel>
                <CollapsiblePanel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton>
                          <MessageCircleQuestionIcon animateOnHover />
                          Support
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton>
                          <SendIcon animateOnHover />
                          Feedback
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsiblePanel>
              </SidebarGroup>
            </Collapsible>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    </SidebarFrame>
  )
}
