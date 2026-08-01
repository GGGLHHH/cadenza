import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import {
  DataTable,
  DataTableEmpty,
  DataTableError,
  DataTableRetry,
} from '@gedatou/cadenza-ui'
import { useFakeInfiniteList } from '../lib/use-fake-infinite-list'
import { personColumns } from './columns'

// 首次加载必定失败;DataTableRetry 自动接上基座的 onRetry,点重试恢复
export default function ErrorSlotDemo(): ReactElement {
  const list = useFakeInfiniteList(undefined, { failFirst: true })

  return (
    <DataTable<Person>
      aria-label="作曲家(首次加载失败)"
      columns={personColumns}
      maxHeight={320}
      {...list}
    >
      <DataTableEmpty>暂无数据</DataTableEmpty>
      <DataTableError>
        加载失败
        <DataTableRetry>重试</DataTableRetry>
      </DataTableError>
    </DataTable>
  )
}
