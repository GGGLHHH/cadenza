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
  useInfiniteSelectActions,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { getOption } from '../lib/people'
import { useFakeInfiniteList } from '../lib/use-fake-infinite-list'
import { selectSlots } from './slots'

// 自定义 footer 部件:经 useInfiniteSelectActions 拿到当前选择,不需要外部穿线
function FooterSelectedCount(): ReactElement {
  const { selectedIds } = useInfiniteSelectActions()
  return (
    <span className="px-3 text-xs whitespace-nowrap text-muted-foreground">
      已选
      {' '}
      {selectedIds.length}
    </span>
  )
}

export default function FooterDemo(): ReactElement {
  const state = useInfiniteComboboxState()
  const list = useFakeInfiniteList(state.queryValue)
  const [ids, setIds] = useState<string[]>([])

  return (
    <InfiniteCombobox<Person>
      commitOnClose
      getOption={getOption}
      list={list}
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
            <FooterSelectedCount />
            <InfiniteSelectFooterSeparator />
            <InfiniteSelectConfirmButton>确定</InfiniteSelectConfirmButton>
          </InfiniteSelectFooter>
        </>
      )}
    >
      <Button variant="outline">
        {ids.length > 0 ? `已选 ${ids.length} 位` : 'footer 三件套 + 自定义部件'}
      </Button>
    </InfiniteCombobox>
  )
}
