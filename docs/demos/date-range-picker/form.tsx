import type { ReactElement } from 'react'
import { Button, DateRangePicker, Field, FieldLabel } from '@gedatou/cadenza-ui'
import { useState } from 'react'

// 有 name 就有两个常驻 hidden input(起、止各一,同名),原生
// FormData.getAll 一次拿到 ['2026-08-10', '2026-08-20']。
export default function FormDemo(): ReactElement {
  const [submitted, setSubmitted] = useState<string>('—')
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        setSubmitted(JSON.stringify(data.getAll('stay')))
      }}
    >
      <Field>
        <FieldLabel htmlFor="stay">入住区间</FieldLabel>
        <DateRangePicker
          defaultValue={{ from: new Date(2026, 7, 10), to: new Date(2026, 7, 20) }}
          id="stay"
          name="stay"
        />
      </Field>
      <div className="flex items-center gap-3">
        <Button size="sm" type="submit">提交</Button>
        <span className="text-sm text-muted-foreground">{submitted}</span>
      </div>
    </form>
  )
}
