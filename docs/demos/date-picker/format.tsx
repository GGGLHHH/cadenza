import type { ReactElement } from 'react'
import { DatePicker } from '@gedatou/cadenza-ui'
import { zhCN } from 'date-fns/locale'

// format 是 date-fns token,同时管显示与解析:键入「2026年08月20日」
// 才算合法。locale 一并喂给日历(星期、月份文案)与格式化。
// 表单序列化不受影响,hidden input 始终是 yyyy-MM-dd。
export default function FormatDemo(): ReactElement {
  return (
    <DatePicker
      aria-label="日期"
      defaultValue={new Date(2026, 7, 16)}
      format="yyyy年MM月dd日"
      locale={zhCN}
    />
  )
}
