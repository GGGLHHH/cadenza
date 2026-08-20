import type { ReactElement } from 'react'
import { SearchField } from '@gedatou/cadenza-ui'

// Disabled: the whole field is uneditable, and the clear button goes
// inert along with it
export default function DisabledDemo(): ReactElement {
  return (
    <div className="flex flex-col gap-3 inline-full max-inline-sm">
      <SearchField
        aria-label="Search composers (disabled)"
        placeholder="Search composers..."
        defaultValue="Ravel"
        disabled
      />
      <SearchField
        aria-label="Search composers (read-only)"
        placeholder="Search composers..."
        defaultValue="Ravel"
        readOnly
      />
    </div>
  )
}
