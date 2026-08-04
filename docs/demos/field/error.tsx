import type { ReactElement } from 'react'
import {
  Field,
  FieldError,
  FieldLabel,
  InputGroup,
  InputGroupInput,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'

// FieldError 展示外部校验错误(errors 数组就是表单库吐的形状),
// Field 上同步 data-invalid 让标签一起变色;aria-describedby 手动接 ——
// 这条通道没有 context 替你接线
export default function ErrorDemo(): ReactElement {
  const [value, setValue] = useState('')
  const errors = value.length >= 8 ? [] : [{ message: '至少 8 个字符' }]
  const isInvalid = errors.length > 0

  return (
    <Field data-invalid={isInvalid || undefined} className="max-inline-sm">
      <FieldLabel htmlFor="field-error-pass">口令</FieldLabel>
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
