import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import {
  InfiniteCombobox,
  InfiniteSelectCancel,
  InfiniteSelectClear,
  InfiniteSelectClose,
  InfiniteSelectFooter,
  InfiniteSelectFooterSeparator,
  useInfiniteComboboxState,
  useInfiniteSelectActions,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { DemoButton } from '../lib/demo-button'
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
      selectionMode="multiple"
      onValueChange={(_items, nextIds) => setIds(nextIds)}
      searchPlaceholder="搜索作曲家…"
      state={state}
      value={ids}
    >
      <DemoButton>
        {ids.length > 0 ? `已选 ${ids.length} 位` : 'footer 一族 + 自定义部件'}
      </DemoButton>
      {selectSlots}
      {/* 三个动作放一起是为了对照(真实场景挑一个):清空提交空集,
          取消丢弃草稿还原成打开前,确定提交草稿。勾几个再点取消,
          重新打开会看到勾选原样退回去 */}
      <InfiniteSelectFooter>
        <FooterSelectedCount />
        <InfiniteSelectFooterSeparator />
        <InfiniteSelectClear>清空</InfiniteSelectClear>
        <InfiniteSelectCancel>取消</InfiniteSelectCancel>
        <InfiniteSelectClose>确定</InfiniteSelectClose>
      </InfiniteSelectFooter>
    </InfiniteCombobox>
  )
}
