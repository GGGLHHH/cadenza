import type { ReactElement } from 'react'
import {
  Select,
  SelectGroup,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'

const INSTRUMENTS = {
  violin: 'Violin',
  viola: 'Viola',
  cello: 'Cello',
  bass: 'Double bass',
}

// With multiple, value / onValueChange change shape wholesale: string[]
// instead of string | null. SelectValue assembles the multi-select display on
// the trigger: comma-separated by default; pass a function children to change
export default function MultipleDemo(): ReactElement {
  const [value, setValue] = useState<string[]>(['violin'])

  return (
    <div className="flex flex-col gap-4 inline-full max-inline-sm">
      <Select items={INSTRUMENTS} multiple value={value} onValueChange={setValue}>
        <SelectTrigger aria-label="Instrument">
          <SelectValue placeholder="Pick several" />
        </SelectTrigger>
        <SelectPopup>
          <SelectGroup>
            {Object.entries(INSTRUMENTS).map(([id, label]) => (
              <SelectItem key={id} value={id}>{label}</SelectItem>
            ))}
          </SelectGroup>
        </SelectPopup>
      </Select>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-muted-foreground">value</dt>
        <dd className="font-mono">{value.length === 0 ? '—' : value.join(', ')}</dd>
      </dl>
    </div>
  )
}
