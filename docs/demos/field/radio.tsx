import type { ReactElement } from 'react'
import {
  Field,
  FieldLabel,
  FieldLegend,
  FieldSet,
  RadioGroup,
  RadioGroupItem,
} from '@gedatou/cadenza-ui'

// 每一项各自是一个 horizontal 的 Field,htmlFor → 隐藏 input 照常;
// 组本身的名字接不上 htmlFor —— FieldLegend 的 id + RadioGroup 的 aria-labelledby 手接
export default function RadioDemo(): ReactElement {
  return (
    <FieldSet className="max-inline-sm">
      <FieldLegend id="field-radio-seat" variant="label">座位偏好</FieldLegend>
      <RadioGroup aria-labelledby="field-radio-seat" defaultValue="stalls" name="seat">
        <Field orientation="horizontal">
          <RadioGroupItem id="field-radio-stalls" value="stalls" />
          <FieldLabel htmlFor="field-radio-stalls">池座</FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <RadioGroupItem id="field-radio-balcony" value="balcony" />
          <FieldLabel htmlFor="field-radio-balcony">楼座</FieldLabel>
        </Field>
      </RadioGroup>
    </FieldSet>
  )
}
