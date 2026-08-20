import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import {
  InfiniteCombobox,
  InfiniteSelectCancel,
  InfiniteSelectClear,
  InfiniteSelectClose,
  InfiniteSelectFooter,
  InfiniteSelectFooterSeparator,
  useInfiniteComboboxState,
  useInfiniteSelectActions,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { DemoButton } from '../lib/demo-button'
import { getOption } from '../lib/people'
import { useFakeInfiniteList } from '../lib/use-fake-infinite-list'
import { selectSlots } from './slots'

// Custom footer part: useInfiniteSelectActions hands over the current
// selection, no external wiring needed
function FooterSelectedCount(): ReactElement {
  const { selectedIds } = useInfiniteSelectActions()
  return (
    <span className="px-3 text-xs whitespace-nowrap text-muted-foreground">
      Selected
      {' '}
      {selectedIds.length}
    </span>
  )
}

export default function FooterDemo(): ReactElement {
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
        {ids.length > 0 ? `${ids.length} selected` : 'Footer family + custom part'}
      </DemoButton>
      {selectSlots}
      {/* All three actions shown together for comparison (pick one in real
          scenarios): Clear commits an empty set, Cancel drops the draft and
          restores the pre-open state, Done commits the draft. Tick a few then
          press Cancel — reopening shows the ticks rolled back intact */}
      <InfiniteSelectFooter>
        <FooterSelectedCount />
        <InfiniteSelectFooterSeparator />
        <InfiniteSelectClear>Clear</InfiniteSelectClear>
        <InfiniteSelectCancel>Cancel</InfiniteSelectCancel>
        <InfiniteSelectClose>Done</InfiniteSelectClose>
      </InfiniteSelectFooter>
    </InfiniteCombobox>
  )
}
