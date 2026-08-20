import type { ReactElement } from 'react'
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  InputGroup,
  InputGroupInput,
} from '@gedatou/cadenza-ui'

// FieldSeparator divides two sections; with children, the text sits centred
// on the divider line
export default function SeparatorDemo(): ReactElement {
  return (
    <FieldGroup className="max-inline-sm">
      <Field>
        <FieldLabel htmlFor="separator-email">Sign in with email</FieldLabel>
        <InputGroup>
          <InputGroupInput id="separator-email" type="email" placeholder="you@example.com" />
        </InputGroup>
      </Field>
      <FieldSeparator>or</FieldSeparator>
      <Field>
        <FieldLabel htmlFor="separator-phone">Sign in with phone</FieldLabel>
        <InputGroup>
          <InputGroupInput id="separator-phone" type="tel" placeholder="(555) 000-0000" />
        </InputGroup>
      </Field>
    </FieldGroup>
  )
}
