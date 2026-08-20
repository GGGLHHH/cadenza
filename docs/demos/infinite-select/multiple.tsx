import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import {
  InfiniteCombobox,
  InfiniteSelectClear,
  InfiniteSelectClose,
  InfiniteSelectFooter,
  InfiniteSelectFooterSeparator,
  InfiniteSelectLoadingMore,
  useInfiniteComboboxState,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { DemoButton } from '../lib/demo-button'
import { getOption } from '../lib/people'
import { useFakeInfiniteList } from '../lib/use-fake-infinite-list'
import { selectSlots } from './slots'

// commitOnClose: ticks inside the popup are only a draft; closing the popup
// commits onValueChange exactly once
export default function MultiDemo(): ReactElement {
  const state = useInfiniteComboboxState()
  const list = useFakeInfiniteList(state.queryValue)
  const [ids, setIds] = useState<string[]>([])

  return (
    <InfiniteCombobox<Person>
      commitOnClose
      getOption={getOption}
      list={list}
      selectionMode="multiple"
      onValueChange={(_items, nextIds) => setIds(nextIds)}
      searchPlaceholder="Search composers…"
      state={state}
      value={ids}
    >
      <DemoButton>
        {ids.length > 0 ? `${ids.length} selected` : 'Pick several composers'}
      </DemoButton>
      {selectSlots}
      <InfiniteSelectFooter>
        <InfiniteSelectClear>Clear</InfiniteSelectClear>
        <InfiniteSelectFooterSeparator />
        <InfiniteSelectClose>Done</InfiniteSelectClose>
      </InfiniteSelectFooter>
      <InfiniteSelectLoadingMore>Loading more…</InfiniteSelectLoadingMore>
    </InfiniteCombobox>
  )
}
