import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import {
  InfiniteCombobox,
  InfiniteSelectLoadingMore,
  useInfiniteComboboxState,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { DemoButton } from '../lib/demo-button'
import { getOption } from '../lib/people'
import { useFakeInfiniteList } from '../lib/use-fake-infinite-list'
import { selectSlots } from './slots'

// renderItem 替换整行内容:默认的对勾也没了,选中态用 selected 自绘
export default function RenderItemDemo(): ReactElement {
  const state = useInfiniteComboboxState()
  const list = useFakeInfiniteList(state.queryValue)
  const [picked, setPicked] = useState<Person | null>(null)

  return (
    <InfiniteCombobox<Person>
      getOption={getOption}
      list={list}
      onChange={setPicked}
      searchPlaceholder="搜索作曲家…"
      state={state}
      renderItem={({ item, index, selected }) => (
        <>
          <span className="
            text-end text-xs text-muted-foreground tabular-nums inline-8
          "
          >
            {index + 1}
            .
          </span>
          <span className="flex-1 truncate">{item.name}</span>
          <span className="text-xs text-muted-foreground">{item.role}</span>
          {selected && <span className="text-xs text-primary">✓</span>}
        </>
      )}
    >
      <DemoButton>{picked ? picked.name : '自定义行内容'}</DemoButton>
      {selectSlots}
      <InfiniteSelectLoadingMore>加载更多…</InfiniteSelectLoadingMore>
    </InfiniteCombobox>
  )
}
