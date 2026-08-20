import type { NumberFieldChangeEventDetails } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import { Field, FieldDescription, FieldLabel, NumberField } from '@gedatou/cadenza-ui'
import { useState } from 'react'

// The controlled trio: value / onValueChange(value, details); clearing the
// input yields null, and details.reason distinguishes typing, the stepper
// buttons, arrow keys, and other sources
export default function ControlledDemo(): ReactElement {
  const [value, setValue] = useState<number | null>(2)
  const [reason, setReason] = useState('—')

  return (
    <Field className="max-inline-sm">
      <FieldLabel htmlFor="number-field-controlled-seats">Reserved seats</FieldLabel>
      <NumberField
        id="number-field-controlled-seats"
        value={value}
        min={0}
        max={8}
        onValueChange={(next: number | null, details: NumberFieldChangeEventDetails) => {
          setValue(next)
          setReason(details.reason)
        }}
      />
      <FieldDescription>
        Current value:
        {' '}
        {value === null ? 'null (cleared)' : value}
        , last change reason:
        {' '}
        {reason}
      </FieldDescription>
    </Field>
  )
}
