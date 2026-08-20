import type { DataTableColumn } from '@gedatou/cadenza-ui'
import type { Person } from '../lib/people'

// Base column definitions shared by several demos.
export const personColumns: DataTableColumn<Person>[] = [
  { id: 'name', header: 'Name', cell: person => person.name, rowHeader: true },
  { id: 'role', header: 'Role', cell: person => person.role },
  { id: 'born', header: 'Born', cell: person => person.born, width: 90 },
  { id: 'works', header: 'Works', cell: person => person.works, width: 90 },
]
