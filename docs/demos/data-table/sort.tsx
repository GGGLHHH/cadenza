import type { SortDescriptor } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import { DataTable } from '@gedatou/cadenza-ui'
import { useMemo, useState } from 'react'
import { PEOPLE } from '../lib/people'
import { personColumns } from './columns'

// The component only holds the sort intent; the actual sorting belongs to
// the data layer: local data sorts itself, server data turns the
// descriptor into request params.
export default function SortDemo(): ReactElement {
  const [sort, setSort] = useState<SortDescriptor>({ column: 'name', direction: 'ascending' })

  const items = useMemo(() => {
    const column = sort.column as keyof Person
    const sorted = [...PEOPLE.slice(0, 8)].sort((a, b) =>
      String(a[column]).localeCompare(String(b[column]), undefined, { numeric: true }))
    return sort.direction === 'descending' ? sorted.reverse() : sorted
  }, [sort])

  const columns = useMemo(
    () => personColumns.map(column => ({ ...column, sortable: true })),
    [],
  )

  return (
    <DataTable<Person>
      aria-label="Composers (sortable)"
      columns={columns}
      items={items}
      onSortChange={setSort}
      sortDescriptor={sort}
    />
  )
}
