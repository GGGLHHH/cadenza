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
  Select,
  SelectGroup,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@gedatou/cadenza-ui'
import { toast } from 'sonner'
import { z } from 'zod'

// Select 绑定:受控走 value/onValueChange(清除时回 null,统一折回 '');
// id 落在 SelectTrigger 上,aria 接线用 fieldInvalidState 手工分发
const VOICES = {
  soprano: '女高音',
  alto: '女低音',
  tenor: '男高音',
  bass: '男低音',
} as const

const schema = z.object({
  voice: z.string().min(1, '请选择你的声部'),
})

export default function SelectDemo(): ReactElement {
  const form = useForm({
    defaultValues: { voice: '' },
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
        <form.Field name="voice">
          {(field) => {
            const { errorId, invalid } = fieldInvalidState(field)
            return (
              <Field orientation="responsive" data-invalid={invalid || undefined}>
                <FieldContent>
                  <FieldLabel htmlFor={field.name}>声部</FieldLabel>
                  <FieldDescription>排练分组按声部安排。</FieldDescription>
                  <FieldError id={errorId} errors={fieldErrors(field)} />
                </FieldContent>
                <Select
                  items={VOICES}
                  name={field.name}
                  value={field.state.value || null}
                  onValueChange={value => field.handleChange(value ?? '')}
                >
                  <SelectTrigger
                    id={field.name}
                    aria-describedby={errorId}
                    aria-invalid={invalid}
                    aria-required
                    className="min-inline-[120px]"
                  >
                    <SelectValue placeholder="选一个声部" />
                  </SelectTrigger>
                  <SelectPopup>
                    <SelectGroup>
                      {Object.entries(VOICES).map(([value, label]) => (
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
        <Field orientation="horizontal">
          <Button type="submit">提交</Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
