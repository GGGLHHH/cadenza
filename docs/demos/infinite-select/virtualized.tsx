import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import { InfiniteCombobox, useInfiniteComboboxState } from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { DemoButton } from '../lib/demo-button'
import { getOption, TOTAL } from '../lib/people'
import { useFakeInfiniteList } from '../lib/use-fake-infinite-list'
import { selectSlots } from './slots'

// All 10000 rows pulled at once: virtualization keeps the DOM at just the
// visible window plus overscan — a few dozen nodes
export default function VirtualizedDemo(): ReactElement {
  const state = useInfiniteComboboxState()
  const list = useFakeInfiniteList(state.queryValue, { pageSize: TOTAL })
  const [picked, setPicked] = useState<Person | null>(null)

  return (
    <InfiniteCombobox<Person>
      getOption={getOption}
      list={list}
      onValueChange={setPicked}
      searchPlaceholder="Search across 10000 rows…"
      state={state}
      virtualized
    >
      <DemoButton>{picked ? picked.name : 'Virtualized: 10000 rows at once'}</DemoButton>
      {selectSlots}
    </InfiniteCombobox>
  )
}
