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

// 协议是 React DOM 的,不是这个库其他控件那套:onChange 收到的是**字符串**,
// 既不是事件也没有第二参 eventDetails。onComplete 在最后一格填满时响一次。
export default function ControlledDemo(): ReactElement {
  const [value, setValue] = useState('')
  const [log, setLog] = useState('还没填完')

  return (
    <Field className="max-inline-sm">
      <FieldLabel htmlFor="input-otp-controlled">入场码</FieldLabel>
      <InputOTP
        id="input-otp-controlled"
        maxLength={6}
        onChange={(next) => {
          setValue(next)
          if (next.length < 6)
            setLog('还没填完')
        }}
        onComplete={(next: string) => setLog(`已收到 ${next},正在核验…`)}
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
        （已填
        {value.length}
        /6）
      </FieldDescription>
    </Field>
  )
}
