import type { ReactElement } from 'react'
import {
  fieldErrors,
  fieldInvalidState,
  formProps,
  useForm,
} from '@gedatou/cadenza-form'
import {
  Button,
  DatePicker,
  DatePickerClear,
  DatePickerInput,
  DatePickerTrigger,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  InputGroup,
} from '@gedatou/cadenza-ui'
import { toast } from 'sonner'
import { z } from 'zod'

// DatePicker 绑定:值原生是 Date | null,受控走 value/onValueChange。
// 键入非法文本不落值 —— 表单永远只见合法 Date 或 null,schema 用
// .nullable().refine 表达必填即可,不需要字符串解析。
const schema = z.object({
  eventDate: z
    .date({ error: '请选择日期' })
    .nullable()
    .refine(value => value !== null, '请选择日期'),
})

export default function DatePickerDemo(): ReactElement {
  const form = useForm({
    defaultValues: { eventDate: null as Date | null },
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
        <form.Field name="eventDate">
          {(field) => {
            const { errorId, invalid } = fieldInvalidState(field)
            return (
              <Field data-invalid={invalid || undefined}>
                <FieldLabel htmlFor={field.name}>演出日期</FieldLabel>
                <DatePicker
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onValueChange={value => field.handleChange(value)}
                >
                  <InputGroup>
                    <DatePickerInput
                      aria-describedby={errorId}
                      aria-invalid={invalid}
                      aria-required
                      placeholder="yyyy-MM-dd"
                      onBlur={field.handleBlur}
                    />
                    <DatePickerClear />
                    <DatePickerTrigger />
                  </InputGroup>
                </DatePicker>
                <FieldDescription>可以直接键入，也可以点日历选。</FieldDescription>
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
