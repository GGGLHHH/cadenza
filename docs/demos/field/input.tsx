import type { ReactElement } from 'react'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@gedatou/cadenza-ui'
import { IconSearch } from '@tabler/icons-react'

// 最普通的那条通道:id 落在真正的 <input> 上,FieldLabel htmlFor 指过去。
// 有东西要和输入框共用边框时换 InputGroup —— id 仍落在里面那个输入框上,
// 标签这条线一个字不用改
export default function InputDemo(): ReactElement {
  return (
    <FieldGroup className="inline-full max-inline-sm">
      <Field>
        <FieldLabel htmlFor="field-input-title">作品名</FieldLabel>
        <Input id="field-input-title" name="title" placeholder="夜之加斯帕" />
        <FieldDescription>公开显示,之后可以改。</FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="field-input-keyword">检索关键词</FieldLabel>
        <InputGroup>
          <InputGroupAddon><IconSearch /></InputGroupAddon>
          <InputGroupInput id="field-input-keyword" placeholder="拉威尔" />
        </InputGroup>
        <FieldDescription>带图标就换 InputGroup,id 仍然落在里面那个输入框上。</FieldDescription>
      </Field>
    </FieldGroup>
  )
}
