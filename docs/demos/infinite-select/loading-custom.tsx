import type { InfiniteSelectAdapterProps } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import {
  InfiniteCombobox,
  InfiniteSelectLoadingOverlay,
  Spinner,
  useInfiniteComboboxState,
} from '@gedatou/cadenza-ui'
import { DemoButton } from '../lib/demo-button'
import { getOption, PEOPLE } from '../lib/people'

// Slotted 定制:标记部件放在 slots 通道里、原地不渲染,由 List 提升到列表壳。
// 适配器停在"结果还在 + isLoading"的刷新态,打开就能看到定制磨砂
const refreshingList: InfiniteSelectAdapterProps<Person> = {
  items: PEOPLE.slice(0, 4),
  isLoading: true,
  isFetchingNextPage: false,
  hasNextPage: false,
  isError: false,
  onLoadMore: () => {},
  onRetry: () => {},
}

export default function LoadingCustomDemo(): ReactElement {
  const state = useInfiniteComboboxState()

  return (
    <InfiniteCombobox<Person>
      getOption={getOption}
      list={refreshingList}
      searchPlaceholder="搜索作曲家…"
      state={state}
    >
      <DemoButton>打开看定制磨砂</DemoButton>
      <InfiniteSelectLoadingOverlay className="backdrop-blur-xs">
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner aria-hidden />
          正在同步演出数据…
        </span>
      </InfiniteSelectLoadingOverlay>
    </InfiniteCombobox>
  )
}
