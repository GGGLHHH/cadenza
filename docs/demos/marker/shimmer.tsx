import type { ReactElement } from 'react'
import { Marker, MarkerContent } from '@gedatou/cadenza-ui'

// The shimmer utility animates the text itself, which is the honest indicator
// for streaming output: the thing that is arriving is the thing that moves.
// Pair it with role="status" so it is announced, not just seen.
export default function ShimmerDemo(): ReactElement {
  return (
    <div className="mx-auto flex flex-col gap-4 inline-full max-inline-sm">
      <Marker role="status">
        <MarkerContent className="shimmer">Thinking…</MarkerContent>
      </Marker>
      <Marker role="status">
        <MarkerContent className="shimmer">Reading the rehearsal notes…</MarkerContent>
      </Marker>
    </div>
  )
}
