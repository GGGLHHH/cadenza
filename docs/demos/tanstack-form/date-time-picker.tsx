import type { ReactElement } from 'react'
import {
  fieldErrors,
  fieldInvalidState,
  formProps,
  useForm,
} from '@gedatou/cadenza-form'
import {
  Button,
  DateTimePicker,
  DateTimePickerClear,
  DateTimePickerInput,
  DateTimePickerTrigger,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  InputGroup,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

// DateTimePicker binding: DatePicker's, verbatim — Date | null, controlled
// via value/onValueChange. The bound itself lives on the control (max = now):
// later days and times cannot be picked or typed, so the schema only has to
// say "required".
const schema = z.object({
  contactedAt: z
    .date({ error: 'Pick when you called' })
    .nullable()
    .refine(value => value !== null, 'Pick when you called'),
})

export default function DateTimePickerDemo(): ReactElement {
  const [now] = useState(() => new Date())
  const form = useForm({
    defaultValues: { contactedAt: null as Date | null },
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
        <form.Field name="contactedAt">
          {(field) => {
            const { errorId, invalid } = fieldInvalidState(field)
            return (
              <Field data-invalid={invalid || undefined}>
                <FieldLabel htmlFor={field.name}>Called the patient at</FieldLabel>
                <DateTimePicker
                  id={field.name}
                  max={now}
                  name={field.name}
                  value={field.state.value}
                  onValueChange={value => field.handleChange(value)}
                >
                  <InputGroup>
                    <DateTimePickerInput
                      aria-describedby={errorId}
                      aria-invalid={invalid}
                      aria-required
                      placeholder="yyyy-MM-dd HH:mm"
                      onBlur={field.handleBlur}
                    />
                    <DateTimePickerClear />
                    <DateTimePickerTrigger />
                  </InputGroup>
                </DateTimePicker>
                <FieldDescription>No later than now.</FieldDescription>
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
