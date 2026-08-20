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

// RadioGroup binding: controlled at the group (value/onValueChange),
// aria-invalid on each item; the group itself cannot receive htmlFor, so
// FieldLegend's id is wired to the group by hand via aria-labelledby
const PLANS = [
  { id: 'monthly', title: 'Monthly', description: 'Cancel anytime; good for trying it out.' },
  { id: 'yearly', title: 'Yearly', description: 'Pay once, save two months.' },
] as const

const schema = z.object({
  plan: z.string().min(1, 'Select a plan'),
})

export default function RadioGroupDemo(): ReactElement {
  const form = useForm({
    defaultValues: { plan: '' },
    validators: { onChange: schema },
    onSubmit: ({ formApi, value }) => {
      toast('Submitted the following:', {
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
                <FieldLegend id="plan-legend">Subscription plan</FieldLegend>
                <FieldDescription>Upgrade or downgrade anytime later.</FieldDescription>
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
          <Button type="submit">Submit</Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
