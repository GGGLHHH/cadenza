import type { ReactElement } from 'react'
import { LoadingOverlay, Spinner } from '@gedatou/cadenza-ui'

// children fully replaces the default content -- when you bring your own
// copy, remember to make the Spinner decorative (aria-hidden) and let the
// text carry the semantics
export default function CustomDemo(): ReactElement {
  return (
    <div className="
      relative overflow-hidden rounded-xl border p-4 inline-full max-inline-sm
    "
    >
      <p className="text-sm text-muted-foreground">This content is being refreshed.</p>
      <p className="mbs-1 text-sm text-muted-foreground">You can still glimpse it under the frosted layer.</p>
      <LoadingOverlay loading>
        <span className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <Spinner aria-hidden />
          Loading data…
        </span>
      </LoadingOverlay>
    </div>
  )
}
