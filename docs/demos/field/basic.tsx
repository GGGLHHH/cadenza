import type { ReactElement } from 'react'
import {
  Field,
  FieldDescription,
  FieldLabel,
  InputGroup,
  InputGroupInput,
} from '@gedatou/cadenza-ui'

// Field 一列 = 标签 + 控件 + 描述。标签靠 htmlFor → id 关联控件,
// 控件无关 —— 这里用 InputGroup,换成任何把 id 落在输入元素上的控件都一样
export default function BasicDemo(): ReactElement {
  return (
    <Field className="max-inline-sm">
      <FieldLabel htmlFor="field-basic-name">作品名</FieldLabel>
      <InputGroup>
        <InputGroupInput id="field-basic-name" placeholder="夜之加斯帕" />
      </InputGroup>
      <FieldDescription>公开显示,之后可以改。</FieldDescription>
    </Field>
  )
}
