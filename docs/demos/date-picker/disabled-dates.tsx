import type { ReactElement } from 'react'
import { DatePicker } from '@gedatou/cadenza-ui'
import { useState } from 'react'

// disabledDates 是 react-day-picker 的 matcher:日历里点不了,
// 键入同样被拒 —— 试着输入一个过去的日期,值不会变。
export default function DisabledDatesDemo(): ReactElement {
  const [today] = useState(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return now
  })
  return (
    <DatePicker
      aria-label="预约日期"
      disabledDates={{ before: today }}
      placeholder="只能选今天起"
    />
  )
}
