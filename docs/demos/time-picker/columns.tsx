import type { ReactElement } from 'react'
import { TimeColumns } from '@gedatou/cadenza-ui'
import { format } from 'date-fns'
import { useState } from 'react'

// TimeColumns on its own: the pickers' panel, inline. Each column is a radio
// group -- Tab enters on the checked option, arrow keys move the selection.
export default function ColumnsDemo(): ReactElement {
  const [value, setValue] = useState<Date | null>(() => new Date(2026, 7, 16, 14, 45))
  return (
    <div className="flex items-start gap-4">
      <TimeColumns className="rounded-lg border" minuteStep={5} value={value} onValueChange={setValue} />
      <p className="text-sm text-muted-foreground">
        {value === null ? 'empty' : format(value, 'HH:mm')}
      </p>
    </div>
  )
}
