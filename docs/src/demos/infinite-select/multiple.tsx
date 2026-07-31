import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import {
  Button,
  InfiniteCombobox,
  InfiniteSelectClearButton,
  InfiniteSelectConfirmButton,
  InfiniteSelectFooter,
  InfiniteSelectFooterSeparator,
  useInfiniteComboboxState,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'
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
      loadingMoreIndicator="加载更多…"
      multiple
      onChange={(_items, nextIds) => setIds(nextIds)}
      searchPlaceholder="搜索作曲家…"
      state={state}
      value={ids}
      slots={(
        <>
          {selectSlots}
          <InfiniteSelectFooter>
            <InfiniteSelectClearButton>清空</InfiniteSelectClearButton>
            <InfiniteSelectFooterSeparator />
            <InfiniteSelectConfirmButton>确定</InfiniteSelectConfirmButton>
          </InfiniteSelectFooter>
        </>
      )}
    >
      <Button variant="outline">
        {ids.length > 0 ? `已选 ${ids.length} 位` : '选择多位作曲家'}
      </Button>
    </InfiniteCombobox>
  )
}
