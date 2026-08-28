import type { ReactElement } from 'react'
import { Marker, MarkerContent } from '@gedatou/cadenza-ui'

// Labelled dividers: date breaks, section breaks, an unread line. The rules on
// either side are CSS pseudo-elements, so they never reach the accessibility
// tree — only the label does.
export default function SeparatorDemo(): ReactElement {
  return (
    <div className="mx-auto flex flex-col gap-4 inline-full max-inline-sm">
      <Marker variant="separator">
        <MarkerContent>Today</MarkerContent>
      </Marker>
      <Marker variant="separator">
        <MarkerContent>14 October</MarkerContent>
      </Marker>
      <Marker variant="separator">
        <MarkerContent>Unread</MarkerContent>
      </Marker>
    </div>
  )
}
