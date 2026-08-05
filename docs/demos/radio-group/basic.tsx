import type { ReactElement } from 'react'
import {
  Field,
  FieldLabel,
  FieldLegend,
  FieldSet,
  RadioGroup,
  RadioGroupItem,
} from '@gedatou/cadenza-ui'

// 值住在 group 上(name/defaultValue),item 只带自己的 value。
// 两件命名的事:item 靠 FieldLabel htmlFor 自动搞定;group 是个裸的
// role="radiogroup",得手写 aria-labelledby 指向 FieldLegend 的 id
export default function BasicDemo(): ReactElement {
  return (
    <FieldSet className="max-inline-sm">
      <FieldLegend id="radio-basic-legend">声部</FieldLegend>
      <RadioGroup aria-labelledby="radio-basic-legend" defaultValue="alto" name="voice">
        <Field orientation="horizontal">
          <RadioGroupItem id="radio-basic-soprano" value="soprano" />
          <FieldLabel htmlFor="radio-basic-soprano">女高音</FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <RadioGroupItem id="radio-basic-alto" value="alto" />
          <FieldLabel htmlFor="radio-basic-alto">女中音</FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <RadioGroupItem id="radio-basic-tenor" value="tenor" />
          <FieldLabel htmlFor="radio-basic-tenor">男高音</FieldLabel>
        </Field>
      </RadioGroup>
    </FieldSet>
  )
}
