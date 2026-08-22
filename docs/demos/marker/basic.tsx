import type { ReactElement } from 'react'
import { Marker, MarkerContent } from '@gedatou/cadenza-ui'

// A marker is a row that says something about the conversation rather than in
// it. Muted, small, and never competing with a message.
export default function BasicDemo(): ReactElement {
  return (
    <div className="mx-auto flex flex-col gap-4 inline-full max-inline-sm">
      <Marker>
        <MarkerContent>Ines changed the programme</MarkerContent>
      </Marker>
      <Marker variant="separator">
        <MarkerContent>Today</MarkerContent>
      </Marker>
    </div>
  )
}
