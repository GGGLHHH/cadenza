import type { ReactElement } from 'react'
import { Field, FieldDescription, FieldLabel, NumberField } from '@gedatou/cadenza-ui'

// Default composition: omit children and you get minus / input / plus;
// Base UI routes the root id to the real input, so FieldLabel htmlFor
// connects directly
export default function BasicDemo(): ReactElement {
  return (
    <Field className="max-inline-sm">
      <FieldLabel htmlFor="number-field-basic-copies">Copies</FieldLabel>
      <NumberField id="number-field-basic-copies" defaultValue={4} min={0} max={99} />
      <FieldDescription>Number of score copies to print, 0-99.</FieldDescription>
    </Field>
  )
}
