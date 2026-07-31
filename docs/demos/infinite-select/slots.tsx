import type { ReactNode } from 'react'
import {
  InfiniteSelectEmpty,
  InfiniteSelectError,
  InfiniteSelectLoading,
  InfiniteSelectRetry,
} from '@gedatou/cadenza-ui'

// 状态插槽:文案(含 i18n)在业务层注入,基座零文案。
export const selectSlots: ReactNode = (
  <>
    <InfiniteSelectLoading>加载中…</InfiniteSelectLoading>
    <InfiniteSelectEmpty>没有匹配的结果</InfiniteSelectEmpty>
    <InfiniteSelectError>
      加载失败
      <InfiniteSelectRetry>重试</InfiniteSelectRetry>
    </InfiniteSelectError>
  </>
)
