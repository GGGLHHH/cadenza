import type { ReactElement } from 'react'
import { Field, FieldDescription, FieldLabel, NumberField } from '@gedatou/cadenza-ui'

// 默认组合:不写 children 就有 减号/输入框/加号;根上的 id 由 Base UI
// 路由到真输入框,FieldLabel htmlFor 直连
export default function BasicDemo(): ReactElement {
  return (
    <Field className="max-inline-sm">
      <FieldLabel htmlFor="number-field-basic-copies">册数</FieldLabel>
      <NumberField id="number-field-basic-copies" defaultValue={4} min={0} max={99} />
      <FieldDescription>乐谱打印份数,0–99。</FieldDescription>
    </Field>
  )
}
