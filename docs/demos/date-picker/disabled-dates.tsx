import type { ReactElement } from 'react'
import { DatePicker } from '@gedatou/cadenza-ui'
import { useState } from 'react'

// disabledDates is a react-day-picker matcher: those days can't be
// clicked in the calendar, and typing them is rejected the same way --
// try entering a past date and the value will not change.
export default function DisabledDatesDemo(): ReactElement {
  const [today] = useState(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return now
  })
  return (
    <DatePicker
      aria-label="Appointment date"
      disabledDates={{ before: today }}
      placeholder="From today onwards"
    />
  )
}
