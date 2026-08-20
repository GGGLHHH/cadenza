import type { ReactElement } from 'react'
import {
  fieldErrors,
  fieldInvalidState,
  formProps,
  useForm,
} from '@gedatou/cadenza-form'
import {
  Button,
  Checkbox,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@gedatou/cadenza-ui'
import { toast } from 'sonner'
import { z } from 'zod'

// A checkbox list = an array field with mode="array": pushValue/removeValue
// are native tanstack APIs, usable as-is through the facade; the error
// hangs at the FieldSet level and each item only wires up aria
const TASKS = [
  { id: 'attendance', label: 'Attendance tracking' },
  { id: 'sheets', label: 'Sheet music filing' },
  { id: 'warmup', label: 'Leading warm-ups' },
] as const

const schema = z.object({
  tasks: z.array(z.string()).min(1, 'Claim at least one task'),
})

export default function CheckboxDemo(): ReactElement {
  const form = useForm({
    defaultValues: { tasks: [] as string[] },
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
        <form.Field name="tasks" mode="array">
          {(field) => {
            const { errorId, invalid } = fieldInvalidState(field)
            return (
              <FieldSet data-invalid={invalid || undefined}>
                <FieldLegend variant="label" required>Season tasks</FieldLegend>
                <FieldDescription>You will be notified when a claimed task is updated.</FieldDescription>
                <FieldGroup>
                  {TASKS.map(task => (
                    <Field key={task.id} orientation="horizontal">
                      <Checkbox
                        id={`tasks-${task.id}`}
                        name={field.name}
                        checked={field.state.value.includes(task.id)}
                        aria-describedby={errorId}
                        aria-invalid={invalid}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            field.pushValue(task.id)
                            return
                          }
                          const index = field.state.value.indexOf(task.id)
                          if (index > -1)
                            void field.removeValue(index)
                        }}
                      />
                      <FieldLabel htmlFor={`tasks-${task.id}`}>
                        {task.label}
                      </FieldLabel>
                    </Field>
                  ))}
                </FieldGroup>
                <FieldError id={errorId} errors={fieldErrors(field)} />
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
