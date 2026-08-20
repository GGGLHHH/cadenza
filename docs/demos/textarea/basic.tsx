import type { ReactElement } from 'react'
import { Field, FieldDescription, FieldLabel, Textarea } from '@gedatou/cadenza-ui'

// A plain <textarea>: the label goes through FieldLabel htmlFor -> id as
// usual. Type a few lines and it grows with the content
// (field-sizing-content), with min-h-16 as the floor.
export default function BasicDemo(): ReactElement {
  return (
    <Field className="max-inline-sm">
      <FieldLabel htmlFor="textarea-basic-notes">Programme notes</FieldLabel>
      <Textarea
        id="textarea-basic-notes"
        name="notes"
        placeholder="A note to the audience, printed in the programme."
      />
      <FieldDescription>Grows with the content, no dragging needed.</FieldDescription>
    </Field>
  )
}
