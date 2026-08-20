import type { ReactElement } from 'react'
import { Field, FieldLabel, Switch } from '@gedatou/cadenza-ui'
import { useState } from 'react'

// pending = the action side (same word as Button): after flipping, wait for
// the server to confirm -- the switch stays focusable but unresponsive, the
// Spinner turns inside the thumb; checked only flips once the confirmation
// lands. Simulates a 900ms round-trip.
export default function PendingDemo(): ReactElement {
  const [checked, setChecked] = useState(false)
  const [pending, setPending] = useState(false)
  return (
    <Field orientation="horizontal">
      <Switch
        checked={checked}
        id="sync"
        pending={pending}
        onCheckedChange={(next) => {
          setPending(true)
          setTimeout(() => {
            setChecked(next)
            setPending(false)
          }, 900)
        }}
      />
      <FieldLabel htmlFor="sync">Auto sync (saving takes about 1s)</FieldLabel>
    </Field>
  )
}
