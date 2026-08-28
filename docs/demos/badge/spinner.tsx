import type { ReactElement } from 'react'
import { Badge, Spinner } from '@gedatou/cadenza-ui'

// A Spinner inside a badge is decoration: aria-hidden keeps its role="status"
// out of the accessibility tree, and data-icon trims the padding like an icon
export default function SpinnerDemo(): ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="secondary">
        <Spinner data-icon="inline-start" aria-hidden />
        Syncing
      </Badge>
      <Badge variant="outline">
        Deploying
        <Spinner data-icon="inline-end" aria-hidden />
      </Badge>
    </div>
  )
}
