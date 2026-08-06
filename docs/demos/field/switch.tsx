import type { ReactElement } from 'react'
import { Field, FieldLabel, Switch } from '@gedatou/cadenza-ui'

// 和 Checkbox 同一类:id 落在隐藏 <input> 上,一条 htmlFor 给出名字和「点文字切换」
export default function SwitchDemo(): ReactElement {
  return (
    <Field className="max-inline-sm" orientation="horizontal">
      <Switch id="field-switch-notify" name="notify" />
      <FieldLabel htmlFor="field-switch-notify">排练提醒</FieldLabel>
    </Field>
  )
}
