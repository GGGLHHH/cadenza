import type { ReactElement } from 'react'
import { Button, Kbd, Tooltip, TooltipPopup, TooltipTrigger } from '@gedatou/cadenza-ui'

// Kbd inside a tooltip inverts its colours on its own — the vendored Kbd
// styles key on the popup's `tooltip-content` slot
export default function KeyboardDemo(): ReactElement {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline" />}>Save</TooltipTrigger>
      <TooltipPopup>
        Save changes
        <Kbd>⌘S</Kbd>
      </TooltipPopup>
    </Tooltip>
  )
}
