import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import { DataTable } from '@gedatou/cadenza-ui'
import { TOTAL } from '../lib/people'
import { useFakeInfiniteList } from '../lib/use-fake-infinite-list'
import { personColumns } from './columns'
import { tableSlots } from './slots'

// 一次拉满 10000 条,没有翻页,纯粹考验渲染:虚拟化让 DOM 始终只有几十个节点
export default function VirtualizedDemo(): ReactElement {
  const list = useFakeInfiniteList(undefined, { pageSize: TOTAL })

  return (
    <DataTable<Person>
      aria-label="作曲家(虚拟化)"
      columns={personColumns}
      maxHeight={400}
      virtualized
      {...list}
    >
      {tableSlots}
    </DataTable>
  )
}
