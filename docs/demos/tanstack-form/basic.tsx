import type { ReactElement } from 'react'
import {
  fieldControlProps,
  fieldErrors,
  fieldInvalidState,
  formProps,
  requiredFields,
  useForm,
  useFormSubmitting,
} from '@gedatou/cadenza-form'
import {
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  Textarea,
} from '@gedatou/cadenza-ui'
import { toast } from 'sonner'
import { z } from 'zod'

// 门面全家上阵的 bug 报告表单:onChange 实时校验,错误等 blur 或提交后才显示;
// aria 接线(fieldControlProps)与提交处理(formSubmitHandler)是包默认,demo 零胶水
const schema = z.object({
  title: z.string().min(5, '标题至少 5 个字').max(32, '标题最多 32 个字'),
  description: z.string().min(20, '描述至少 20 个字').max(100, '描述最多 100 个字'),
})

const DEFAULT_VALUES = { title: '', description: '' }
// 行为性必填探针:空值过不了校验的字段,标签自动带红星
const REQUIRED = requiredFields(schema, DEFAULT_VALUES)

export default function BasicDemo(): ReactElement {
  const form = useForm({
    defaultValues: DEFAULT_VALUES,
    validators: { onChange: schema },
    onSubmit: async ({ formApi, value }) => {
      await new Promise(resolve => setTimeout(resolve, 800))
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
  const submitting = useFormSubmitting(form)

  return (
    <form
      {...formProps(form)}
      className="mx-auto inline-full max-inline-sm"
    >
      <FieldGroup>
        <form.Field name="title">
          {(field) => {
            const { errorId, invalid } = fieldInvalidState(field)
            return (
              <Field data-invalid={invalid || undefined}>
                <FieldLabel htmlFor={field.name} required={REQUIRED.has(field.name)}>标题</FieldLabel>
                <Input
                  {...fieldControlProps(field)}
                  value={field.state.value}
                  autoComplete="off"
                  placeholder="移动端登录按钮点不动"
                  onBlur={field.handleBlur}
                  onChange={event => field.handleChange(event.target.value)}
                />
                <FieldDescription>一句话概括问题。</FieldDescription>
                <FieldError id={errorId} errors={fieldErrors(field)} />
              </Field>
            )
          }}
        </form.Field>
        <form.Field name="description">
          {(field) => {
            const { errorId, invalid } = fieldInvalidState(field)
            return (
              <Field data-invalid={invalid || undefined}>
                <FieldLabel htmlFor={field.name} required={REQUIRED.has(field.name)}>描述</FieldLabel>
                <Textarea
                  {...fieldControlProps(field)}
                  value={field.state.value}
                  placeholder="复现步骤、期望行为、实际行为……"
                  onBlur={field.handleBlur}
                  onChange={event => field.handleChange(event.target.value)}
                />
                <FieldDescription>20–100 个字，越具体越好。</FieldDescription>
                <FieldError id={errorId} errors={fieldErrors(field)} />
              </Field>
            )
          }}
        </form.Field>
        <Field orientation="horizontal">
          <Button type="submit" pending={submitting}>提交</Button>
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            重置
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
