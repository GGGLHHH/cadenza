import type { ReactElement } from 'react'
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
} from '@gedatou/cadenza-ui'

// 整份列表就在 items 里,过滤发生在浏览器:Base UI 随输入收窄这一份数组。
// ComboboxList 的 children 是 render 函数,收到的正是收窄之后的那一份。
const COMPOSERS = [
  '巴赫',
  '莫扎特',
  '贝多芬',
  '舒伯特',
  '勃拉姆斯',
  '德彪西',
  '拉威尔',
  '马勒',
]

export default function BasicDemo(): ReactElement {
  return (
    <Combobox<string> items={COMPOSERS}>
      <ComboboxInput aria-label="作曲家" className="max-inline-sm" placeholder="搜索作曲家" />
      <ComboboxPopup>
        <ComboboxEmpty>没有匹配的作曲家</ComboboxEmpty>
        <ComboboxList>
          {(composer: string) => (
            <ComboboxItem key={composer} value={composer}>{composer}</ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxPopup>
    </Combobox>
  )
}
