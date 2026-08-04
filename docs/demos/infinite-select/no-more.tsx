import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import {
  InfiniteCombobox,
  InfiniteSelectEmpty,
  InfiniteSelectLoadingMore,
  InfiniteSelectNoMore,
  useInfiniteComboboxState,
} from '@gedatou/cadenza-ui'
import { DemoButton } from '../lib/demo-button'
import { getOption } from '../lib/people'
import { useFakeInfiniteList } from '../lib/use-fake-infinite-list'

// 数据源截断到 48 条、每页 16 条 = 整三页。滚到底会依次看到:
// 第 1 页 → 加载中 → 第 2 页 → 加载中 → 第 3 页 → 终止行。
//
// 每页要比视口高出一截才看得到这个过程:预取默认提前 1 个视口触发
// (loadMoreScrollOffset),页太矮的话下一页会在你还没滚动时就连锁加载完。
const PAGE_SIZE = 16
const TOTAL = PAGE_SIZE * 3

function ThreePages({ label, children }: { label: string, children?: ReactElement }): ReactElement {
  const state = useInfiniteComboboxState()
  const list = useFakeInfiniteList(state.queryValue, { pageSize: PAGE_SIZE, limit: TOTAL })

  return (
    <InfiniteCombobox<Person>
      getOption={getOption}
      list={list}
      searchPlaceholder="搜索作曲家…"
      state={state}
    >
      <DemoButton>{label}</DemoButton>
      <InfiniteSelectEmpty>没有匹配的结果</InfiniteSelectEmpty>
      {children}
      <InfiniteSelectLoadingMore>加载中…</InfiniteSelectLoadingMore>
    </InfiniteCombobox>
  )
}

export default function NoMoreDemo(): ReactElement {
  return (
    <div className="flex flex-wrap items-start justify-center gap-4">
      {/* 不组合 InfiniteSelectNoMore:翻完三页后仍有终止行,渲染默认那条淡出细线 */}
      <ThreePages label="默认:一条记号" />
      {/* 组合它 = 用自己的文案替换那条线,基座依然零文案 */}
      <ThreePages label="定制:自己的文案">
        <InfiniteSelectNoMore>没有更多数据</InfiniteSelectNoMore>
      </ThreePages>
    </div>
  )
}
