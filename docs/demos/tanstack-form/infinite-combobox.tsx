import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import {
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
  InfiniteCombobox,
  InfiniteSelectLoadingMore,
  useInfiniteComboboxState,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { selectSlots } from '../infinite-select/slots'
import { DemoButton } from '../lib/demo-button'
import { getOption } from '../lib/people'
import { useFakeInfiniteList } from '../lib/use-fake-infinite-list'

// InfiniteCombobox binding: the single-select controlled value is the
// **id string** (null when empty), while onValueChange hands back the
// object — the form persists the id and local state keeps the object for
// display; name renders a hidden input next to the trigger (outside the
// popup, not unmounted on close), triggerId hooks into htmlFor
const schema = z.object({
  composerId: z.string().nullable().refine(value => value !== null, 'Select a composer'),
})

export default function InfiniteComboboxDemo(): ReactElement {
  const state = useInfiniteComboboxState()
  const list = useFakeInfiniteList(state.queryValue)
  const [picked, setPicked] = useState<Person | null>(null)
  const form = useForm({
    defaultValues: { composerId: null as string | null },
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
      setPicked(null)
    },
  })

  return (
    <form
      {...formProps(form)}
      className="mx-auto inline-full max-inline-sm"
    >
      <FieldGroup>
        <form.Field name="composerId">
          {(field) => {
            const { errorId, invalid } = fieldInvalidState(field)
            return (
              <Field data-invalid={invalid || undefined}>
                <FieldLabel htmlFor="composer-trigger" required>Favorite composer</FieldLabel>
                <InfiniteCombobox<Person>
                  getOption={getOption}
                  list={list}
                  name={field.name}
                  searchPlaceholder="Search composers…"
                  state={state}
                  triggerId="composer-trigger"
                  value={field.state.value}
                  onValueChange={(item) => {
                    setPicked(item)
                    field.handleChange(item?.id ?? null)
                  }}
                >
                  <DemoButton
                    aria-describedby={errorId}
                    aria-invalid={invalid}
                    className="justify-start inline-full"
                  >
                    {picked ? picked.name : 'Select a composer'}
                  </DemoButton>
                  {selectSlots}
                  <InfiniteSelectLoadingMore>Loading more…</InfiniteSelectLoadingMore>
                </InfiniteCombobox>
                <FieldDescription>
                  The form persists the id, not the object.
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
