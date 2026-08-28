import type { ReactElement } from 'react'
import { Marker, MarkerContent, MarkerIcon, Spinner } from '@gedatou/cadenza-ui'

// role="status" is what makes assistive tech announce the row when it
// appears — without it a screen reader only finds the update if the reader
// happens to go looking. The Spinner is the visual half of the same signal.
export default function StatusDemo(): ReactElement {
  return (
    <div className="mx-auto flex flex-col gap-4 inline-full max-inline-sm">
      <Marker role="status">
        <MarkerIcon>
          <Spinner />
        </MarkerIcon>
        <MarkerContent>Checking the hall booking…</MarkerContent>
      </Marker>
      <Marker role="status">
        <MarkerIcon>
          <Spinner />
        </MarkerIcon>
        <MarkerContent>Reading the rehearsal notes…</MarkerContent>
      </Marker>
    </div>
  )
}
