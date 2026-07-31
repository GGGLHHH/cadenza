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

// 首屏加载(isLoading)期间行让位给 DataTableLoading
export default function LoadingSlotDemo(): ReactElement {
  return (
    <DataTable<Person> aria-label="作曲家(加载中)" columns={personColumns} isLoading items={[]}>
      <DataTableLoading>加载中…</DataTableLoading>
      <DataTableEmpty>暂无数据</DataTableEmpty>
      <DataTableError>
        加载失败
        <DataTableRetry>重试</DataTableRetry>
      </DataTableError>
    </DataTable>
  )
}
