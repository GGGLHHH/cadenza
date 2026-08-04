import type { ReactElement } from 'react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@gedatou/cadenza-ui'

// SelectLabel 是分组的标题,不是控件的标签 —— 控件的标签在 Field 那边。
// SelectSeparator 分组之间、组内条目之间都能放
const INSTRUMENTS = {
  violin: '小提琴',
  viola: '中提琴',
  cello: '大提琴',
  flute: '长笛',
  oboe: '双簧管',
  clarinet: '单簧管',
}

export default function GroupDemo(): ReactElement {
  return (
    <Select items={INSTRUMENTS}>
      <SelectTrigger aria-label="乐器" className="inline-56">
        <SelectValue placeholder="选一件乐器" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>弦乐</SelectLabel>
          <SelectItem value="violin">小提琴</SelectItem>
          <SelectItem value="viola">中提琴</SelectItem>
          <SelectItem value="cello">大提琴</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>木管</SelectLabel>
          <SelectItem value="flute">长笛</SelectItem>
          <SelectItem value="oboe">双簧管</SelectItem>
          <SelectItem value="clarinet">单簧管</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
