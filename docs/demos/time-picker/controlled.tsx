import type { TimePickerChangeEventDetails } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import { TimePicker } from '@gedatou/cadenza-ui'
import { format } from 'date-fns'
import { useState } from 'react'

// The controlled trio + details.reason: typing, picking in the columns and
// clearing all go through the same onValueChange; reason tells the sources
// apart. The value is a Date whose date is kept across edits -- only the
// time of day changes.
export default function ControlledDemo(): ReactElement {
  const [value, setValue] = useState<Date | null>(() => new Date(2026, 7, 16, 9, 30))
  const [reason, setReason] = useState<string>('—')
  return (
    <div className="flex flex-col gap-2">
      <TimePicker
        aria-label="Time"
        placeholder="Pick a time"
        value={value}
        onValueChange={(next: Date | null, details: TimePickerChangeEventDetails) => {
          setValue(next)
          setReason(details.reason)
        }}
      />
      <p className="text-sm text-muted-foreground">
        Value:
        {' '}
        {value === null ? 'empty' : format(value, 'yyyy-MM-dd HH:mm')}
        {' · last reason: '}
        {reason}
      </p>
    </div>
  )
}
