import type { ReactElement } from 'react'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  InputGroup,
  InputGroupInput,
} from '@gedatou/cadenza-ui'

// responsive: stacked when narrow, side-by-side when wide. The breakpoint
// watches FieldGroup's container width (@container query), not the viewport.
// The left column wraps "label + description" in FieldContent — that text
// block is what grows on wide screens; a bare label alone would open up a
// stretch of blank space (same anatomy as upstream)
export default function ResponsiveDemo(): ReactElement {
  return (
    <FieldGroup className="max-inline-lg">
      <Field orientation="responsive">
        <FieldContent>
          <FieldLabel htmlFor="responsive-name">Name</FieldLabel>
          <FieldDescription>Used for concert credits, publicly visible.</FieldDescription>
        </FieldContent>
        <InputGroup>
          <InputGroupInput id="responsive-name" placeholder="Maurice" />
        </InputGroup>
      </Field>
      <Field orientation="responsive">
        <FieldContent>
          <FieldLabel htmlFor="responsive-city">City</FieldLabel>
          <FieldDescription>Tour itineraries sort by it.</FieldDescription>
        </FieldContent>
        <InputGroup>
          <InputGroupInput id="responsive-city" placeholder="Paris" />
        </InputGroup>
      </Field>
    </FieldGroup>
  )
}
