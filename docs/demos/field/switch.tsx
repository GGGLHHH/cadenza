import type { ReactElement } from 'react'
import { Field, FieldLabel, Switch } from '@gedatou/cadenza-ui'

// Same family as Checkbox: the id lands on the hidden <input>, and one htmlFor
// provides both the name and "press the text to toggle"
export default function SwitchDemo(): ReactElement {
  return (
    <Field className="max-inline-sm" orientation="horizontal">
      <Switch id="field-switch-notify" name="notify" />
      <FieldLabel htmlFor="field-switch-notify">Rehearsal reminders</FieldLabel>
    </Field>
  )
}
