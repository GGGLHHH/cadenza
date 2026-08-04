import type { DataTableColumn } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import { DataTable } from '@gedatou/cadenza-ui'
import { PEOPLE } from '../lib/people'

const columns: DataTableColumn<Person>[] = [
  { id: 'name', header: '姓名', cell: person => person.name, rowHeader: true },
  { id: 'role', header: '角色', cell: person => person.role },
]

export default function BasicDemo(): ReactElement {
  return (
    <DataTable<Person>
      aria-label="作曲家"
      columns={columns}
      items={PEOPLE.slice(0, 5)}
    />
  )
}
