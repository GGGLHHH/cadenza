import type { ReactElement } from 'react'
import { ToggleGroup, ToggleGroupItem } from '@gedatou/cadenza-ui'
import { AnimateIcon, LayoutGridIcon, ListIcon, TableIcon } from '@gedatou/cadenza-ui/icons'

// orientation="vertical": the group stacks and the arrow keys switch to
// ↑ / ↓ at the same time -- focus any item and press up/down to verify.
// This is exactly where the vendored version fell short (it looked
// vertical, but the keyboard still moved with ← / →)
export default function VerticalDemo(): ReactElement {
  return (
    <ToggleGroup
      aria-label="View"
      defaultValue={['list']}
      orientation="vertical"
      variant="outline"
    >
      <AnimateIcon animateOnHover asChild>
        <ToggleGroupItem value="list">
          <ListIcon />
          List
        </ToggleGroupItem>
      </AnimateIcon>
      <AnimateIcon animateOnHover asChild>
        <ToggleGroupItem value="grid">
          <LayoutGridIcon />
          Grid
        </ToggleGroupItem>
      </AnimateIcon>
      <AnimateIcon animateOnHover asChild>
        <ToggleGroupItem value="table">
          <TableIcon />
          Table
        </ToggleGroupItem>
      </AnimateIcon>
    </ToggleGroup>
  )
}
