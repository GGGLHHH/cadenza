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
  Input,
} from '@gedatou/cadenza-ui'
import { toast } from 'sonner'
import { z } from 'zod'

// Input binding: the value/onChange/onBlur trio is hand-written; the
// id/name/aria quartet is spread in one go by fieldControlProps
const schema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(10, 'Username must be at most 10 characters')
    .regex(/^\w+$/, 'Only letters, digits, and underscores allowed'),
})

export default function InputDemo(): ReactElement {
  const form = useForm({
    defaultValues: { username: '' },
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
        <form.Field name="username">
          {(field) => {
            const { errorId, invalid } = fieldInvalidState(field)
            return (
              <Field data-invalid={invalid || undefined}>
                <FieldLabel htmlFor={field.name}>Username</FieldLabel>
                <Input
                  {...fieldControlProps(field)}
                  value={field.state.value}
                  autoComplete="username"
                  placeholder="gedatou"
                  onBlur={field.handleBlur}
                  onChange={event => field.handleChange(event.target.value)}
                />
                <FieldDescription>
                  Shown publicly; 3-10 characters, letters, digits, and
                  underscores only.
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
