import type { CascaderNode } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import { Cascader } from '@gedatou/cadenza-ui'
import { useState } from 'react'

// The controlled trio: value / defaultValue / onValueChange. The value is
// one root-to-leaf path (string[]); the controlled empty value is null.
// The callback's second argument is eventDetails, whose cancel() rejects
// the change (clearing goes through the same callback, reason:
// 'clear-press').
const INSTRUMENTS: CascaderNode[] = [
  {
    value: 'strings',
    label: 'Strings',
    items: [
      { value: 'violin', label: 'Violin' },
      { value: 'cello', label: 'Cello' },
    ],
  },
  {
    value: 'woodwinds',
    label: 'Woodwinds',
    items: [
      { value: 'flute', label: 'Flute' },
      { value: 'oboe', label: 'Oboe' },
    ],
  },
]

export default function ControlledDemo(): ReactElement {
  const [value, setValue] = useState<string[] | null>(['strings', 'cello'])
  return (
    <div className="flex flex-col items-start gap-2">
      <Cascader
        aria-label="Instrument"
        items={INSTRUMENTS}
        placeholder="Select an instrument"
        value={value}
        onValueChange={setValue}
      />
      <p className="text-sm text-muted-foreground">
        value:
        {' '}
        {value === null ? 'null' : JSON.stringify(value)}
      </p>
    </div>
  )
}
