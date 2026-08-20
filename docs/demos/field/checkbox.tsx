import type { ReactElement } from 'react'
import { Checkbox, Field, FieldContent, FieldDescription, FieldLabel } from '@gedatou/cadenza-ui'

// box-only: the root element is the box itself; the id lands on the hidden
// <input>. orientation="horizontal" puts the control first, text after; with
// a description, FieldContent stacks "label + description" into one column
export default function CheckboxDemo(): ReactElement {
  return (
    <Field className="max-inline-sm" orientation="horizontal">
      <Checkbox defaultChecked id="field-checkbox-newsletter" name="newsletter" />
      <FieldContent>
        <FieldLabel htmlFor="field-checkbox-newsletter">Season newsletter</FieldLabel>
        <FieldDescription>Get an email when new concerts go on sale.</FieldDescription>
      </FieldContent>
    </Field>
  )
}
