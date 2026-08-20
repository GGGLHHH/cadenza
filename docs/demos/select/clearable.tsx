import type { ReactElement } from 'react'
import { Select } from '@gedatou/cadenza-ui'

const FRUITS = [
  { value: 'apple', label: 'Apple' },
  { value: 'pear', label: 'Pear' },
  { value: 'yuzu', label: 'Yuzu' },
]

// Clear is on by default: once a value is selected, ✕ takes the chevron's
// place; pressing it clears (onValueChange gets null, reason: 'clear-press')
// without opening the popup. clearable={false} is the master switch — use it
// where clearing is a semantic error, e.g. required form fields.
export default function ClearableDemo(): ReactElement {
  return (
    <div className="flex flex-col gap-4">
      <Select aria-label="Fruit" items={FRUITS} placeholder="Default: clearable" />
      <Select aria-label="Fruit (required)" clearable={false} items={FRUITS} placeholder="clearable={false}: not clearable" />
    </div>
  )
}
