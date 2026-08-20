import type { ReactElement } from 'react'
import { ToggleGroup, ToggleGroupItem } from '@gedatou/cadenza-ui'
import { IconLayoutGrid, IconLayoutList, IconTable } from '@tabler/icons-react'

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
      <ToggleGroupItem value="list">
        <IconLayoutList />
        List
      </ToggleGroupItem>
      <ToggleGroupItem value="grid">
        <IconLayoutGrid />
        Grid
      </ToggleGroupItem>
      <ToggleGroupItem value="table">
        <IconTable />
        Table
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
