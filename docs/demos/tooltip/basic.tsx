import type { ReactElement } from 'react'
import { Button, Tooltip, TooltipPopup, TooltipTrigger } from '@gedatou/cadenza-ui'

// The default composition: a trigger that borrows the library Button, and a
// popup that opens on hover and on keyboard focus alike
export default function BasicDemo(): ReactElement {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline" />}>Hover</TooltipTrigger>
      <TooltipPopup>Add to library</TooltipPopup>
    </Tooltip>
  )
}
