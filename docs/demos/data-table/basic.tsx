import type { DataTableColumn } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import { DataTable } from '@gedatou/cadenza-ui'
import { PEOPLE } from '../lib/people'

const columns: DataTableColumn<Person>[] = [
  { id: 'name', header: 'Name', cell: person => person.name, rowHeader: true },
  { id: 'role', header: 'Role', cell: person => person.role },
]

export default function BasicDemo(): ReactElement {
  return (
    <DataTable<Person>
      aria-label="Composers"
      columns={columns}
      items={PEOPLE.slice(0, 5)}
    />
  )
}
