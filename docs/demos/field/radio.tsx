import type { ReactElement } from 'react'
import {
  Field,
  FieldLabel,
  FieldLegend,
  FieldSet,
  RadioGroup,
  RadioGroupItem,
} from '@gedatou/cadenza-ui'

// Each item is its own horizontal Field, htmlFor → hidden input as usual;
// the group's own name cannot ride htmlFor — wire FieldLegend's id to
// RadioGroup's aria-labelledby by hand
export default function RadioDemo(): ReactElement {
  return (
    <FieldSet className="max-inline-sm">
      <FieldLegend id="field-radio-seat" variant="label">Seating preference</FieldLegend>
      <RadioGroup aria-labelledby="field-radio-seat" defaultValue="stalls" name="seat">
        <Field orientation="horizontal">
          <RadioGroupItem id="field-radio-stalls" value="stalls" />
          <FieldLabel htmlFor="field-radio-stalls">Stalls</FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <RadioGroupItem id="field-radio-balcony" value="balcony" />
          <FieldLabel htmlFor="field-radio-balcony">Balcony</FieldLabel>
        </Field>
      </RadioGroup>
    </FieldSet>
  )
}
