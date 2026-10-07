import type { ReactElement } from 'react'
import { TimePicker } from '@gedatou/cadenza-ui'

// min / max bound the time of day (their dates are ignored): options outside
// are disabled, typed times outside are rejected. Picking 08 while the minutes
// sit before 08:30 slides them onto the first allowed one.
const OPENS = new Date(2000, 0, 1, 8, 30)
const CLOSES = new Date(2000, 0, 1, 17, 30)

export default function MinMaxDemo(): ReactElement {
  return <TimePicker aria-label="Visit time" max={CLOSES} min={OPENS} placeholder="08:30 – 17:30" />
}
