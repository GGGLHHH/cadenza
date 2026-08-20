import type { ReactElement } from 'react'
import { Stepper } from '@gedatou/cadenza-ui'

// Default composition: omit children and steps renders the full
// "numbered indicator + connector" bar. defaultValue picks the starting
// step; completed steps get a ✓, the current step is highlighted, and
// triggers are clickable for jumping between steps
export default function BasicDemo(): ReactElement {
  return <Stepper className="max-inline-sm" defaultValue={2} steps={4} />
}
