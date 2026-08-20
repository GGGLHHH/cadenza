import type { ReactElement } from 'react'
import { Field, FieldDescription, FieldLabel, Input } from '@gedatou/cadenza-ui'

// A Field column = label + control + description. The label ties to the
// control via htmlFor → id, control-agnostic — swap in any control that puts
// the id on a real element and not a character of this changes
export default function BasicDemo(): ReactElement {
  return (
    <Field className="max-inline-sm">
      <FieldLabel htmlFor="field-basic-name">Title</FieldLabel>
      <Input id="field-basic-name" placeholder="Gaspard de la nuit" />
      <FieldDescription>Shown publicly; you can change it later.</FieldDescription>
    </Field>
  )
}
