import type { ReactElement } from 'react'
import { DateRangePicker } from '@gedatou/cadenza-ui'

// 一行式:两端输入框 + 双月日历。日历里第一次点是起点,第二次点收尾
// 并关闭;两个输入框也可以分别键入,起点越过终点时终点清空。
export default function BasicDemo(): ReactElement {
  return (
    <DateRangePicker
      aria-label="日期范围"
      endPlaceholder="结束日期"
      startPlaceholder="开始日期"
    />
  )
}
