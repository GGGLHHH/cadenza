'use client'

import type { ReactElement } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuGroupLabel,
  DropdownMenuPopup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'

// Radio group: the controlled pair value / onValueChange, mutually exclusive
// within the group, with the trigger echoing the current choice.
export default function RadioGroupDemo(): ReactElement {
  const [sort, setSort] = useState('name')
  const labels: Record<string, string> = { name: 'By name', date: 'By date', size: 'By size' }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        {`Sort: ${labels[sort]}`}
      </DropdownMenuTrigger>
      <DropdownMenuPopup>
        {/* RadioGroup is itself a group; a GroupLabel inside it becomes the group's title */}
        <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
          <DropdownMenuGroupLabel>Sort by</DropdownMenuGroupLabel>
          <DropdownMenuRadioItem value="name">By name</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="date">By date</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="size">By size</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuPopup>
    </DropdownMenu>
  )
}
