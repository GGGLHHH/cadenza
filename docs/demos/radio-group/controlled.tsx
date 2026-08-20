import type { ReactElement } from 'react'
import {
  Field,
  FieldLabel,
  FieldLegend,
  FieldSet,
  RadioGroup,
  RadioGroupItem,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'

// Controlled: value + onValueChange both live on the group. Values need not
// be strings -- here useState(45) makes Value infer as number, and the
// items' value props take numbers too; the last item is disabled, and the
// keyboard arrows skip over it
export default function ControlledDemo(): ReactElement {
  const [minutes, setMinutes] = useState(45)

  return (
    <div className="flex flex-col gap-4">
      <FieldSet className="max-inline-sm">
        <FieldLegend id="radio-controlled-legend">Rehearsal length</FieldLegend>
        <RadioGroup
          aria-labelledby="radio-controlled-legend"
          value={minutes}
          onValueChange={setMinutes}
        >
          <Field orientation="horizontal">
            <RadioGroupItem id="radio-controlled-30" value={30} />
            <FieldLabel htmlFor="radio-controlled-30">30 minutes</FieldLabel>
          </Field>
          <Field orientation="horizontal">
            <RadioGroupItem id="radio-controlled-45" value={45} />
            <FieldLabel htmlFor="radio-controlled-45">45 minutes</FieldLabel>
          </Field>
          <Field data-disabled orientation="horizontal">
            <RadioGroupItem disabled id="radio-controlled-90" value={90} />
            <FieldLabel htmlFor="radio-controlled-90">90 minutes (hall unavailable)</FieldLabel>
          </Field>
        </RadioGroup>
      </FieldSet>
      <p className="text-sm text-muted-foreground">
        Currently selected:
        {' '}
        {minutes}
        {' '}
        minutes
      </p>
    </div>
  )
}
