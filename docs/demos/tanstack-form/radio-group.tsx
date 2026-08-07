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
  FieldLegend,
  FieldSet,
  RadioGroup,
  RadioGroupItem,
} from '@gedatou/cadenza-ui'
import { toast } from 'sonner'
import { z } from 'zod'

// RadioGroup 绑定:受控在组上(value/onValueChange),aria-invalid 在各项上;
// 组本身接不到 htmlFor,FieldLegend 的 id 经 aria-labelledby 手工接给组
const PLANS = [
  { id: 'monthly', title: '按月', description: '随时取消，适合先试试。' },
  { id: 'yearly', title: '按年', description: '一次付清，省下两个月。' },
] as const

const schema = z.object({
  plan: z.string().min(1, '请选择一个方案'),
})

export default function RadioGroupDemo(): ReactElement {
  const form = useForm({
    defaultValues: { plan: '' },
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
        <form.Field name="plan">
          {(field) => {
            const { errorId, invalid } = fieldInvalidState(field)
            return (
              <FieldSet data-invalid={invalid || undefined}>
                <FieldLegend id="plan-legend">订阅方案</FieldLegend>
                <FieldDescription>之后随时可以升降级。</FieldDescription>
                <RadioGroup
                  aria-labelledby="plan-legend"
                  aria-required
                  name={field.name}
                  value={field.state.value}
                  onValueChange={value => field.handleChange(String(value))}
                >
                  {PLANS.map(plan => (
                    <Field key={plan.id} orientation="horizontal">
                      <RadioGroupItem
                        id={`plan-${plan.id}`}
                        value={plan.id}
                        aria-describedby={errorId}
                        aria-invalid={invalid}
                      />
                      <FieldContent>
                        <FieldLabel htmlFor={`plan-${plan.id}`}>
                          {plan.title}
                        </FieldLabel>
                        <FieldDescription>{plan.description}</FieldDescription>
                      </FieldContent>
                    </Field>
                  ))}
                </RadioGroup>
                <FieldError id={errorId} errors={fieldErrors(field)} />
              </FieldSet>
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
