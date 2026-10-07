import type { ReactElement } from 'react'
import { TimePicker } from '@gedatou/cadenza-ui'

// minuteStep thins the minutes column to multiples of the step, and a typed
// time off the step is rejected the same way -- try typing "09:20".
export default function StepDemo(): ReactElement {
  return <TimePicker aria-label="Slot start" minuteStep={15} placeholder="Quarter hours" />
}
