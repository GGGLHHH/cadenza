import type { DateTimePickerChangeEventDetails } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import { DateTimePicker } from '@gedatou/cadenza-ui'
import { format } from 'date-fns'
import { useState } from 'react'

// The controlled trio + details.reason: typing, picking a day or a time, and
// clearing all go through the same onValueChange; reason tells the sources
// apart. The controlled empty value is null.
export default function ControlledDemo(): ReactElement {
  const [value, setValue] = useState<Date | null>(() => new Date(2026, 7, 16, 9, 30))
  const [reason, setReason] = useState<string>('—')
  return (
    <div className="flex flex-col gap-2">
      <DateTimePicker
        aria-label="Date and time"
        placeholder="Pick a date and time"
        value={value}
        onValueChange={(next: Date | null, details: DateTimePickerChangeEventDetails) => {
          setValue(next)
          setReason(details.reason)
        }}
      />
      <p className="text-sm text-muted-foreground">
        Value:
        {' '}
        {/* Deterministic formatting: toLocaleString breaks hydration when SSR and browser locales differ */}
        {value === null ? 'empty' : format(value, 'yyyy-MM-dd HH:mm')}
        {' · last reason: '}
        {reason}
      </p>
    </div>
  )
}
