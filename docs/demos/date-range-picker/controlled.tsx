import type { DateRange } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import { DateRangePicker } from '@gedatou/cadenza-ui'
import { format } from 'date-fns'
import { useState } from 'react'

// 受控值是 { from, to } | null:选到一半是 { from }(to 还空着),
// null 是受控空值。半程也会走 onValueChange,别当成噪音过滤掉。
export default function ControlledDemo(): ReactElement {
  const [value, setValue] = useState<DateRange | null>(() => ({
    from: new Date(2026, 7, 10),
    to: new Date(2026, 7, 20),
  }))
  return (
    <div className="flex flex-col gap-2">
      <DateRangePicker aria-label="日期范围" value={value} onValueChange={setValue} />
      <p className="text-sm text-muted-foreground">
        {/* 确定性格式化:toLocaleDateString 会因 SSR 与浏览器 locale 不同炸 hydration */}
        {value === null
          ? '未选择'
          : `${format(value.from, 'yyyy-MM-dd')} → ${value.to === undefined ? '(待定)' : format(value.to, 'yyyy-MM-dd')}`}
      </p>
    </div>
  )
}
