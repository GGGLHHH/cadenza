import type { ReactElement } from 'react'
import {
  Combobox,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
} from '@gedatou/cadenza-ui'

// 分组数据唯一必需的键是 items —— Base UI 只按它认出「这是分组」;组名叫什么随你,
// 惯例用 value。过滤按组进行:命中的项留在原组里,一项都没命中的组整组消失。
interface Section {
  value: string
  items: string[]
}

const SECTIONS: Section[] = [
  { value: '弦乐', items: ['小提琴', '中提琴', '大提琴', '低音提琴'] },
  { value: '木管', items: ['长笛', '双簧管', '单簧管', '巴松'] },
  { value: '铜管', items: ['圆号', '小号', '长号', '大号'] },
]

// 两层 render 函数:ComboboxList 拿到的是「组」,ComboboxGroup items 把这一组交给
// 里面的 ComboboxCollection,它再拿到组内的每一项。
export default function GroupsDemo(): ReactElement {
  return (
    <Combobox<string> items={SECTIONS}>
      <ComboboxInput aria-label="乐器" className="max-inline-sm" placeholder="搜索乐器" />
      <ComboboxPopup>
        <ComboboxEmpty>没有匹配的乐器</ComboboxEmpty>
        <ComboboxList>
          {(section: Section) => (
            <ComboboxGroup items={section.items} key={section.value}>
              <ComboboxGroupLabel>{section.value}</ComboboxGroupLabel>
              <ComboboxCollection>
                {(instrument: string) => (
                  <ComboboxItem key={instrument} value={instrument}>{instrument}</ComboboxItem>
                )}
              </ComboboxCollection>
            </ComboboxGroup>
          )}
        </ComboboxList>
      </ComboboxPopup>
    </Combobox>
  )
}
