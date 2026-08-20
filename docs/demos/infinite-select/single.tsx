import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import {
  InfiniteCombobox,
  InfiniteSelectLoadingMore,
  useInfiniteComboboxState,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { DemoButton } from '../lib/demo-button'
import { getOption } from '../lib/people'
import { useFakeInfiniteList } from '../lib/use-fake-infinite-list'
import { selectSlots } from './slots'

export default function SingleDemo(): ReactElement {
  const state = useInfiniteComboboxState()
  const list = useFakeInfiniteList(state.queryValue)
  const [picked, setPicked] = useState<Person | null>(null)

  return (
    <InfiniteCombobox<Person>
      getOption={getOption}
      list={list}
      onValueChange={setPicked}
      searchPlaceholder="Search composers…"
      state={state}
    >
      <DemoButton>{picked ? picked.name : 'Pick a composer'}</DemoButton>
      {selectSlots}
      <InfiniteSelectLoadingMore>Loading more…</InfiniteSelectLoadingMore>
    </InfiniteCombobox>
  )
}
