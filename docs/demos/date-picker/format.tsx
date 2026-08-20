import type { ReactElement } from 'react'
import { DatePicker } from '@gedatou/cadenza-ui'
import { zhCN } from 'date-fns/locale'

// format is a date-fns token string driving both display and parsing:
// only typed input like "2026年08月20日" counts as valid. locale feeds
// the calendar (weekday and month names) and the formatter alike.
// Form serialization is unaffected; the hidden input stays yyyy-MM-dd.
export default function FormatDemo(): ReactElement {
  return (
    <DatePicker
      aria-label="Date"
      defaultValue={new Date(2026, 7, 16)}
      format="yyyy年MM月dd日"
      locale={zhCN}
    />
  )
}
