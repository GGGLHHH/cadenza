import type { ReactElement } from 'react'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  Switch,
} from '@gedatou/cadenza-ui'

// box-only:根元素就是那条轨道,文字走同级的 FieldLabel。
// id 落在隐藏的 <input> 上,htmlFor 一条线既转发点击又给出无障碍名
export default function BasicDemo(): ReactElement {
  return (
    <Field orientation="horizontal" className="max-inline-sm">
      <Switch id="switch-basic-notify" name="notify" defaultChecked />
      <FieldContent>
        <FieldLabel htmlFor="switch-basic-notify">排练提醒</FieldLabel>
        <FieldDescription>有新的排练安排时给你发一封邮件。</FieldDescription>
      </FieldContent>
    </Field>
  )
}
