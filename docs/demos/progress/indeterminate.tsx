import type { ReactElement } from 'react'
import { Progress } from '@gedatou/cadenza-ui'

// `value={null}` is the indeterminate state: no `aria-valuenow`, and the
// indicator becomes a segment sliding along the track
export default function IndeterminateDemo(): ReactElement {
  return (
    <Progress
      value={null}
      aria-label="Working"
      className="inline-full max-inline-sm"
    />
  )
}
