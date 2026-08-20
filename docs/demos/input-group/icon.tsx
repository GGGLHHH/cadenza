import type { ReactElement } from 'react'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@gedatou/cadenza-ui'
import { IconCheck, IconMail, IconSearch } from '@tabler/icons-react'

// Icon prefixes and suffixes: align picks the start or end of the line,
// defaulting to inline-start
export default function IconDemo(): ReactElement {
  return (
    <div className="flex flex-col gap-3 inline-full max-inline-sm">
      <InputGroup>
        <InputGroupAddon>
          <IconSearch aria-hidden />
        </InputGroupAddon>
        <InputGroupInput aria-label="Search" placeholder="Search..." />
      </InputGroup>
      <InputGroup>
        <InputGroupAddon>
          <IconMail aria-hidden />
        </InputGroupAddon>
        <InputGroupInput aria-label="Email" placeholder="you@example.com" type="email" />
        <InputGroupAddon align="inline-end">
          <IconCheck aria-hidden className="text-emerald-600" />
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}
