import type { ComponentPropsWithoutRef, ReactElement, ReactNode } from 'react'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@gedatou/cadenza-ui'

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: ReactNode
  }[]
} & ComponentPropsWithoutRef<typeof SidebarGroup>): ReactElement {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map(item => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton size="sm" render={<a href={item.url} />}>
                {item.icon}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
