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

// Switch binding: checked/onCheckedChange, the same contract as Checkbox;
// in the horizontal layout the error shows in the FieldContent column
const schema = z.object({
  twoFactor: z.boolean().refine(value => value, 'Enable two-factor authentication before submitting'),
})

export default function SwitchDemo(): ReactElement {
  const form = useForm({
    defaultValues: { twoFactor: false },
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
        <form.Field name="twoFactor">
          {(field) => {
            const { errorId, invalid } = fieldInvalidState(field)
            return (
              <Field orientation="horizontal" data-invalid={invalid || undefined}>
                <FieldContent>
                  <FieldLabel htmlFor={field.name}>Two-factor authentication</FieldLabel>
                  <FieldDescription>
                    Enable two-factor authentication to protect your account.
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
          <Button type="submit">Submit</Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
