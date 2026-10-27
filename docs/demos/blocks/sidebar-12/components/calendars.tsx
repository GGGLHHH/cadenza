import type { ReactElement } from 'react'
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@gedatou/cadenza-ui'
import { CheckIcon, ChevronRightIcon } from '@gedatou/cadenza-ui/icons'
import { Fragment } from 'react'

export function Calendars({
  calendars,
}: {
  calendars: {
    name: string
    items: string[]
  }[]
}): ReactElement {
  return (
    <>
      {calendars.map((calendar, index) => (
        <Fragment key={calendar.name}>
          <SidebarGroup key={calendar.name}>
            <Collapsible
              defaultOpen={index === 0}
              className="group/collapsible"
            >
              <SidebarGroupLabel
                className="
                  group/label text-sm text-sidebar-foreground inline-full
                  hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                "
                render={<CollapsibleTrigger />}
              >
                {calendar.name}
                {' '}
                <ChevronRightIcon className="
                  ms-auto transition-transform
                  group-data-open/collapsible:rotate-90
                "
                />
              </SidebarGroupLabel>
              <CollapsiblePanel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {calendar.items.map((item, index) => (
                      <SidebarMenuItem key={item}>
                        <SidebarMenuButton>
                          <div
                            data-active={index < 2}
                            className="
                              group/calendar-item flex aspect-square shrink-0
                              items-center justify-center rounded-sm border
                              border-sidebar-border
                              text-sidebar-primary-foreground block-4 inline-4
                              data-[active=true]:border-sidebar-primary
                              data-[active=true]:bg-sidebar-primary
                            "
                          >
                            <CheckIcon className="
                              hidden block-3 inline-3
                              group-data-[active=true]/calendar-item:block
                            "
                            />
                          </div>
                          {item}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsiblePanel>
            </Collapsible>
          </SidebarGroup>
          <SidebarSeparator className="mx-0" />
        </Fragment>
      ))}
    </>
  )
}
