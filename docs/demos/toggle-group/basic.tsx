import type { ReactElement } from 'react'
import { ToggleGroup, ToggleGroupItem } from '@gedatou/cadenza-ui'
import { IconAlignCenter, IconAlignLeft, IconAlignRight } from '@tabler/icons-react'

// Default multiple={false}: only one item is pressed at a time. value is
// still an array; pressing the active item again releases it, leaving the
// array empty
export default function BasicDemo(): ReactElement {
  return (
    <ToggleGroup aria-label="Text alignment" defaultValue={['start']}>
      <ToggleGroupItem aria-label="Align left" value="start"><IconAlignLeft /></ToggleGroupItem>
      <ToggleGroupItem aria-label="Align center" value="center"><IconAlignCenter /></ToggleGroupItem>
      <ToggleGroupItem aria-label="Align right" value="end"><IconAlignRight /></ToggleGroupItem>
    </ToggleGroup>
  )
}
