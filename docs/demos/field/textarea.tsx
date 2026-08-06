import type { ReactElement } from 'react'
import { Field, FieldLabel, Textarea } from '@gedatou/cadenza-ui'

// 和 Input 同一条通道:id 落在真正的 <textarea> 上
export default function TextareaDemo(): ReactElement {
  return (
    <Field className="inline-full max-inline-sm">
      <FieldLabel htmlFor="field-textarea-notes">曲目说明</FieldLabel>
      <Textarea id="field-textarea-notes" name="notes" placeholder="节目单上会印这一段。" />
    </Field>
  )
}
