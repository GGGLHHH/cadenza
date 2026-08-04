import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import { InfiniteCombobox, useInfiniteComboboxState } from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { DemoButton } from '../lib/demo-button'
import { getOption, TOTAL } from '../lib/people'
import { useFakeInfiniteList } from '../lib/use-fake-infinite-list'
import { selectSlots } from './slots'

// 一次拉满 10000 条:虚拟化让 DOM 始终只有可视窗口加 overscan 的几十个节点
export default function VirtualizedDemo(): ReactElement {
  const state = useInfiniteComboboxState()
  const list = useFakeInfiniteList(state.queryValue, { pageSize: TOTAL })
  const [picked, setPicked] = useState<Person | null>(null)

  return (
    <InfiniteCombobox<Person>
      getOption={getOption}
      list={list}
      onChange={setPicked}
      searchPlaceholder="在 10000 条里搜索…"
      state={state}
      virtualized
    >
      <DemoButton>{picked ? picked.name : '虚拟化:一次载入 10000 条'}</DemoButton>
      {selectSlots}
    </InfiniteCombobox>
  )
}
