import type { ReactElement } from 'react'
import { Button, Kbd, KbdGroup, Tooltip, TooltipPopup, TooltipTrigger } from '@gedatou/cadenza-ui'

// Kbd inside a tooltip inverts its colours on its own — the vendored Kbd
// styles key on the popup's `tooltip-content` slot, no prop involved
export default function TooltipDemo(): ReactElement {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline" />}>Save</TooltipTrigger>
      <TooltipPopup>
        Save changes
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>S</Kbd>
        </KbdGroup>
      </TooltipPopup>
    </Tooltip>
  )
}
