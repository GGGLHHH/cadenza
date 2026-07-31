import type { DataTableColumn } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import { DataTable } from '@gedatou/cadenza-ui'
import { PEOPLE } from '../lib/people'

const ERAS = ['巴洛克', '古典', '浪漫', '现代']
const LABELS = ['DG', 'Decca', 'EMI', 'Sony Classical', 'Philips']

// 7 列都给了数字宽度,合计 990px,超出容器即横向滚动
const columns: DataTableColumn<Person>[] = [
  { id: 'name', header: '姓名', cell: person => person.name, isRowHeader: true, width: 140 },
  { id: 'role', header: '角色', cell: person => person.role, width: 130 },
  { id: 'born', header: '生年', cell: person => person.born, width: 110 },
  { id: 'era', header: '时期', cell: person => ERAS[person.born % ERAS.length], width: 110 },
  { id: 'active', header: '活跃年代', cell: person => `${person.born + 20}–${person.born + 60}`, width: 150 },
  { id: 'label', header: '唱片公司', cell: person => LABELS[person.works % LABELS.length], width: 150 },
  { id: 'works', header: '作品数', cell: person => person.works, width: 110 },
]

export default function HScrollDemo(): ReactElement {
  return (
    <DataTable<Person>
      aria-label="作曲家(横向滚动)"
      columns={columns}
      items={PEOPLE.slice(0, 6)}
    />
  )
}
