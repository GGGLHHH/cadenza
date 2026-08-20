import type { ReactElement } from 'react'
import {
  Field,
  FieldError,
  FieldLabel,
  InputGroup,
  InputGroupInput,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'

// FieldError renders external validation errors (the errors array is the same
// shape form libraries emit); mirror data-invalid on Field so the label
// changes colour too. Wire aria-describedby by hand — no context does this
// wiring for you
export default function ErrorDemo(): ReactElement {
  const [value, setValue] = useState('')
  const errors = value.length >= 8 ? [] : [{ message: 'At least 8 characters' }]
  const isInvalid = errors.length > 0

  return (
    <Field data-invalid={isInvalid || undefined} className="max-inline-sm">
      <FieldLabel htmlFor="field-error-pass">Passphrase</FieldLabel>
      <InputGroup>
        <InputGroupInput
          id="field-error-pass"
          type="password"
          value={value}
          onChange={e => setValue(e.target.value)}
          aria-invalid={isInvalid || undefined}
          aria-describedby={isInvalid ? 'field-error-pass-message' : undefined}
        />
      </InputGroup>
      <FieldError id="field-error-pass-message" errors={errors} />
    </Field>
  )
}
