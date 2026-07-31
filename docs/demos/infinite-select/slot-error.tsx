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
import { useFakeInfiniteList } from '../lib/use-fake-infinite-list'

// 首次加载必定失败;InfiniteSelectRetry 自动接上基座的 onRetry,点重试恢复
export default function ErrorSlotDemo(): ReactElement {
  const state = useInfiniteComboboxState()
  const list = useFakeInfiniteList(state.queryValue, { failFirst: true })

  return (
    <InfiniteCombobox<Person>
      getOption={getOption}
      list={list}
      loadingMoreIndicator="加载更多…"
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
      <DemoButton>首次加载会失败</DemoButton>
    </InfiniteCombobox>
  )
}
