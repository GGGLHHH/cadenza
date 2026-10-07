import type { ReactElement } from 'react'
import { TimePicker } from '@gedatou/cadenza-ui'

// One-liner: with no children it renders the full default composition --
// editable input, clear ✕, clock button, and the hour/minute columns in a
// popup. Type "09:30" and it takes effect immediately; picks commit as they
// happen and the popup stays open until you leave the field or press Esc.
export default function BasicDemo(): ReactElement {
  return <TimePicker aria-label="Time" placeholder="Pick a time" />
}
