import type { ReactElement } from 'react'
import { Calendar, SidebarGroup, SidebarGroupContent } from '@gedatou/cadenza-ui'
import { useState } from 'react'

export function DatePicker(): ReactElement {
  const [date, setDate] = useState<Date | undefined>(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 12)
  })
  return (
    <SidebarGroup className="px-0">
      <SidebarGroupContent>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          captionLayout="dropdown"
          className="bg-transparent [--cell-size:2.1rem]"
        />
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
