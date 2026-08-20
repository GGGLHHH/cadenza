import type { CascaderNode } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import {
  fieldErrors,
  fieldInvalidState,
  formProps,
  useForm,
} from '@gedatou/cadenza-form'
import {
  Button,
  Cascader,
  CascaderTrigger,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@gedatou/cadenza-ui'
import { toast } from 'sonner'
import { z } from 'zod'

// Cascader binding: same shape as Select — the form stores the full path
// (string[], null when empty), controlled via value/onValueChange, name
// goes to the root (hidden input serialization), id lands on
// CascaderTrigger, and aria wiring is hand-distributed with
// fieldInvalidState.
const REGIONS: CascaderNode[] = [
  {
    value: 'zhejiang',
    label: 'Zhejiang',
    items: [
      { value: 'hangzhou', label: 'Hangzhou', items: [{ value: 'xihu', label: 'Xihu District' }, { value: 'binjiang', label: 'Binjiang District' }] },
      { value: 'ningbo', label: 'Ningbo', items: [{ value: 'haishu', label: 'Haishu District' }] },
    ],
  },
  { value: 'beijing', label: 'Beijing' },
]

const schema = z.object({
  region: z.array(z.string()).nullable().refine(path => path !== null, 'Select a region'),
})

export default function CascaderDemo(): ReactElement {
  const form = useForm({
    defaultValues: { region: null as string[] | null },
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
        <form.Field name="region">
          {(field) => {
            const { errorId, invalid } = fieldInvalidState(field)
            return (
              <Field orientation="responsive" data-invalid={invalid || undefined}>
                <FieldContent>
                  <FieldLabel htmlFor={field.name}>Region</FieldLabel>
                  <FieldDescription>Delivery coverage is settled by region.</FieldDescription>
                  <FieldError id={errorId} errors={fieldErrors(field)} />
                </FieldContent>
                <Cascader
                  items={REGIONS}
                  name={field.name}
                  placeholder="Select a region"
                  value={field.state.value}
                  onValueChange={path => field.handleChange(path)}
                >
                  <CascaderTrigger
                    id={field.name}
                    aria-describedby={errorId}
                    aria-invalid={invalid}
                    aria-required
                  />
                </Cascader>
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
