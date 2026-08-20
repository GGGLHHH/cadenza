import type { ReactElement } from 'react'
import { ColorPicker, Field, FieldLabel } from '@gedatou/cadenza-ui'

// A box-only control: the visible label goes not through children but
// through Field + FieldLabel htmlFor -- the id lands on the trigger
// button. Once an id is given, the built-in English aria fallback steps
// aside, and this label is what the screen reader hears
export default function LabelDemo(): ReactElement {
  return (
    <Field className="max-inline-sm" orientation="horizontal">
      <FieldLabel htmlFor="brand-color">Brand color</FieldLabel>
      <ColorPicker id="brand-color" defaultValue="#16a34a" />
    </Field>
  )
}
