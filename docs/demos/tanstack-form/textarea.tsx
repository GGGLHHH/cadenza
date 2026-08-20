import type { ReactElement } from 'react'
import {
  fieldControlProps,
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
  Textarea,
} from '@gedatou/cadenza-ui'
import { toast } from 'sonner'
import { z } from 'zod'

// Textarea binding is isomorphic to Input: swap the control, keep the code
const schema = z.object({
  about: z
    .string()
    .min(20, 'Introduction must be at least 20 characters')
    .max(200, 'Introduction must be at most 200 characters'),
})

export default function TextareaDemo(): ReactElement {
  const form = useForm({
    defaultValues: { about: '' },
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
        <form.Field name="about">
          {(field) => {
            const { errorId, invalid } = fieldInvalidState(field)
            return (
              <Field data-invalid={invalid || undefined}>
                <FieldLabel htmlFor={field.name}>About you</FieldLabel>
                <Textarea
                  {...fieldControlProps(field)}
                  value={field.state.value}
                  className="min-block-[120px]"
                  placeholder="I lead the soprano section…"
                  onBlur={field.handleBlur}
                  onChange={event => field.handleChange(event.target.value)}
                />
                <FieldDescription>
                  Used to personalize your rehearsal schedule.
                </FieldDescription>
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
