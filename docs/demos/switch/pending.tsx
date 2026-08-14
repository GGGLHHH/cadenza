import type { ReactElement } from 'react'
import { Field, FieldLabel, Switch } from '@gedatou/cadenza-ui'
import { useState } from 'react'

// pending = 动作面(与 Button 同词):拨动后等服务端确认——开关保持可聚焦
// 但不再响应,Spinner 转在滑块圆点里;确认落地才翻 checked。
// 模拟 900ms round-trip。
export default function PendingDemo(): ReactElement {
  const [checked, setChecked] = useState(false)
  const [pending, setPending] = useState(false)
  return (
    <Field orientation="horizontal">
      <Switch
        checked={checked}
        id="sync"
        pending={pending}
        onCheckedChange={(next) => {
          setPending(true)
          setTimeout(() => {
            setChecked(next)
            setPending(false)
          }, 900)
        }}
      />
      <FieldLabel htmlFor="sync">自动同步（保存约 1 秒）</FieldLabel>
    </Field>
  )
}
