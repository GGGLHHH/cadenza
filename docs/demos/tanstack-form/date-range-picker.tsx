import type { DateRange } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import {
  fieldErrors,
  fieldInvalidState,
  formProps,
  useForm,
} from '@gedatou/cadenza-form'
import {
  Button,
  DateRangePicker,
  DateRangePickerClear,
  DateRangePickerEndInput,
  DateRangePickerStartInput,
  DateRangePickerTrigger,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  InputGroup,
} from '@gedatou/cadenza-ui'
import { IconArrowNarrowRight } from '@tabler/icons-react'
import { toast } from 'sonner'
import { z } from 'zod'

// DateRangePicker binding: the value is { from?, to? } | null. Both ends
// are optional — whichever input is clicked first fills its end first, so
// half-ranges with only from or only to do enter the form. Mark both ends
// optional, or a half-range hits zod's own required error and bypasses the
// message below; completeness is gated by refine alone, giving half-ranges
// and null the same sentence.
const schema = z.object({
  stay: z
    .object({ from: z.date().optional(), to: z.date().optional() })
    .nullable()
    .refine(
      value => value !== null && value.from !== undefined && value.to !== undefined,
      'Select a complete stay range',
    ),
})

export default function DateRangePickerDemo(): ReactElement {
  const form = useForm({
    defaultValues: { stay: null as DateRange | null },
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
        <form.Field name="stay">
          {(field) => {
            const { errorId, invalid } = fieldInvalidState(field)
            return (
              <Field data-invalid={invalid || undefined}>
                <FieldLabel htmlFor={field.name}>Stay range</FieldLabel>
                <DateRangePicker
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onValueChange={value => field.handleChange(value)}
                >
                  <InputGroup>
                    <DateRangePickerStartInput
                      aria-describedby={errorId}
                      aria-invalid={invalid}
                      aria-required
                      placeholder="Check-in"
                      onBlur={field.handleBlur}
                    />
                    <IconArrowNarrowRight
                      aria-hidden
                      className="
                        shrink-0 text-muted-foreground block-4 inline-4
                      "
                    />
                    <DateRangePickerEndInput
                      aria-describedby={errorId}
                      aria-invalid={invalid}
                      aria-required
                      placeholder="Check-out"
                      onBlur={field.handleBlur}
                    />
                    <DateRangePickerClear />
                    <DateRangePickerTrigger />
                  </InputGroup>
                </DateRangePicker>
                <FieldDescription>In the calendar, the first click sets the start, the second closes the range.</FieldDescription>
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
