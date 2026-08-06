import type { ReactElement } from 'react'
import {
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
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from '@gedatou/cadenza-ui'
import { toast } from 'sonner'
import { z } from 'zod'

// NumberField 绑定:值原生是 number | null,受控走 value/onValueChange,
// 清空回 null —— schema 用 .nullable().refine 表达必填,无需字符串转换
const schema = z.object({
  copies: z
    .number({ error: '请输入数字' })
    .int('须为整数')
    .min(1, '至少 1 册')
    .max(99, '最多 99 册')
    .nullable()
    .refine(value => value !== null, '请填写册数'),
})

export default function NumberFieldDemo(): ReactElement {
  const form = useForm({
    defaultValues: { copies: null as number | null },
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
        <form.Field name="copies">
          {(field) => {
            const { errorId, invalid } = fieldInvalidState(field)
            return (
              <Field data-invalid={invalid || undefined}>
                <FieldLabel htmlFor={field.name}>册数</FieldLabel>
                <NumberField
                  id={field.name}
                  name={field.name}
                  min={1}
                  max={99}
                  value={field.state.value}
                  onValueChange={value => field.handleChange(value)}
                >
                  <NumberFieldGroup>
                    <NumberFieldDecrement aria-label="减少" />
                    <NumberFieldInput
                      aria-describedby={errorId}
                      aria-invalid={invalid}
                      placeholder="1–99"
                      onBlur={field.handleBlur}
                    />
                    <NumberFieldIncrement aria-label="增加" />
                  </NumberFieldGroup>
                </NumberField>
                <FieldDescription>乐谱打印册数。</FieldDescription>
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
