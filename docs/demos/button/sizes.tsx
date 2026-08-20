import type { ReactElement } from 'react'
import { Button } from '@gedatou/cadenza-ui'
import { IconPlus } from '@tabler/icons-react'

// Four height steps plus matching square icon steps; icon-only buttons
// must always get an aria-label
export default function SizesDemo(): ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="xs" variant="outline">Extra small</Button>
      <Button size="sm" variant="outline">Small</Button>
      <Button variant="outline">Default</Button>
      <Button size="lg" variant="outline">Large</Button>
      <Button aria-label="Add" size="icon-xs" variant="outline"><IconPlus /></Button>
      <Button aria-label="Add" size="icon-sm" variant="outline"><IconPlus /></Button>
      <Button aria-label="Add" size="icon" variant="outline"><IconPlus /></Button>
      <Button aria-label="Add" size="icon-lg" variant="outline"><IconPlus /></Button>
    </div>
  )
}
