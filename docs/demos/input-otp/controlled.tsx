import type { ReactElement } from 'react'
import {
  Field,
  FieldDescription,
  FieldLabel,
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'

// The protocol is React DOM's, not the one this library's other controls
// use: onChange receives a **string** -- not an event, and there is no
// second eventDetails argument. onComplete fires once when the last slot
// is filled.
export default function ControlledDemo(): ReactElement {
  const [value, setValue] = useState('')
  const [log, setLog] = useState('Not complete yet')

  return (
    <Field className="max-inline-sm">
      <FieldLabel htmlFor="input-otp-controlled">Entry code</FieldLabel>
      <InputOTP
        id="input-otp-controlled"
        maxLength={6}
        onChange={(next) => {
          setValue(next)
          if (next.length < 6)
            setLog('Not complete yet')
        }}
        onComplete={(next: string) => setLog(`Received ${next}, verifying…`)}
        value={value}
      >
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
      <FieldDescription>
        {log}
        {' ('}
        {value.length}
        /6 filled)
      </FieldDescription>
    </Field>
  )
}
