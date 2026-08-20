import type { ReactElement } from 'react'
import {
  InputGroup,
  InputGroupAddon,
  SearchField,
  SearchFieldClear,
  SearchFieldInput,
} from '@gedatou/cadenza-ui'
import { IconSearch } from '@tabler/icons-react'

// Composition: passing children takes over the internal structure
// entirely. Here a shortcut hint sits at the tail and yields its spot
// when the clear button appears
export default function CompositionDemo(): ReactElement {
  return (
    <div className="inline-full max-inline-sm">
      <SearchField aria-label="Search docs">
        <InputGroup>
          <InputGroupAddon>
            <IconSearch aria-hidden />
          </InputGroupAddon>
          <SearchFieldInput placeholder="Search docs..." />
          <SearchFieldClear />
          <kbd className="
            order-last me-2 hidden rounded-sm border bg-muted px-1.5 font-mono
            text-[10px] text-muted-foreground
            group-data-empty/search-field:inline
          "
          >
            ⌘K
          </kbd>
        </InputGroup>
      </SearchField>
    </div>
  )
}
