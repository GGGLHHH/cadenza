import type { InfiniteSelectAdapterProps } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import {
  InfiniteCombobox,
  InfiniteSelectEmpty,
  InfiniteSelectError,
  InfiniteSelectLoading,
  InfiniteSelectRetry,
  useInfiniteComboboxState,
} from '@gedatou/cadenza-ui'
import { DemoButton } from '../lib/demo-button'
import { getOption } from '../lib/people'

// 静态空适配器:列表为空(且不在加载/错误中)时 InfiniteSelectEmpty 自渲染
const emptyList: InfiniteSelectAdapterProps<Person> = {
  items: [],
  isLoading: false,
  isFetchingNextPage: false,
  hasNextPage: false,
  isError: false,
  onLoadMore: () => {},
  onRetry: () => {},
}

export default function EmptySlotDemo(): ReactElement {
  const state = useInfiniteComboboxState()

  return (
    <InfiniteCombobox<Person>
      getOption={getOption}
      list={emptyList}
      searchPlaceholder="搜索作曲家…"
      state={state}
      slots={(
        <>
          <InfiniteSelectLoading>加载中…</InfiniteSelectLoading>
          <InfiniteSelectEmpty>没有匹配的结果</InfiniteSelectEmpty>
          <InfiniteSelectError>
            加载失败
            <InfiniteSelectRetry>重试</InfiniteSelectRetry>
          </InfiniteSelectError>
        </>
      )}
    >
      <DemoButton>空数据源</DemoButton>
    </InfiniteCombobox>
  )
}
