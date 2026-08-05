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
  Textarea,
} from '@gedatou/cadenza-ui'
import { IconSearch } from '@tabler/icons-react'

// 最普通的那条通道:id 落在真正的 <input> / <textarea> 上,FieldLabel htmlFor
// 指过去,一次给出无障碍名和「点标签聚焦」。Input / Textarea / InputOTP /
// ComboboxInput 都属于这一类。
// 有东西要和输入框共用边框时才换 InputGroup —— 边框归那一行所有。
export default function TextDemo(): ReactElement {
  return (
    <FieldGroup className="inline-full max-inline-sm">
      <Field>
        <FieldLabel htmlFor="field-text-title">作品名</FieldLabel>
        <Input id="field-text-title" name="title" placeholder="夜之加斯帕" />
        <FieldDescription>公开显示,之后可以改。</FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="field-text-notes">曲目说明</FieldLabel>
        <Textarea id="field-text-notes" name="notes" placeholder="节目单上会印这一段。" />
      </Field>

      <Field>
        <FieldLabel htmlFor="field-text-keyword">检索关键词</FieldLabel>
        <InputGroup>
          <InputGroupAddon><IconSearch /></InputGroupAddon>
          <InputGroupInput id="field-text-keyword" placeholder="拉威尔" />
        </InputGroup>
        <FieldDescription>带图标就换 InputGroup,id 仍然落在里面那个输入框上。</FieldDescription>
      </Field>
    </FieldGroup>
  )
}
