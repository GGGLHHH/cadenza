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

// NumberField binding: the value is natively number | null, controlled
// via value/onValueChange, clearing returns null — the schema expresses
// "required" with .nullable().refine, no string conversion needed
const schema = z.object({
  copies: z
    .number({ error: 'Enter a number' })
    .int('Must be an integer')
    .min(1, 'At least 1 copy')
    .max(99, 'At most 99 copies')
    .nullable()
    .refine(value => value !== null, 'Enter the number of copies'),
})

export default function NumberFieldDemo(): ReactElement {
  const form = useForm({
    defaultValues: { copies: null as number | null },
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
        <form.Field name="copies">
          {(field) => {
            const { errorId, invalid } = fieldInvalidState(field)
            return (
              <Field data-invalid={invalid || undefined}>
                <FieldLabel htmlFor={field.name}>Copies</FieldLabel>
                <NumberField
                  id={field.name}
                  name={field.name}
                  min={1}
                  max={99}
                  value={field.state.value}
                  onValueChange={value => field.handleChange(value)}
                >
                  <NumberFieldGroup>
                    <NumberFieldDecrement aria-label="Decrease" />
                    <NumberFieldInput
                      aria-describedby={errorId}
                      aria-invalid={invalid}
                      aria-required
                      placeholder="1–99"
                      onBlur={field.handleBlur}
                    />
                    <NumberFieldIncrement aria-label="Increase" />
                  </NumberFieldGroup>
                </NumberField>
                <FieldDescription>Number of sheet music copies to print.</FieldDescription>
                <FieldError id={errorId} errors={fieldErrors(field)} />
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
