import type { DataTableColumn } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import { DataTable } from '@gedatou/cadenza-ui'
import { PEOPLE } from '../lib/people'

const ERAS = ['巴洛克', '古典', '浪漫', '现代']
const LABELS = ['DG', 'Decca', 'EMI', 'Sony Classical', 'Philips']

// 同侧多列固定:姓名 + 角色都钉在左侧,sticky 偏移按数组顺序累加;操作列钉右
const columns: DataTableColumn<Person>[] = [
  { id: 'name', header: '姓名', cell: person => person.name, isRowHeader: true, width: 140, pinned: 'start' },
  { id: 'role', header: '角色', cell: person => person.role, width: 130, pinned: 'start' },
  { id: 'born', header: '生年', cell: person => person.born, width: 110 },
  { id: 'era', header: '时期', cell: person => ERAS[person.born % ERAS.length], width: 110 },
  { id: 'active', header: '活跃年代', cell: person => `${person.born + 20}–${person.born + 60}`, width: 150 },
  { id: 'label', header: '唱片公司', cell: person => LABELS[person.works % LABELS.length], width: 150 },
  {
    id: 'actions',
    header: '操作',
    cell: () => <span className="cursor-pointer text-primary">查看</span>,
    width: 90,
    pinned: 'end',
  },
]

export default function PinnedDemo(): ReactElement {
  return (
    <DataTable<Person>
      aria-label="作曲家(固定列)"
      columns={columns}
      items={PEOPLE.slice(0, 6)}
    />
  )
}
