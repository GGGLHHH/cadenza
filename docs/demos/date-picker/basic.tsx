import type { ReactElement } from 'react'
import { DatePicker } from '@gedatou/cadenza-ui'

// One-liner: with no children it renders the full default composition --
// editable input, clear ✕, calendar button, and popup calendar all in
// place. Click the input or the calendar button to open, or type
// "2026-08-16" directly and it takes effect immediately.
export default function BasicDemo(): ReactElement {
  return <DatePicker aria-label="Date" placeholder="Pick a date" />
}
