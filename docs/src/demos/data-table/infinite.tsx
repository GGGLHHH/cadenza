import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import { DataTable } from '@gedatou/cadenza-ui'
import { useFakeInfiniteList } from '../lib/use-fake-infinite-list'
import { personColumns } from './columns'
import { tableSlots } from './slots'

// 无限滚动的已加载集无界累积,所以同时开虚拟化:DOM 始终只有窗口内的行
export default function InfiniteDemo(): ReactElement {
  const list = useFakeInfiniteList()

  return (
    <DataTable<Person>
      aria-label="作曲家(无限滚动)"
      columns={personColumns}
      loadingMoreIndicator="加载更多…"
      maxHeight={320}
      virtualized
      {...list}
    >
      {tableSlots}
    </DataTable>
  )
}
