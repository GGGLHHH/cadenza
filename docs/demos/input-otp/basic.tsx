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

// maxLength 必填,而且要和格子数对上:6 个字符 = 6 个 InputOTPSlot。
// index 从 0 起连续编号,跨 group 也接着数(这一组 0-2,下一组 3-5)。
// id 落在那个横跨所有格子的隐形真 input 上,所以 FieldLabel htmlFor 照常成立。
export default function BasicDemo(): ReactElement {
  return (
    <Field className="max-inline-sm">
      <FieldLabel htmlFor="input-otp-basic">短信验证码</FieldLabel>
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
      <FieldDescription>整串粘贴、iOS/Android 的短信自动填充都能用。</FieldDescription>
    </Field>
  )
}
