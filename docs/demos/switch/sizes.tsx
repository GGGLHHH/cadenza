import type { ReactElement } from 'react'
import { Field, FieldLabel, Switch } from '@gedatou/cadenza-ui'

// size is a shadcn addition, not Base UI's: it mirrors to data-size on the
// root element, and the track and thumb both take their dimensions from it
export default function SizesDemo(): ReactElement {
  return (
    <div className="grid grid-cols-2 gap-6 max-inline-sm">
      <Field orientation="horizontal">
        <Switch id="switch-size-default" defaultChecked />
        <FieldLabel htmlFor="switch-size-default">default</FieldLabel>
      </Field>
      <Field orientation="horizontal">
        <Switch id="switch-size-sm" size="sm" defaultChecked />
        <FieldLabel htmlFor="switch-size-sm">sm</FieldLabel>
      </Field>
    </div>
  )
}
