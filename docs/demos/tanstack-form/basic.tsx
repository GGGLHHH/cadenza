import type { ReactElement } from 'react'
import {
  fieldControlProps,
  fieldErrors,
  fieldInvalidState,
  formProps,
  useForm,
  useFormSubmitting,
} from '@gedatou/cadenza-form'
import {
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  Textarea,
} from '@gedatou/cadenza-ui'
import { toast } from 'sonner'
import { z } from 'zod'

// A bug-report form using the whole facade: onChange validates live,
// errors wait until blur or submit to show; aria wiring
// (fieldControlProps) and submit handling (formSubmitHandler) are
// package defaults, so the demo has zero glue
const schema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(32, 'Title must be at most 32 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(100, 'Description must be at most 100 characters'),
})

const DEFAULT_VALUES = { title: '', description: '' }

export default function BasicDemo(): ReactElement {
  const form = useForm({
    defaultValues: DEFAULT_VALUES,
    validators: { onChange: schema },
    onSubmit: async ({ formApi, value }) => {
      await new Promise(resolve => setTimeout(resolve, 800))
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
  const submitting = useFormSubmitting(form)

  return (
    <form
      {...formProps(form)}
      className="mx-auto inline-full max-inline-sm"
    >
      <FieldGroup>
        <form.Field name="title">
          {(field) => {
            const { errorId, invalid } = fieldInvalidState(field)
            return (
              <Field data-invalid={invalid || undefined}>
                <FieldLabel htmlFor={field.name}>Title</FieldLabel>
                <Input
                  {...fieldControlProps(field)}
                  value={field.state.value}
                  autoComplete="off"
                  placeholder="Login button unresponsive on mobile"
                  onBlur={field.handleBlur}
                  onChange={event => field.handleChange(event.target.value)}
                />
                <FieldDescription>Sum up the problem in one sentence.</FieldDescription>
                <FieldError id={errorId} errors={fieldErrors(field)} />
              </Field>
            )
          }}
        </form.Field>
        <form.Field name="description">
          {(field) => {
            const { errorId, invalid } = fieldInvalidState(field)
            return (
              <Field data-invalid={invalid || undefined}>
                <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                <Textarea
                  {...fieldControlProps(field)}
                  value={field.state.value}
                  placeholder="Steps to reproduce, expected behavior, actual behavior…"
                  onBlur={field.handleBlur}
                  onChange={event => field.handleChange(event.target.value)}
                />
                <FieldDescription>20-100 characters; the more specific the better.</FieldDescription>
                <FieldError id={errorId} errors={fieldErrors(field)} />
              </Field>
            )
          }}
        </form.Field>
        <Field orientation="horizontal">
          <Button type="submit" pending={submitting}>Submit</Button>
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
