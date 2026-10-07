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
  InputGroup,
  TimePicker,
  TimePickerClear,
  TimePickerInput,
  TimePickerTrigger,
} from '@gedatou/cadenza-ui'
import { toast } from 'sonner'
import { z } from 'zod'

// TimePicker binding: DatePicker's, verbatim — the value is natively
// Date | null (only its time of day matters), controlled via
// value/onValueChange. Typing invalid text never lands a value, so the schema
// expresses "required" with .nullable().refine and needs no string parsing.
const schema = z.object({
  startsAt: z
    .date({ error: 'Pick a start time' })
    .nullable()
    .refine(value => value !== null, 'Pick a start time'),
})

export default function TimePickerDemo(): ReactElement {
  const form = useForm({
    defaultValues: { startsAt: null as Date | null },
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
        <form.Field name="startsAt">
          {(field) => {
            const { errorId, invalid } = fieldInvalidState(field)
            return (
              <Field data-invalid={invalid || undefined}>
                <FieldLabel htmlFor={field.name}>Clinic opens at</FieldLabel>
                <TimePicker
                  id={field.name}
                  minuteStep={15}
                  name={field.name}
                  value={field.state.value}
                  onValueChange={value => field.handleChange(value)}
                >
                  <InputGroup>
                    <TimePickerInput
                      aria-describedby={errorId}
                      aria-invalid={invalid}
                      aria-required
                      placeholder="HH:mm"
                      onBlur={field.handleBlur}
                    />
                    <TimePickerClear />
                    <TimePickerTrigger />
                  </InputGroup>
                </TimePicker>
                <FieldDescription>Quarter hours only — type it in or pick from the columns.</FieldDescription>
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
