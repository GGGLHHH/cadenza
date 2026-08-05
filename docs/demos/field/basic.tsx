import type { ReactElement } from 'react'
import { Field, FieldDescription, FieldLabel, Input } from '@gedatou/cadenza-ui'

// Field 一列 = 标签 + 控件 + 描述。标签靠 htmlFor → id 关联控件,
// 控件无关 —— 换成任何把 id 落在真元素上的控件都一样,写法一个字不用改
export default function BasicDemo(): ReactElement {
  return (
    <Field className="max-inline-sm">
      <FieldLabel htmlFor="field-basic-name">作品名</FieldLabel>
      <Input id="field-basic-name" placeholder="夜之加斯帕" />
      <FieldDescription>公开显示,之后可以改。</FieldDescription>
    </Field>
  )
}
