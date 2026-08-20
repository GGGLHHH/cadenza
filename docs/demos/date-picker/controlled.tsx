import type { DatePickerChangeEventDetails } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import { DatePicker } from '@gedatou/cadenza-ui'
import { format } from 'date-fns'
import { useState } from 'react'

// The controlled trio + details.reason: typing, picking a day, and
// clearing all go through the same onValueChange; reason tells the
// sources apart. The controlled empty value is null.
export default function ControlledDemo(): ReactElement {
  const [value, setValue] = useState<Date | null>(() => new Date(2026, 7, 16))
  const [reason, setReason] = useState<string>('—')
  return (
    <div className="flex flex-col gap-2">
      <DatePicker
        aria-label="Date"
        placeholder="Pick a date"
        value={value}
        onValueChange={(next: Date | null, details: DatePickerChangeEventDetails) => {
          setValue(next)
          setReason(details.reason)
        }}
      />
      <p className="text-sm text-muted-foreground">
        Value:
        {' '}
        {/* Deterministic formatting: toLocaleDateString breaks hydration when SSR and browser locales differ */}
        {value === null ? 'empty' : format(value, 'yyyy-MM-dd')}
        {' · last reason: '}
        {reason}
      </p>
    </div>
  )
}
