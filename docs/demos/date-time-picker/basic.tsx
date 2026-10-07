import type { ReactElement } from 'react'
import { DateTimePicker } from '@gedatou/cadenza-ui'

// One-liner: with no children it renders the full default composition --
// editable input, clear ✕, picker button, and a popup with the calendar
// beside the hour/minute columns. Type "2026-08-16 09:30" and it takes effect
// immediately; a day pick keeps the time, a time pick keeps the day, and the
// popup stays open until you leave the field or press Esc.
export default function BasicDemo(): ReactElement {
  return <DateTimePicker aria-label="Date and time" placeholder="Pick a date and time" />
}
