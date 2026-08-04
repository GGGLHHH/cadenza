import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import {
  Field,
  FieldDescription,
  FieldLabel,
  InfiniteCombobox,
  InfiniteSelectLoadingMore,
  useInfiniteComboboxState,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { selectSlots } from '../infinite-select/slots'
import { DemoButton } from '../lib/demo-button'
import { getOption } from '../lib/people'
import { useFakeInfiniteList } from '../lib/use-fake-infinite-list'

// triggerId 是这里唯一的接线:FieldLabel htmlFor 指过去,点文字就聚焦并展开。
// 注意没有 aria-label —— 和 Select 不同,触发器上没有 aria-labelledby,
// 原生 <label for> 直接就是它的无障碍名。
export default function FieldInfiniteComboboxDemo(): ReactElement {
  const state = useInfiniteComboboxState()
  const list = useFakeInfiniteList(state.queryValue)
  const [picked, setPicked] = useState<Person | null>(null)

  return (
    <Field className="max-inline-sm">
      <FieldLabel htmlFor="field-composer">作曲家</FieldLabel>
      <InfiniteCombobox<Person>
        getOption={getOption}
        list={list}
        onChange={setPicked}
        searchPlaceholder="搜索作曲家…"
        state={state}
        triggerId="field-composer"
      >
        <DemoButton>{picked ? picked.name : '选择作曲家'}</DemoButton>
        {selectSlots}
        <InfiniteSelectLoadingMore>加载更多…</InfiniteSelectLoadingMore>
      </InfiniteCombobox>
      <FieldDescription>从一万条里搜，滚动到底自动加载下一页。</FieldDescription>
    </Field>
  )
}
