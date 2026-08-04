import type { DataTableColumn } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import { Button, DataTable } from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { PEOPLE } from '../lib/people'

const columns: DataTableColumn<Person>[] = [
  { id: 'name', header: '姓名', cell: person => person.name, isRowHeader: true },
  { id: 'role', header: '角色', cell: person => person.role },
]

// 有行时刷新:isLoading 且行还在屏上(placeholderData 语义) —— 旧行原地磨砂,
// 表头一起被盖住,插槽不出现
export default function RefreshDemo(): ReactElement {
  const [isLoading, setIsLoading] = useState(false)
  return (
    <div className="flex flex-col items-start gap-3 inline-full">
      <DataTable<Person>
        aria-label="作曲家"
        columns={columns}
        isLoading={isLoading}
        items={PEOPLE.slice(0, 4)}
      />
      <Button
        size="sm"
        variant="outline"
        pending={isLoading}
        onClick={() => {
          setIsLoading(true)
          setTimeout(setIsLoading, 2000, false)
        }}
      >
        刷新
      </Button>
    </div>
  )
}
