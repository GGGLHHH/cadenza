import type { ReactElement } from 'react'
import {
  fieldControlProps,
  fieldErrors,
  fieldInvalidState,
  formProps,
  useForm,
} from '@gedatou/cadenza-form'
import {
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@gedatou/cadenza-ui'
import { toast } from 'sonner'
import { z } from 'zod'

// InputOTP 绑定:协议是 React DOM 的 —— onChange 直接收字符串,没有第二参;
// id 落在横跨所有格子的隐形真 input 上,fieldControlProps 原样可用
const schema = z.object({
  code: z.string().regex(/^\d{6}$/, '请输入 6 位数字验证码'),
})

export default function InputOTPDemo(): ReactElement {
  const form = useForm({
    defaultValues: { code: '' },
    validators: { onChange: schema },
    onSubmit: ({ formApi, value }) => {
      toast('已提交以下内容：', {
        description: (
          <pre className="
            mbs-2 overflow-x-auto rounded-md bg-code p-4 text-code-foreground
            inline-[320px]
          "
          >
            <code>{JSON.stringify(value, null, 2)}</code>
          </pre>
        ),
      })
      formApi.reset()
    },
  })

  return (
    <form
      {...formProps(form)}
      className="mx-auto inline-full max-inline-sm"
    >
      <FieldGroup>
        <form.Field name="code">
          {(field) => {
            const { errorId, invalid } = fieldInvalidState(field)
            return (
              <Field data-invalid={invalid || undefined}>
                <FieldLabel htmlFor={field.name}>短信验证码</FieldLabel>
                <InputOTP
                  {...fieldControlProps(field)}
                  maxLength={6}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={field.handleChange}
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
                <FieldDescription>整串粘贴、短信自动填充都能用。</FieldDescription>
                <FieldError id={errorId} errors={fieldErrors(field)} />
              </Field>
            )
          }}
        </form.Field>
        <Field orientation="horizontal">
          <Button type="submit">提交</Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
