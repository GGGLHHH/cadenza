import type { ReactElement, ReactNode } from 'react'
import { EllipsisIcon } from '@gedatou/cadenza-icons'
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuPopup,
  DropdownMenuTrigger,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@gedatou/cadenza-ui'

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: ReactNode
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}): ReactElement {
  const { isMobile } = useSidebar()
  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map(item => (
          <DropdownMenu key={item.title}>
            <SidebarMenuItem>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton className="aria-expanded:bg-muted" />
                }
              >
                {item.title}
                {' '}
                <EllipsisIcon className="ms-auto" />
              </DropdownMenuTrigger>
              {item.items !== undefined && item.items.length > 0
                ? (
                    <DropdownMenuPopup
                      side={isMobile ? 'bottom' : 'right'}
                      align={isMobile ? 'end' : 'start'}
                      className="rounded-lg min-inline-56"
                    >
                      {item.items.map(item => (
                        <DropdownMenuItem
                          key={item.title}
                          render={<a href={item.url} />}
                        >
                          {item.title}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuPopup>
                  )
                : null}
            </SidebarMenuItem>
          </DropdownMenu>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
