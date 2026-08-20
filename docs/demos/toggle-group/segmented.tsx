import type { ReactElement } from 'react'
import { ToggleGroup, ToggleGroupItem } from '@gedatou/cadenza-ui'

// spacing={0}: the gap goes to zero and every item gets the "fused into
// one bar" styles -- middle items lose their radius, the ends regain the
// outer radius, and adjacent borders of the outline variant merge into one
export default function SegmentedDemo(): ReactElement {
  return (
    <ToggleGroup aria-label="Time range" defaultValue={['week']} spacing={0} variant="outline">
      <ToggleGroupItem value="day">Day</ToggleGroupItem>
      <ToggleGroupItem value="week">Week</ToggleGroupItem>
      <ToggleGroupItem value="month">Month</ToggleGroupItem>
    </ToggleGroup>
  )
}
