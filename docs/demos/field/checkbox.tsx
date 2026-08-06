import type { ReactElement } from 'react'
import { Checkbox, Field, FieldContent, FieldDescription, FieldLabel } from '@gedatou/cadenza-ui'

// box-only:根元素就是那个方块,id 落在隐藏 <input> 上。orientation="horizontal"
// 控件在前、文字在后;带描述时用 FieldContent 把「标签 + 描述」装成一列
export default function CheckboxDemo(): ReactElement {
  return (
    <Field className="max-inline-sm" orientation="horizontal">
      <Checkbox defaultChecked id="field-checkbox-newsletter" name="newsletter" />
      <FieldContent>
        <FieldLabel htmlFor="field-checkbox-newsletter">乐季简报</FieldLabel>
        <FieldDescription>新的场次开票时给你发一封邮件。</FieldDescription>
      </FieldContent>
    </Field>
  )
}
