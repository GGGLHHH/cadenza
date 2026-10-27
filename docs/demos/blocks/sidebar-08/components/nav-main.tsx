import type { ReactElement, ReactNode } from 'react'
import { ChevronRightIcon } from '@gedatou/cadenza-icons'
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@gedatou/cadenza-ui'

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon: ReactNode
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}): ReactElement {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map(item => (
          <Collapsible
            key={item.title}
            defaultOpen={item.isActive}
            render={<SidebarMenuItem />}
          >
            <SidebarMenuButton
              tooltip={item.title}
              render={<a href={item.url} />}
            >
              {item.icon}
              <span>{item.title}</span>
            </SidebarMenuButton>
            {(item.items?.length ?? 0) > 0
              ? (
                  <>
                    <CollapsibleTrigger
                      render={
                        <SidebarMenuAction className="aria-expanded:rotate-90" />
                      }
                    >
                      <ChevronRightIcon />
                      <span className="sr-only">Toggle</span>
                    </CollapsibleTrigger>
                    <CollapsiblePanel>
                      <SidebarMenuSub>
                        {item.items?.map(subItem => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton render={<a href={subItem.url} />}>
                              <span>{subItem.title}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsiblePanel>
                  </>
                )
              : null}
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
