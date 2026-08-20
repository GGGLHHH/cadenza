import type { ReactElement } from 'react'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  InputGroup,
  InputGroupInput,
} from '@gedatou/cadenza-ui'

// A batch of related fields: FieldSet + FieldLegend name the whole group
// (semantically native fieldset/legend); FieldGroup handles vertical layout
export default function FieldsetDemo(): ReactElement {
  return (
    <FieldSet className="max-inline-sm">
      <FieldLegend>Concert details</FieldLegend>
      <FieldDescription>Printed on the programme as-is.</FieldDescription>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="fieldset-piece">Piece</FieldLabel>
          <InputGroup>
            <InputGroupInput id="fieldset-piece" placeholder="Jeux d'eau" />
          </InputGroup>
        </Field>
        <Field>
          <FieldLabel htmlFor="fieldset-composer">Composer</FieldLabel>
          <InputGroup>
            <InputGroupInput id="fieldset-composer" placeholder="Ravel" />
          </InputGroup>
          <FieldDescription>Leave blank if you're not sure.</FieldDescription>
        </Field>
      </FieldGroup>
    </FieldSet>
  )
}
