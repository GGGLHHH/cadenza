import type { NumberFieldChangeEventDetails } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import { Field, FieldDescription, FieldLabel, NumberField } from '@gedatou/cadenza-ui'
import { useState } from 'react'

// 受控三件套:value / onValueChange(value, details);清空输入回 null,
// details.reason 区分 typing/步进钮/方向键等来源
export default function ControlledDemo(): ReactElement {
  const [value, setValue] = useState<number | null>(2)
  const [reason, setReason] = useState('—')

  return (
    <Field className="max-inline-sm">
      <FieldLabel htmlFor="number-field-controlled-seats">占座数</FieldLabel>
      <NumberField
        id="number-field-controlled-seats"
        value={value}
        min={0}
        max={8}
        onValueChange={(next: number | null, details: NumberFieldChangeEventDetails) => {
          setValue(next)
          setReason(details.reason)
        }}
      />
      <FieldDescription>
        当前值：
        {value === null ? 'null（已清空）' : value}
        ，最近一次变更来源：
        {reason}
      </FieldDescription>
    </Field>
  )
}
