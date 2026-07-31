import type { SortDescriptor } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import { DataTable } from '@gedatou/cadenza-ui'
import { useMemo, useState } from 'react'
import { PEOPLE } from '../lib/people'
import { personColumns } from './columns'

// 组件只维护排序意图,真正的排序是数据层的事:本地数据自己 sort,
// 服务端数据把 descriptor 转成请求参数。
export default function SortDemo(): ReactElement {
  const [sort, setSort] = useState<SortDescriptor>({ column: 'name', direction: 'ascending' })

  const items = useMemo(() => {
    const column = sort.column as keyof Person
    const sorted = [...PEOPLE.slice(0, 8)].sort((a, b) =>
      String(a[column]).localeCompare(String(b[column]), undefined, { numeric: true }))
    return sort.direction === 'descending' ? sorted.reverse() : sorted
  }, [sort])

  const columns = useMemo(
    () => personColumns.map(column => ({ ...column, allowsSorting: true })),
    [],
  )

  return (
    <DataTable<Person>
      aria-label="作曲家(可排序)"
      columns={columns}
      items={items}
      onSortChange={setSort}
      sortDescriptor={sort}
    />
  )
}
