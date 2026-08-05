import type { ReactElement } from 'react'
import {
  Field,
  FieldLabel,
  FieldLegend,
  FieldSet,
  RadioGroup,
  RadioGroupItem,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'

// 受控:value + onValueChange 都在 group 上。值不必是字符串 ——
// 这里 useState(45) 让 Value 推断成 number,item 的 value 也照收;
// 最后一项 disabled,键盘方向键会跳过它
export default function ControlledDemo(): ReactElement {
  const [minutes, setMinutes] = useState(45)

  return (
    <div className="flex flex-col gap-4">
      <FieldSet className="max-inline-sm">
        <FieldLegend id="radio-controlled-legend">排练时长</FieldLegend>
        <RadioGroup
          aria-labelledby="radio-controlled-legend"
          value={minutes}
          onValueChange={setMinutes}
        >
          <Field orientation="horizontal">
            <RadioGroupItem id="radio-controlled-30" value={30} />
            <FieldLabel htmlFor="radio-controlled-30">30 分钟</FieldLabel>
          </Field>
          <Field orientation="horizontal">
            <RadioGroupItem id="radio-controlled-45" value={45} />
            <FieldLabel htmlFor="radio-controlled-45">45 分钟</FieldLabel>
          </Field>
          <Field data-disabled orientation="horizontal">
            <RadioGroupItem disabled id="radio-controlled-90" value={90} />
            <FieldLabel htmlFor="radio-controlled-90">90 分钟(排练厅未开放)</FieldLabel>
          </Field>
        </RadioGroup>
      </FieldSet>
      <p className="text-sm text-muted-foreground">
        当前选中:
        {minutes}
        {' '}
        分钟
      </p>
    </div>
  )
}
