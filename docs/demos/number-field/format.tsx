import type { ReactElement } from 'react'
import { Field, FieldDescription, FieldLabel, NumberField } from '@gedatou/cadenza-ui'

// format 走 Intl.NumberFormatOptions:显示带货币符号,值仍是纯数字;
// step 控制步进幅度
export default function FormatDemo(): ReactElement {
  return (
    <Field className="max-inline-sm">
      <FieldLabel htmlFor="number-field-format-fee">团费</FieldLabel>
      <NumberField
        id="number-field-format-fee"
        defaultValue={200}
        min={0}
        step={50}
        format={{ style: 'currency', currency: 'CNY' }}
      />
      <FieldDescription>按 50 步进,显示为人民币,值仍是纯数字。</FieldDescription>
    </Field>
  )
}
