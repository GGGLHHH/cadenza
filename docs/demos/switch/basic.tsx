import type { ReactElement } from 'react'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  Switch,
} from '@gedatou/cadenza-ui'

// Box-only: the root element is the track itself; text goes through a
// sibling FieldLabel. The id lands on the hidden <input>, so one htmlFor
// both forwards clicks and provides the accessible name
export default function BasicDemo(): ReactElement {
  return (
    <Field orientation="horizontal" className="max-inline-sm">
      <Switch id="switch-basic-notify" name="notify" defaultChecked />
      <FieldContent>
        <FieldLabel htmlFor="switch-basic-notify">Rehearsal reminders</FieldLabel>
        <FieldDescription>Get an email when a new rehearsal is scheduled.</FieldDescription>
      </FieldContent>
    </Field>
  )
}
