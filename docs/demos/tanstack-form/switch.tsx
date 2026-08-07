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
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  Switch,
} from '@gedatou/cadenza-ui'
import { toast } from 'sonner'
import { z } from 'zod'

// Switch 绑定:checked/onCheckedChange,与 Checkbox 同一契约;
// 横排布局下错误随 FieldContent 一列展示
const schema = z.object({
  twoFactor: z.boolean().refine(value => value, '提交前需开启两步验证'),
})

export default function SwitchDemo(): ReactElement {
  const form = useForm({
    defaultValues: { twoFactor: false },
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
        <form.Field name="twoFactor">
          {(field) => {
            const { errorId, invalid } = fieldInvalidState(field)
            return (
              <Field orientation="horizontal" data-invalid={invalid || undefined}>
                <FieldContent>
                  <FieldLabel htmlFor={field.name}>两步验证</FieldLabel>
                  <FieldDescription>
                    开启两步验证保护你的账号。
                  </FieldDescription>
                  <FieldError id={errorId} errors={fieldErrors(field)} />
                </FieldContent>
                <Switch
                  aria-required
                  id={field.name}
                  name={field.name}
                  checked={field.state.value}
                  aria-describedby={errorId}
                  aria-invalid={invalid}
                  onCheckedChange={checked => field.handleChange(checked)}
                />
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
