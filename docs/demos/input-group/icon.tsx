import type { ReactElement } from 'react'
import { CheckIcon, MailIcon, SearchIcon } from '@gedatou/cadenza-icons'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@gedatou/cadenza-ui'

// Icon prefixes and suffixes: align picks the start or end of the line,
// defaulting to inline-start
export default function IconDemo(): ReactElement {
  return (
    <div className="flex flex-col gap-3 inline-full max-inline-sm">
      <InputGroup>
        <InputGroupAddon>
          <SearchIcon animateOnHover aria-hidden />
        </InputGroupAddon>
        <InputGroupInput aria-label="Search" placeholder="Search..." />
      </InputGroup>
      <InputGroup>
        <InputGroupAddon>
          <MailIcon animateOnHover aria-hidden />
        </InputGroupAddon>
        <InputGroupInput aria-label="Email" placeholder="you@example.com" type="email" />
        <InputGroupAddon align="inline-end">
          <CheckIcon animateOnHover aria-hidden className="text-emerald-600" />
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}
