import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import {
  InfiniteCombobox,
  InfiniteSelectClear,
  InfiniteSelectClose,
  InfiniteSelectFooter,
  InfiniteSelectFooterSeparator,
  InfiniteSelectLoadingMore,
  useInfiniteComboboxState,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { DemoButton } from '../lib/demo-button'
import { getOption } from '../lib/people'
import { useFakeInfiniteList } from '../lib/use-fake-infinite-list'
import { selectSlots } from './slots'

// commitOnClose:弹层内的勾选只是草稿,关闭弹层才提交一次 onValueChange
export default function MultiDemo(): ReactElement {
  const state = useInfiniteComboboxState()
  const list = useFakeInfiniteList(state.queryValue)
  const [ids, setIds] = useState<string[]>([])

  return (
    <InfiniteCombobox<Person>
      commitOnClose
      getOption={getOption}
      list={list}
      selectionMode="multiple"
      onValueChange={(_items, nextIds) => setIds(nextIds)}
      searchPlaceholder="搜索作曲家…"
      state={state}
      value={ids}
    >
      <DemoButton>
        {ids.length > 0 ? `已选 ${ids.length} 位` : '选择多位作曲家'}
      </DemoButton>
      {selectSlots}
      <InfiniteSelectFooter>
        <InfiniteSelectClear>清空</InfiniteSelectClear>
        <InfiniteSelectFooterSeparator />
        <InfiniteSelectClose>确定</InfiniteSelectClose>
      </InfiniteSelectFooter>
      <InfiniteSelectLoadingMore>加载更多…</InfiniteSelectLoadingMore>
    </InfiniteCombobox>
  )
}
