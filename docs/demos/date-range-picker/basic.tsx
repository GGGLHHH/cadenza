import type { ReactElement } from 'react'
import { DateRangePicker } from '@gedatou/cadenza-ui'

// One-liner: two inputs + a two-month calendar. In the calendar the first
// press sets the start, the second completes the range and closes; both
// inputs also accept typing, and when the start moves past the end, the
// end is cleared.
export default function BasicDemo(): ReactElement {
  return (
    <DateRangePicker
      aria-label="Date range"
      endPlaceholder="End date"
      startPlaceholder="Start date"
    />
  )
}
