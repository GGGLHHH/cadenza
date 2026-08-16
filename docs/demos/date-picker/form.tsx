import type { ReactElement } from 'react'
import { Button, DatePicker, Field, FieldLabel } from '@gedatou/cadenza-ui'
import { useState } from 'react'

// 有 name 就有常驻 hidden input:空值序列化成 ''、有值是 yyyy-MM-dd,
// 原生 FormData 直接可读。标签走普通通道:FieldLabel htmlFor 直连
// 输入框的 id。
export default function FormDemo(): ReactElement {
  const [submitted, setSubmitted] = useState<string>('—')
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        setSubmitted(JSON.stringify(Object.fromEntries(data)))
      }}
    >
      <Field>
        <FieldLabel htmlFor="checkin">入住日期</FieldLabel>
        <DatePicker id="checkin" name="checkin" placeholder="选择日期" />
      </Field>
      <div className="flex items-center gap-3">
        <Button size="sm" type="submit">提交</Button>
        <span className="text-sm text-muted-foreground">{submitted}</span>
      </div>
    </form>
  )
}
