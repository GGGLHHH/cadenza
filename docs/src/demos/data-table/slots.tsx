import type { ReactNode } from 'react'
import {
  DataTableEmpty,
  DataTableError,
  DataTableLoading,
  DataTableRetry,
} from '@gedatou/cadenza-ui'

// 状态插槽:文案(含 i18n)在业务层注入,基座零文案。
export const tableSlots: ReactNode = (
  <>
    <DataTableLoading>加载中…</DataTableLoading>
    <DataTableEmpty>暂无数据</DataTableEmpty>
    <DataTableError>
      加载失败
      <DataTableRetry>重试</DataTableRetry>
    </DataTableError>
  </>
)
