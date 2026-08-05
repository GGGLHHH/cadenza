import type { ReactElement } from 'react'
import { Field, FieldDescription, FieldLabel, Textarea } from '@gedatou/cadenza-ui'

// 纯 <textarea>:标签同样走 FieldLabel htmlFor → id。
// 多敲几行就会看到它跟着内容长高(field-sizing-content),下限是 min-h-16。
export default function BasicDemo(): ReactElement {
  return (
    <Field className="max-inline-sm">
      <FieldLabel htmlFor="textarea-basic-notes">曲目说明</FieldLabel>
      <Textarea
        id="textarea-basic-notes"
        name="notes"
        placeholder="写给听众的一段话,节目单上会印。"
      />
      <FieldDescription>随内容长高,不用自己拖。</FieldDescription>
    </Field>
  )
}
