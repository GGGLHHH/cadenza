import type { ReactElement } from 'react'
import { AlignCenterIcon, AlignLeftIcon, AlignRightIcon, AnimateIcon } from '@gedatou/cadenza-icons'
import { ToggleGroup, ToggleGroupItem } from '@gedatou/cadenza-ui'

// Default multiple={false}: only one item is pressed at a time. value is
// still an array; pressing the active item again releases it, leaving the
// array empty
export default function BasicDemo(): ReactElement {
  return (
    <ToggleGroup aria-label="Text alignment" defaultValue={['start']}>
      <AnimateIcon animateOnHover asChild><ToggleGroupItem aria-label="Align left" value="start"><AlignLeftIcon /></ToggleGroupItem></AnimateIcon>
      <AnimateIcon animateOnHover asChild><ToggleGroupItem aria-label="Align center" value="center"><AlignCenterIcon /></ToggleGroupItem></AnimateIcon>
      <AnimateIcon animateOnHover asChild><ToggleGroupItem aria-label="Align right" value="end"><AlignRightIcon /></ToggleGroupItem></AnimateIcon>
    </ToggleGroup>
  )
}
