import type { ReactElement } from 'react'
import { Stepper } from '@gedatou/cadenza-ui'

// orientation="vertical": the root stacks vertically and the connectors
// turn into vertical lines; the default composition applies just the same
export default function VerticalDemo(): ReactElement {
  return <Stepper defaultValue={2} orientation="vertical" steps={4} />
}
