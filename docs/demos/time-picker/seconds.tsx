import type { ReactElement } from 'react'
import { TimePicker } from '@gedatou/cadenza-ui'

// A seconds token in the format adds the seconds column -- the format is the
// one switch for both what is shown and what can be picked.
export default function SecondsDemo(): ReactElement {
  return <TimePicker aria-label="Time" format="HH:mm:ss" placeholder="HH:mm:ss" />
}
