import type { ReactElement } from 'react'
import {
  Field,
  FieldLabel,
  FieldLegend,
  FieldSet,
  RadioGroup,
  RadioGroupItem,
} from '@gedatou/cadenza-ui'

// The value lives on the group (name/defaultValue); each item carries only
// its own value. Two naming jobs: items are handled automatically by
// FieldLabel htmlFor; the group is a bare role="radiogroup", so hand-write
// aria-labelledby pointing at the FieldLegend's id
export default function BasicDemo(): ReactElement {
  return (
    <FieldSet className="max-inline-sm">
      <FieldLegend id="radio-basic-legend">Voice part</FieldLegend>
      <RadioGroup aria-labelledby="radio-basic-legend" defaultValue="alto" name="voice">
        <Field orientation="horizontal">
          <RadioGroupItem id="radio-basic-soprano" value="soprano" />
          <FieldLabel htmlFor="radio-basic-soprano">Soprano</FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <RadioGroupItem id="radio-basic-alto" value="alto" />
          <FieldLabel htmlFor="radio-basic-alto">Alto</FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <RadioGroupItem id="radio-basic-tenor" value="tenor" />
          <FieldLabel htmlFor="radio-basic-tenor">Tenor</FieldLabel>
        </Field>
      </RadioGroup>
    </FieldSet>
  )
}
