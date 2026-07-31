import type { ReactElement } from 'react'
import { DataPagination } from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { PEOPLE } from '../lib/people'

// 受控:page / limit 提到组件外,数据切片跟着状态走 ——
// 与 DataTable 组合时就是这个形状(见 DataTable 的「分页」一节)
export default function ControlledDemo(): ReactElement {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(5)
  const pageItems = PEOPLE.slice((page - 1) * limit, page * limit)

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-1 text-sm">
        {pageItems.map(person => (
          <li className="flex justify-between gap-4" key={person.id}>
            <span>{person.name}</span>
            <span className="text-muted-foreground">{person.role}</span>
          </li>
        ))}
      </ul>
      <DataPagination
        limit={limit}
        limitOptions={[5, 10, 20]}
        page={page}
        rowsPerPageLabel="每页"
        summary={({ total }) => `共 ${total} 条`}
        total={PEOPLE.length}
        onLimitChange={(next) => {
          setLimit(next)
          setPage(1)
        }}
        onPageChange={setPage}
      />
    </div>
  )
}
