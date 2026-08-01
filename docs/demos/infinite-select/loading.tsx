import type { InfiniteSelectAdapterProps } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import {
  InfiniteCombobox,
  InfiniteSelectEmpty,
  InfiniteSelectError,
  InfiniteSelectRetry,
  useInfiniteComboboxState,
} from '@gedatou/cadenza-ui'
import { DemoButton } from '../lib/demo-button'
import { getOption } from '../lib/people'

// 静态加载中适配器:首屏加载期间列表区渲染最低高度的磨砂壳 —— 统一的加载视觉,
// 文案插槽只剩空态和错误态
const loadingList: InfiniteSelectAdapterProps<Person> = {
  items: [],
  isLoading: true,
  isFetchingNextPage: false,
  hasNextPage: false,
  isError: false,
  onLoadMore: () => {},
  onRetry: () => {},
}

export default function LoadingDemo(): ReactElement {
  const state = useInfiniteComboboxState()

  return (
    <InfiniteCombobox<Person>
      getOption={getOption}
      list={loadingList}
      searchPlaceholder="搜索作曲家…"
      state={state}
      slots={(
        <>
          <InfiniteSelectEmpty>没有匹配的结果</InfiniteSelectEmpty>
          <InfiniteSelectError>
            加载失败
            <InfiniteSelectRetry>重试</InfiniteSelectRetry>
          </InfiniteSelectError>
        </>
      )}
    >
      <DemoButton>永远在加载</DemoButton>
    </InfiniteCombobox>
  )
}
