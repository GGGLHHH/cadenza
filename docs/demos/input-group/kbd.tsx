import type { ReactElement } from 'react'
import { SearchIcon } from '@gedatou/cadenza-icons'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@gedatou/cadenza-ui'

// Shortcut hint: put a <kbd> in the addon; InputGroup aligns it and strips
// the extra margins for you
export default function KbdDemo(): ReactElement {
  return (
    <div className="inline-full max-inline-sm">
      <InputGroup>
        <InputGroupAddon>
          <SearchIcon animateOnHover aria-hidden />
        </InputGroupAddon>
        <InputGroupInput aria-label="Search docs" placeholder="Search docs..." />
        <InputGroupAddon align="inline-end">
          <kbd className="
            rounded-sm border bg-muted px-1.5 font-mono text-[10px]
            text-muted-foreground
          "
          >
            ⌘K
          </kbd>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}
