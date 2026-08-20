import type { ReactElement } from 'react'
import {
  createFormHook,
  fieldControlProps,
  fieldErrors,
  fieldInvalidState,
  formProps,
  useFieldContext,
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

// createFormHook: distill the "Field + aria + error" field shell into one
// TextField, register it once, use <field.TextField> everywhere — no
// wiring ever appears at the page level again
interface TextFieldProps {
  label: string
  description?: string
  placeholder?: string
}

function TextField({ label, description, placeholder }: TextFieldProps): ReactElement {
  const field = useFieldContext<string>()
  const { errorId, invalid } = fieldInvalidState(field)

  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        {...fieldControlProps(field)}
        value={field.state.value}
        placeholder={placeholder}
        onBlur={field.handleBlur}
        onChange={event => field.handleChange(event.target.value)}
      />
      {description !== undefined && (
        <FieldDescription>{description}</FieldDescription>
      )}
      <FieldError id={errorId} errors={fieldErrors(field)} />
    </Field>
  )
}

const { useAppForm } = createFormHook({ fieldComponents: { TextField } })

const schema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  motto: z.string().min(4, 'Motto must be at least 4 characters'),
})

export default function CreateFormHookDemo(): ReactElement {
  const form = useAppForm({
    defaultValues: { displayName: '', motto: '' },
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
        <form.AppField name="displayName">
          {field => (
            <field.TextField
              label="Display name"
              description="What the choir should call you."
              placeholder="Alex"
            />
          )}
        </form.AppField>
        <form.AppField name="motto">
          {field => <field.TextField label="Motto" placeholder="Sing in tune before singing loud" />}
        </form.AppField>
        <Field orientation="horizontal">
          <Button type="submit">Save</Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
