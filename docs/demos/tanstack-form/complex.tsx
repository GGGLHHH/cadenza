import type { ReactElement } from 'react'
import {
  fieldControlProps,
  fieldErrors,
  fieldInvalidState,
  formProps,
  useForm,
  useFormSubmitting,
} from '@gedatou/cadenza-form'
import {
  Button,
  Checkbox,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  Input,
  Select,
  SelectGroup,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@gedatou/cadenza-ui'
import { toast } from 'sonner'
import { z } from 'zod'

// 多字段综合:文本 + 下拉 + 勾选混排,同一套门面接线;
// 提交按钮的 pending 来自 useFormSubmitting
const VOICE_PARTS = {
  soprano: '女高音',
  alto: '女低音',
  tenor: '男高音',
  bass: '男低音',
} as const

const schema = z.object({
  fullName: z.string().min(2, '姓名至少 2 个字'),
  voicePart: z.string().min(1, '请选择声部'),
  agreeTerms: z.boolean().refine(value => value, '报名前请先同意排练守则'),
})

export default function ComplexDemo(): ReactElement {
  const form = useForm({
    defaultValues: { fullName: '', voicePart: '', agreeTerms: false },
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
        <form.Field name="fullName">
          {(field) => {
            const { errorId, invalid } = fieldInvalidState(field)
            return (
              <Field data-invalid={invalid || undefined}>
                <FieldLabel htmlFor={field.name}>姓名</FieldLabel>
                <Input
                  {...fieldControlProps(field)}
                  value={field.state.value}
                  autoComplete="name"
                  placeholder="葛大头"
                  onBlur={field.handleBlur}
                  onChange={event => field.handleChange(event.target.value)}
                />
                <FieldError id={errorId} errors={fieldErrors(field)} />
              </Field>
            )
          }}
        </form.Field>
        <form.Field name="voicePart">
          {(field) => {
            const { errorId, invalid } = fieldInvalidState(field)
            return (
              <Field orientation="responsive" data-invalid={invalid || undefined}>
                <FieldContent>
                  <FieldLabel htmlFor={field.name}>声部</FieldLabel>
                  <FieldError id={errorId} errors={fieldErrors(field)} />
                </FieldContent>
                <Select
                  items={VOICE_PARTS}
                  name={field.name}
                  value={field.state.value || null}
                  onValueChange={value => field.handleChange(value ?? '')}
                >
                  <SelectTrigger
                    id={field.name}
                    aria-describedby={errorId}
                    aria-invalid={invalid}
                    className="min-inline-[120px]"
                  >
                    <SelectValue placeholder="选一个声部" />
                  </SelectTrigger>
                  <SelectPopup>
                    <SelectGroup>
                      {Object.entries(VOICE_PARTS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectPopup>
                </Select>
              </Field>
            )
          }}
        </form.Field>
        <FieldSeparator />
        <form.Field name="agreeTerms">
          {(field) => {
            const { errorId, invalid } = fieldInvalidState(field)
            return (
              <Field orientation="horizontal" data-invalid={invalid || undefined}>
                <Checkbox
                  id={field.name}
                  name={field.name}
                  checked={field.state.value}
                  aria-describedby={errorId}
                  aria-invalid={invalid}
                  onCheckedChange={checked => field.handleChange(checked)}
                />
                <FieldContent>
                  <FieldLabel htmlFor={field.name}>同意排练守则</FieldLabel>
                  <FieldDescription>准时出勤，请假提前一天说。</FieldDescription>
                  <FieldError id={errorId} errors={fieldErrors(field)} />
                </FieldContent>
              </Field>
            )
          }}
        </form.Field>
        <Field orientation="horizontal">
          <Button type="submit" pending={submitting}>报名</Button>
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            重置
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
