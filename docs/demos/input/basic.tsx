import type { ReactElement } from 'react'
import { Field, FieldDescription, FieldLabel, Input } from '@gedatou/cadenza-ui'

// The plain label channel: the id lands on the real <input> and FieldLabel
// htmlFor points at it; the accessible name and "click the label to focus"
// both come from this native association, with none of the box-only detour.
export default function BasicDemo(): ReactElement {
  return (
    <Field className="max-inline-sm">
      <FieldLabel htmlFor="input-basic-title">Work title</FieldLabel>
      <Input id="input-basic-title" name="title" placeholder="Gaspard de la nuit" />
      <FieldDescription>Shown publicly, can be changed later.</FieldDescription>
    </Field>
  )
}
