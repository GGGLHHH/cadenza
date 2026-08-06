import type { ReactElement } from 'react'
import {
  createFormHook,
  fieldControlProps,
  fieldErrors,
  fieldInvalidState,
  formProps,
  useFieldContext,
} from '@gedatou/cadenza-form'
import {
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
} from '@gedatou/cadenza-ui'
import { toast } from 'sonner'
import { z } from 'zod'

// createFormHook:把「Field + aria + 错误」的字段外壳沉淀成一个 TextField,
// 注册一次,处处 <field.TextField> —— 页面层不再出现任何接线
interface TextFieldProps {
  label: string
  description?: string
  placeholder?: string
}

function TextField({ label, description, placeholder }: TextFieldProps): ReactElement {
  const field = useFieldContext<string>()
  const { errorId, invalid } = fieldInvalidState(field)

  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        {...fieldControlProps(field)}
        value={field.state.value}
        placeholder={placeholder}
        onBlur={field.handleBlur}
        onChange={event => field.handleChange(event.target.value)}
      />
      {description !== undefined && (
        <FieldDescription>{description}</FieldDescription>
      )}
      <FieldError id={errorId} errors={fieldErrors(field)} />
    </Field>
  )
}

const { useAppForm } = createFormHook({ fieldComponents: { TextField } })

const schema = z.object({
  displayName: z.string().min(2, '显示名至少 2 个字'),
  motto: z.string().min(4, '座右铭至少 4 个字'),
})

export default function CreateFormHookDemo(): ReactElement {
  const form = useAppForm({
    defaultValues: { displayName: '', motto: '' },
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
        <form.AppField name="displayName">
          {field => (
            <field.TextField
              label="显示名"
              description="团里怎么称呼你。"
              placeholder="大头"
            />
          )}
        </form.AppField>
        <form.AppField name="motto">
          {field => <field.TextField label="座右铭" placeholder="唱准比唱响重要" />}
        </form.AppField>
        <Field orientation="horizontal">
          <Button type="submit">保存</Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
