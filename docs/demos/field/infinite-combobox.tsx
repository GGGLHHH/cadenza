import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import {
  Field,
  FieldDescription,
  FieldLabel,
  InfiniteCombobox,
  InfiniteSelectLoadingMore,
  useInfiniteComboboxState,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { selectSlots } from '../infinite-select/slots'
import { DemoButton } from '../lib/demo-button'
import { getOption } from '../lib/people'
import { useFakeInfiniteList } from '../lib/use-fake-infinite-list'

// triggerId is the only wiring here: FieldLabel htmlFor points at it, so
// pressing the text focuses and opens. Note the absence of aria-label —
// unlike Select there is no aria-labelledby on the trigger; the native
// <label for> alone is its accessible name.
export default function FieldInfiniteComboboxDemo(): ReactElement {
  const state = useInfiniteComboboxState()
  const list = useFakeInfiniteList(state.queryValue)
  const [picked, setPicked] = useState<Person | null>(null)

  return (
    <Field className="max-inline-sm">
      <FieldLabel htmlFor="field-composer">Composer</FieldLabel>
      <InfiniteCombobox<Person>
        getOption={getOption}
        list={list}
        onValueChange={setPicked}
        searchPlaceholder="Search composers…"
        state={state}
        triggerId="field-composer"
      >
        <DemoButton>{picked ? picked.name : 'Pick a composer'}</DemoButton>
        {selectSlots}
        <InfiniteSelectLoadingMore>Loading more…</InfiniteSelectLoadingMore>
      </InfiniteCombobox>
      <FieldDescription>Search across ten thousand rows; scrolling to the bottom loads the next page.</FieldDescription>
    </Field>
  )
}
