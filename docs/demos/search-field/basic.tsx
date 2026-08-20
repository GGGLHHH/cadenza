import type { ReactElement } from 'react'
import { SearchField } from '@gedatou/cadenza-ui'
import { useState } from 'react'

// Basics: value updates instantly as you type, while queryValue settles
// only after a 300ms pause -- the two rows below put that gap on display
export default function BasicDemo(): ReactElement {
  const [text, setText] = useState('')
  const [query, setQuery] = useState<string | undefined>(undefined)

  return (
    <div className="flex flex-col gap-4 inline-full max-inline-sm">
      <SearchField
        aria-label="Search composers"
        placeholder="Search composers..."
        onValueChange={setText}
        onQueryValueChange={setQuery}
      />
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-muted-foreground">Input</dt>
        <dd className="font-mono">{text === '' ? '—' : text}</dd>
        <dt className="text-muted-foreground">Debounced</dt>
        <dd className="font-mono">{query ?? '—'}</dd>
      </dl>
    </div>
  )
}
