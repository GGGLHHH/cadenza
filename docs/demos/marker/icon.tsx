import type { ReactElement } from 'react'
import { Marker, MarkerContent, MarkerIcon } from '@gedatou/cadenza-ui'
import { IconCalendarEvent, IconUserPlus } from '@tabler/icons-react'

// MarkerIcon is aria-hidden by default — the icon repeats what the text says,
// so announcing it twice would only slow a screen reader down.
export default function IconDemo(): ReactElement {
  return (
    <div className="mx-auto flex flex-col gap-4 inline-full max-inline-sm">
      <Marker>
        <MarkerIcon>
          <IconUserPlus />
        </MarkerIcon>
        <MarkerContent>Marcus joined the chat</MarkerContent>
      </Marker>
      <Marker variant="border">
        <MarkerIcon>
          <IconCalendarEvent />
        </MarkerIcon>
        <MarkerContent>Rehearsal moved to 14 October</MarkerContent>
      </Marker>
      {/* flex-col stacks the icon above the copy — the form the docs point at */}
      <Marker className="flex-col items-start gap-1" variant="separator">
        <MarkerIcon>
          <IconUserPlus />
        </MarkerIcon>
        <MarkerContent>Stacked</MarkerContent>
      </Marker>
    </div>
  )
}
