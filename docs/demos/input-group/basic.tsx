import type { ReactElement } from 'react'
import { SearchIcon } from '@gedatou/cadenza-icons'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@gedatou/cadenza-ui'

// InputGroup at a glance: icon, input, and button share a single border, and
// the focus ring is drawn around the whole group -- on focus it is the outer
// ring that changes, not the input's own border
export default function BasicDemo(): ReactElement {
  return (
    <InputGroup className="max-inline-sm">
      <InputGroupAddon>
        <SearchIcon animateOnHover aria-hidden />
      </InputGroupAddon>
      <InputGroupInput aria-label="Search works" placeholder="Search works..." />
      <InputGroupAddon align="inline-end">
        <InputGroupButton variant="default">Search</InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}
