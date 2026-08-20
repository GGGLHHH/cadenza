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
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  Select,
  SelectGroup,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@gedatou/cadenza-ui'
import { toast } from 'sonner'
import { z } from 'zod'

// Select binding: controlled via value/onValueChange (clearing returns
// null, folded back to ''); id lands on SelectTrigger, and aria wiring is
// hand-distributed with fieldInvalidState
const VOICES = {
  soprano: 'Soprano',
  alto: 'Alto',
  tenor: 'Tenor',
  bass: 'Bass',
} as const

const schema = z.object({
  voice: z.string().min(1, 'Select your voice part'),
})

export default function SelectDemo(): ReactElement {
  const form = useForm({
    defaultValues: { voice: '' },
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
        <form.Field name="voice">
          {(field) => {
            const { errorId, invalid } = fieldInvalidState(field)
            return (
              <Field orientation="responsive" data-invalid={invalid || undefined}>
                <FieldContent>
                  <FieldLabel htmlFor={field.name}>Voice part</FieldLabel>
                  <FieldDescription>Rehearsal groups are arranged by voice part.</FieldDescription>
                  <FieldError id={errorId} errors={fieldErrors(field)} />
                </FieldContent>
                <Select
                  items={VOICES}
                  name={field.name}
                  value={field.state.value || null}
                  onValueChange={value => field.handleChange(value ?? '')}
                >
                  <SelectTrigger
                    id={field.name}
                    aria-describedby={errorId}
                    aria-invalid={invalid}
                    aria-required
                    className="min-inline-[120px]"
                  >
                    <SelectValue placeholder="Pick a voice part" />
                  </SelectTrigger>
                  <SelectPopup>
                    <SelectGroup>
                      {Object.entries(VOICES).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectPopup>
                </Select>
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
