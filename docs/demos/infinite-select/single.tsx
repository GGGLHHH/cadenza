import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import { InfiniteCombobox, useInfiniteComboboxState } from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { DemoButton } from '../lib/demo-button'
import { getOption } from '../lib/people'
import { useFakeInfiniteList } from '../lib/use-fake-infinite-list'
import { selectSlots } from './slots'

export default function SingleDemo(): ReactElement {
  const state = useInfiniteComboboxState()
  const list = useFakeInfiniteList(state.queryValue)
  const [picked, setPicked] = useState<Person | undefined>(undefined)

  return (
    <InfiniteCombobox<Person>
      getOption={getOption}
      list={list}
      loadingMoreIndicator="加载更多…"
      onChange={setPicked}
      searchPlaceholder="搜索作曲家…"
      slots={selectSlots}
      state={state}
    >
      <DemoButton>{picked ? picked.name : '选择作曲家'}</DemoButton>
    </InfiniteCombobox>
  )
}
