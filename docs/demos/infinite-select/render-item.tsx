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

// renderItem replaces the whole row content: the default check mark goes
// too, so draw the selected state yourself from selected
export default function RenderItemDemo(): ReactElement {
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
      renderItem={({ item, index, selected }) => (
        <>
          <span className="
            text-end text-xs text-muted-foreground tabular-nums inline-8
          "
          >
            {index + 1}
            .
          </span>
          <span className="flex-1 truncate">{item.name}</span>
          <span className="text-xs text-muted-foreground">{item.role}</span>
          {selected && <span className="text-xs text-primary">✓</span>}
        </>
      )}
    >
      <DemoButton>{picked ? picked.name : 'Custom row content'}</DemoButton>
      {selectSlots}
      <InfiniteSelectLoadingMore>Loading more…</InfiniteSelectLoadingMore>
    </InfiniteCombobox>
  )
}
