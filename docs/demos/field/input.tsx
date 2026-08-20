import type { ReactElement } from 'react'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@gedatou/cadenza-ui'
import { IconSearch } from '@tabler/icons-react'

// The most ordinary channel: the id lands on the real <input>, FieldLabel
// htmlFor points at it. When something must share the input's border, switch
// to InputGroup — the id still lands on the inner input, and the label wiring
// stays untouched
export default function InputDemo(): ReactElement {
  return (
    <FieldGroup className="inline-full max-inline-sm">
      <Field>
        <FieldLabel htmlFor="field-input-title">Title</FieldLabel>
        <Input id="field-input-title" name="title" placeholder="Gaspard de la nuit" />
        <FieldDescription>Shown publicly; you can change it later.</FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="field-input-keyword">Search keyword</FieldLabel>
        <InputGroup>
          <InputGroupAddon><IconSearch /></InputGroupAddon>
          <InputGroupInput id="field-input-keyword" placeholder="Ravel" />
        </InputGroup>
        <FieldDescription>With an icon, switch to InputGroup; the id still lands on the inner input.</FieldDescription>
      </Field>
    </FieldGroup>
  )
}
