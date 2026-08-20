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
  FieldLegend,
  FieldSet,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@gedatou/cadenza-ui'
import { IconX } from '@tabler/icons-react'
import { toast } from 'sonner'
import { z } from 'zod'

// Array fields: mode="array" + pushValue/removeValue are native tanstack
// capabilities, usable as-is through the facade; subfields go through
// fieldControlProps/fieldErrors as usual
const schema = z.object({
  emails: z
    .array(z.object({ address: z.email('Enter a valid email address') }))
    .min(1, 'Enter at least one email')
    .max(5, 'At most 5 emails'),
})

export default function ArrayDemo(): ReactElement {
  const form = useForm({
    defaultValues: { emails: [{ address: '' }] },
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
        <form.Field name="emails" mode="array">
          {(field) => {
            const { errorId, invalid } = fieldInvalidState(field)
            return (
              <FieldSet data-invalid={invalid || undefined}>
                <FieldLegend variant="label">Contact emails</FieldLegend>
                <FieldDescription>Up to 5, used to receive rehearsal notices.</FieldDescription>
                <FieldGroup>
                  {field.state.value.map((_, index) => (
                    // Array fields are addressed by position; the index IS
                    // the identity — using it as the key here is correct
                    // eslint-disable-next-line react/no-array-index-key
                    <form.Field key={index} name={`emails[${index}].address`}>
                      {(subField) => {
                        const sub = fieldInvalidState(subField)
                        return (
                          <Field data-invalid={sub.invalid || undefined}>
                            <InputGroup>
                              <InputGroupInput
                                {...fieldControlProps(subField)}
                                value={subField.state.value}
                                aria-label={`Email ${index + 1}`}
                                placeholder="name@example.com"
                                type="email"
                                onBlur={subField.handleBlur}
                                onChange={event => subField.handleChange(event.target.value)}
                              />
                              {field.state.value.length > 1 && (
                                <InputGroupAddon align="inline-end">
                                  <InputGroupButton
                                    type="button"
                                    variant="ghost"
                                    size="icon-xs"
                                    aria-label={`Remove email ${index + 1}`}
                                    onClick={() => void field.removeValue(index)}
                                  >
                                    <IconX aria-hidden />
                                  </InputGroupButton>
                                </InputGroupAddon>
                              )}
                            </InputGroup>
                            <FieldError id={sub.errorId} errors={fieldErrors(subField)} />
                          </Field>
                        )
                      }}
                    </form.Field>
                  ))}
                </FieldGroup>
                <FieldError id={errorId} errors={fieldErrors(field)} />
                <Field orientation="horizontal">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={field.state.value.length >= 5}
                    onClick={() => void field.pushValue({ address: '' })}
                  >
                    Add email
                  </Button>
                </Field>
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
