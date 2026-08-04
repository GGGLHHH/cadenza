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

// SelectLabel 是分组的标题(RAC Header),不是控件的标签 —— 控件的标签在 Field 那边。
// SelectSeparator 走 RAC Separator,分组之间、组内条目之间都能放
export default function GroupDemo(): ReactElement {
  return (
    <Select aria-label="乐器" className="inline-56" placeholder="选一件乐器">
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>弦乐</SelectLabel>
          <SelectItem id="violin">小提琴</SelectItem>
          <SelectItem id="viola">中提琴</SelectItem>
          <SelectItem id="cello">大提琴</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>木管</SelectLabel>
          <SelectItem id="flute">长笛</SelectItem>
          <SelectItem id="oboe">双簧管</SelectItem>
          <SelectItem id="clarinet">单簧管</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
