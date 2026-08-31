import type { ReactElement } from 'react'
import { Button, Tooltip, TooltipPopup, TooltipTrigger } from '@gedatou/cadenza-ui'

const SIDES = ['top', 'right', 'bottom', 'left'] as const

// `side` is the positioner knob the popup forwards; the arrow follows it
export default function SidesDemo(): ReactElement {
  return (
    <div className="flex flex-wrap gap-2">
      {SIDES.map(side => (
        <Tooltip key={side}>
          <TooltipTrigger render={(
            <Button
              variant="outline"
              className="capitalize"
            />
          )}
          >
            {side}
          </TooltipTrigger>
          <TooltipPopup side={side}>Add to library</TooltipPopup>
        </Tooltip>
      ))}
    </div>
  )
}
