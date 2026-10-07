import type { ReactElement } from 'react'
import { DateTimePicker } from '@gedatou/cadenza-ui'
import { useState } from 'react'

// "No later than now" -- max is an instant: later days are disabled in the
// calendar, and on today the columns disable the hours and minutes still to
// come. A pick that would cross the bound lands on it instead (try picking
// today while the time reads late in the evening).
export default function MinMaxDemo(): ReactElement {
  const [now] = useState(() => new Date())
  return <DateTimePicker aria-label="Contacted at" max={now} placeholder="Up to now" />
}
