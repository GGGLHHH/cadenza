import type { ReactElement } from 'react'
import { Button, LoadingOverlay } from '@gedatou/cadenza-ui'
import { useState } from 'react'

// Pure overlay: drop it into a relative parent and it fills the same box by
// default. Content stays faintly visible under the frosted glass, the
// pointer is blocked, the cursor is wait; toggling cross-fades 150ms in
// both directions
export default function BasicDemo(): ReactElement {
  const [loading, setLoading] = useState(true)
  return (
    <div className="flex flex-col items-start gap-3">
      <div className="
        relative overflow-hidden rounded-xl border p-4 inline-full max-inline-sm
      "
      >
        <p className="text-sm font-medium">Paris dates</p>
        <p className="mbs-1 text-sm text-muted-foreground">
          Ravel's Piano Concerto in G, Théâtre des Champs-Élysées, October 14.
        </p>
        <p className="mbs-1 text-sm text-muted-foreground">
          Stravinsky's The Rite of Spring on the same bill.
        </p>
        <LoadingOverlay loading={loading} />
      </div>
      <Button size="sm" variant="outline" onClick={() => setLoading(v => !v)}>
        {loading ? 'Stop loading' : 'Start loading'}
      </Button>
    </div>
  )
}
