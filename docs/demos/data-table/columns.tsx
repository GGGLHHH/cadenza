import type { DataTableColumn } from '@gedatou/cadenza-ui'
import type { Person } from '../lib/people'

// 多个 demo 共用的基础列定义。
export const personColumns: DataTableColumn<Person>[] = [
  { id: 'name', header: '姓名', cell: person => person.name, isRowHeader: true },
  { id: 'role', header: '角色', cell: person => person.role },
  { id: 'born', header: '生年', cell: person => person.born, width: 90 },
  { id: 'works', header: '作品数', cell: person => person.works, width: 90 },
]
