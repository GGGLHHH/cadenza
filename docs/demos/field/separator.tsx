import type { ReactElement } from 'react'
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  InputGroup,
  InputGroupInput,
} from '@gedatou/cadenza-ui'

// FieldSeparator 分隔两段;有 children 时文字压在分隔线中央
export default function SeparatorDemo(): ReactElement {
  return (
    <FieldGroup className="max-inline-sm">
      <Field>
        <FieldLabel htmlFor="separator-email">邮箱登录</FieldLabel>
        <InputGroup>
          <InputGroupInput id="separator-email" type="email" placeholder="you@example.com" />
        </InputGroup>
      </Field>
      <FieldSeparator>或</FieldSeparator>
      <Field>
        <FieldLabel htmlFor="separator-phone">手机号登录</FieldLabel>
        <InputGroup>
          <InputGroupInput id="separator-phone" type="tel" placeholder="138 0000 0000" />
        </InputGroup>
      </Field>
    </FieldGroup>
  )
}
