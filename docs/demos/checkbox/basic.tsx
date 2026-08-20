import type { ReactElement } from 'react'
import {
  Checkbox,
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@gedatou/cadenza-ui'

// Box-only: the root element is the 16px box itself; text goes through a
// sibling FieldLabel htmlFor -> Checkbox id. The id lands on the hidden
// <input>, so one htmlFor buys both "click the text to toggle" and the
// accessible name. With a horizontal row plus a description, wrap the
// "label + description" text block in FieldContent.
export default function BasicDemo(): ReactElement {
  return (
    <FieldGroup className="max-inline-sm">
      <Field orientation="horizontal">
        <Checkbox defaultChecked id="checkbox-basic-newsletter" name="newsletter" />
        <FieldContent>
          <FieldLabel htmlFor="checkbox-basic-newsletter">Season newsletter</FieldLabel>
          <FieldDescription>Get an email when new dates go on sale.</FieldDescription>
        </FieldContent>
      </Field>
      <Field data-disabled orientation="horizontal">
        <Checkbox disabled id="checkbox-basic-sms" name="sms" />
        <FieldLabel htmlFor="checkbox-basic-sms">SMS reminders</FieldLabel>
      </Field>
    </FieldGroup>
  )
}
