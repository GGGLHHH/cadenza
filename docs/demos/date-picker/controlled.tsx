import type { DatePickerChangeEventDetails } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import { DatePicker } from '@gedatou/cadenza-ui'
import { format } from 'date-fns'
import { useState } from 'react'

// 受控三件套 + details.reason:键入、点选、清除走的是同一个
// onValueChange,靠 reason 区分来源。受控空值是 null。
export default function ControlledDemo(): ReactElement {
  const [value, setValue] = useState<Date | null>(() => new Date(2026, 7, 16))
  const [reason, setReason] = useState<string>('—')
  return (
    <div className="flex flex-col gap-2">
      <DatePicker
        aria-label="日期"
        placeholder="选择日期"
        value={value}
        onValueChange={(next: Date | null, details: DatePickerChangeEventDetails) => {
          setValue(next)
          setReason(details.reason)
        }}
      />
      <p className="text-sm text-muted-foreground">
        值:
        {/* 确定性格式化:toLocaleDateString 会因 SSR 与浏览器 locale 不同炸 hydration */}
        {value === null ? '空' : format(value, 'yyyy-MM-dd')}
        {' · 最近一次 reason: '}
        {reason}
      </p>
    </div>
  )
}
