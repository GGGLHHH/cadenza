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

// DatePicker binding: the value is natively Date | null, controlled via
// value/onValueChange. Typing invalid text never lands a value — the form
// only ever sees a valid Date or null, so the schema expresses "required"
// with .nullable().refine and needs no string parsing.
const schema = z.object({
  eventDate: z
    .date({ error: 'Select a date' })
    .nullable()
    .refine(value => value !== null, 'Select a date'),
})

export default function DatePickerDemo(): ReactElement {
  const form = useForm({
    defaultValues: { eventDate: null as Date | null },
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
        <form.Field name="eventDate">
          {(field) => {
            const { errorId, invalid } = fieldInvalidState(field)
            return (
              <Field data-invalid={invalid || undefined}>
                <FieldLabel htmlFor={field.name}>Concert date</FieldLabel>
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
                <FieldDescription>Type it in directly, or pick from the calendar.</FieldDescription>
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
