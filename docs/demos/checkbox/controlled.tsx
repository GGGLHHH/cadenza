import type { ReactElement } from 'react'
import {
  Checkbox,
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { DemoButton } from '../lib/demo-button'

// Controlled: checked is the single source of truth, onCheckedChange writes
// it back. The second argument is a real ChangeEventDetails -- reason is
// always 'none', and cancel() is honoured.
export default function ControlledDemo(): ReactElement {
  const [checked, setChecked] = useState(false)
  const [locked, setLocked] = useState(false)
  const [log, setLog] = useState('No changes yet')

  return (
    <FieldGroup className="max-inline-sm">
      <Field orientation="horizontal">
        <Checkbox
          checked={checked}
          id="checkbox-controlled-consent"
          onCheckedChange={(next, details) => {
            if (locked) {
              // Reject this change: skip the external state write-back, and
              // cancel() blocks the component's internal copy too
              details.cancel()
              setLog(`Blocked (reason = ${details.reason})`)
              return
            }
            setChecked(next)
            setLog(`${next ? 'Checked' : 'Unchecked'} (reason = ${details.reason})`)
          }}
        />
        <FieldContent>
          <FieldLabel htmlFor="checkbox-controlled-consent">Accept the event terms</FieldLabel>
          <FieldDescription>{log}</FieldDescription>
        </FieldContent>
      </Field>
      <div className="flex flex-wrap items-center gap-2">
        <DemoButton onClick={() => setLocked(current => !current)} size="sm">
          {locked ? 'Unlock' : 'Lock (cancel every change from now on)'}
        </DemoButton>
      </div>
      <Field orientation="horizontal">
        {/* Uncontrolled: no external state at all; cancel() alone pins down
            the attempt to uncheck */}
        <Checkbox
          defaultChecked
          id="checkbox-controlled-sticky"
          onCheckedChange={(next, details) => {
            if (!next)
              details.cancel()
          }}
        />
        <FieldContent>
          <FieldLabel htmlFor="checkbox-controlled-sticky">Hold the seat (cannot be unchecked)</FieldLabel>
          <FieldDescription>Uncontrolled; cancel() blocks the internal state directly.</FieldDescription>
        </FieldContent>
      </Field>
    </FieldGroup>
  )
}
