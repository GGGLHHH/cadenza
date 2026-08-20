import type { ReactElement } from 'react'
import { Field, FieldLabel, Textarea } from '@gedatou/cadenza-ui'

// Same channel as Input: the id lands on the real <textarea>
export default function TextareaDemo(): ReactElement {
  return (
    <Field className="inline-full max-inline-sm">
      <FieldLabel htmlFor="field-textarea-notes">Programme notes</FieldLabel>
      <Textarea id="field-textarea-notes" name="notes" placeholder="This text will be printed on the programme." />
    </Field>
  )
}
