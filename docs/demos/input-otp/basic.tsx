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

// maxLength is required and must match the slot count: 6 characters =
// 6 InputOTPSlots. index numbers run from 0 and stay consecutive across
// groups (this group is 0-2, the next is 3-5).
// The id lands on the invisible real input spanning every slot, so
// FieldLabel htmlFor works as usual.
export default function BasicDemo(): ReactElement {
  return (
    <Field className="max-inline-sm">
      <FieldLabel htmlFor="input-otp-basic">SMS verification code</FieldLabel>
      <InputOTP id="input-otp-basic" maxLength={6} name="code">
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
      <FieldDescription>Pasting the whole code and iOS/Android SMS autofill both work.</FieldDescription>
    </Field>
  )
}
