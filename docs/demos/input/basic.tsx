import type { ReactElement } from 'react'
import { Field, FieldDescription, FieldLabel, Input } from '@gedatou/cadenza-ui'

// 普通 label 通道:id 落在真 <input> 上,FieldLabel htmlFor 指过去,
// 无障碍名和「点标签聚焦」都由这条原生关联给出,没有 box-only 那种绕路。
export default function BasicDemo(): ReactElement {
  return (
    <Field className="max-inline-sm">
      <FieldLabel htmlFor="input-basic-title">作品名</FieldLabel>
      <Input id="input-basic-title" name="title" placeholder="夜之加斯帕" />
      <FieldDescription>公开显示,之后可以改。</FieldDescription>
    </Field>
  )
}
