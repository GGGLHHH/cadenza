import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import {
  InfiniteCombobox,
  InfiniteSelectClearButton,
  InfiniteSelectConfirmButton,
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

// commitOnClose:弹层内的勾选只是草稿,关闭弹层才提交一次 onChange
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
      onChange={(_items, nextIds) => setIds(nextIds)}
      searchPlaceholder="搜索作曲家…"
      state={state}
      value={ids}
    >
      <DemoButton>
        {ids.length > 0 ? `已选 ${ids.length} 位` : '选择多位作曲家'}
      </DemoButton>
      {selectSlots}
      <InfiniteSelectFooter>
        <InfiniteSelectClearButton>清空</InfiniteSelectClearButton>
        <InfiniteSelectFooterSeparator />
        <InfiniteSelectConfirmButton>确定</InfiniteSelectConfirmButton>
      </InfiniteSelectFooter>
      <InfiniteSelectLoadingMore>加载更多…</InfiniteSelectLoadingMore>
    </InfiniteCombobox>
  )
}
