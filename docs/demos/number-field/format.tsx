import type { ReactElement } from 'react'
import { Field, FieldDescription, FieldLabel, NumberField } from '@gedatou/cadenza-ui'

// format takes Intl.NumberFormatOptions: the display carries a currency
// symbol while the value stays a plain number; step sets the increment
export default function FormatDemo(): ReactElement {
  return (
    <Field className="max-inline-sm">
      <FieldLabel htmlFor="number-field-format-fee">Group fee</FieldLabel>
      <NumberField
        id="number-field-format-fee"
        defaultValue={200}
        min={0}
        step={50}
        format={{ style: 'currency', currency: 'CNY' }}
      />
      <FieldDescription>Steps by 50, displays as CNY, the value stays a plain number.</FieldDescription>
    </Field>
  )
}
