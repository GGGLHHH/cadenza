import type { ReactElement } from 'react'
import { Button, Tooltip, TooltipPopup, TooltipTrigger } from '@gedatou/cadenza-ui'

// A disabled button swallows pointer events, so the trigger is a span around
// it; the tooltip still explains why the action is unavailable
export default function DisabledDemo(): ReactElement {
  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" />}>
        <Button variant="outline" disabled>Delete</Button>
      </TooltipTrigger>
      <TooltipPopup>You need write access to delete</TooltipPopup>
    </Tooltip>
  )
}
