import type { ReactElement } from 'react'
import { Select } from '@gedatou/cadenza-ui'
import { useState } from 'react'

// pending = the save round-trip after picking: the trigger stays focusable but
// the popup no longer opens (readOnly underneath), a Spinner takes the
// chevron's place, and the clear ✕ steps aside; the new value lands only after
// the server confirms (simulated 900ms).
const VOICES = {
  soprano: 'Soprano',
  alto: 'Alto',
  tenor: 'Tenor',
  bass: 'Bass',
}

export default function PendingDemo(): ReactElement {
  const [value, setValue] = useState<string | null>('soprano')
  const [pending, setPending] = useState(false)
  return (
    <Select
      aria-label="Voice part"
      placeholder="In progress"
      items={VOICES}
      pending={pending}
      value={value}
      onValueChange={(next) => {
        setPending(true)
        setTimeout(() => {
          setValue(next)
          setPending(false)
        }, 900)
      }}
    />
  )
}
