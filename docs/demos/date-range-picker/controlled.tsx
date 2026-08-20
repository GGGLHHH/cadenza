import type { DateRange } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import { DateRangePicker } from '@gedatou/cadenza-ui'
import { format } from 'date-fns'
import { useState } from 'react'

// The controlled value is { from?, to? } | null: both ends are optional --
// whichever input you press first gets filled first, so a half range with
// only `to` is just as legal. null is the controlled empty value. Half
// ranges also go through onValueChange; don't filter them out as noise.
export default function ControlledDemo(): ReactElement {
  const [value, setValue] = useState<DateRange | null>(() => ({
    from: new Date(2026, 7, 10),
    to: new Date(2026, 7, 20),
  }))
  const show = (day: Date | undefined): string =>
    day === undefined ? '(pending)' : format(day, 'yyyy-MM-dd')
  return (
    <div className="flex flex-col gap-2">
      <DateRangePicker aria-label="Date range" value={value} onValueChange={setValue} />
      <p className="text-sm text-muted-foreground">
        {/* Deterministic formatting: toLocaleDateString breaks hydration when SSR and browser locales differ */}
        {value === null ? 'Not selected' : `${show(value.from)} → ${show(value.to)}`}
      </p>
    </div>
  )
}
