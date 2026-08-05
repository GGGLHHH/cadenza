import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import { DataPagination, DataTable } from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { usePersonPage } from '../lib/use-person-page'
import { personColumns } from './columns'
import { tableSlots } from './slots'

// 跨页存档:选择集在翻页状态之外。ids 是权威全集;items 里跨页的对象来自组件缓存。
export default function ArchiveDemo(): ReactElement {
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedItems, setSelectedItems] = useState<Person[]>([])
  const { items, total, ...listState } = usePersonPage(page, 5)

  return (
    <div className="flex flex-col gap-3">
      <DataTable<Person>
        aria-label="作曲家(跨页存档)"
        columns={personColumns}
        items={items}
        selectionColumn
        selectionMode="multiple"
        value={selectedIds}
        onValueChange={(nextItems, nextIds) => {
          setSelectedIds(nextIds)
          setSelectedItems(nextItems)
        }}
        {...listState}
      >
        {tableSlots}
      </DataTable>
      <DataPagination
        limit={5}
        page={page}
        limitOptions={[]}
        summary={({ total: totalCount }) => `共 ${totalCount} 条`}
        total={total}
        onPageChange={setPage}
      />
      <p className="text-sm text-muted-foreground">
        已选
        {' '}
        {selectedIds.length}
        {' '}
        条
        {selectedItems.length > 0 && `:${selectedItems.map(person => person.name).join('、')}`}
      </p>
    </div>
  )
}
