import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import {
  DataTable,
  DataTableEmpty,
  DataTableError,
  DataTableLoading,
  DataTableRetry,
} from '@gedatou/cadenza-ui'
import { personColumns } from './columns'

// 插槽按状态自渲染、互斥:items 为空(且不在加载/错误中)时是 DataTableEmpty
export default function EmptySlotDemo(): ReactElement {
  return (
    <DataTable<Person> aria-label="作曲家(空)" columns={personColumns} items={[]}>
      <DataTableLoading>加载中…</DataTableLoading>
      <DataTableEmpty>暂无数据</DataTableEmpty>
      <DataTableError>
        加载失败
        <DataTableRetry>重试</DataTableRetry>
      </DataTableError>
    </DataTable>
  )
}
