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
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@gedatou/cadenza-ui'
import { toast } from 'sonner'
import { z } from 'zod'

// InputOTP binding: the protocol is React DOM's — onChange receives the
// string directly, with no second argument; id lands on the invisible
// real input spanning all cells, so fieldControlProps works as-is
const schema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit verification code'),
})

export default function InputOTPDemo(): ReactElement {
  const form = useForm({
    defaultValues: { code: '' },
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
        <form.Field name="code">
          {(field) => {
            const { errorId, invalid } = fieldInvalidState(field)
            return (
              <Field data-invalid={invalid || undefined}>
                <FieldLabel htmlFor={field.name}>SMS verification code</FieldLabel>
                <InputOTP
                  {...fieldControlProps(field)}
                  maxLength={6}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={field.handleChange}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
                <FieldDescription>Pasting the whole code and SMS autofill both work.</FieldDescription>
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
