import type { ReactElement } from 'react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@gedatou/cadenza-ui'

// 最小骨架:Select 持状态,SelectTrigger 才是真正的控件(它就是那个 <button>),
// SelectValue 回显当前值,SelectContent 是 Portal + Positioner + Popup + List 一整套。
// items 只管触发器上怎么显示 —— 选项本身还是自己写
const VOICES = {
  soprano: '女高音',
  alto: '女中音',
  tenor: '男高音',
  bass: '男低音',
}

export default function BasicDemo(): ReactElement {
  return (
    <Select items={VOICES}>
      <SelectTrigger aria-label="声部" className="inline-56">
        <SelectValue placeholder="选一个声部" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {Object.entries(VOICES).map(([value, label]) => (
            <SelectItem key={value} value={value}>{label}</SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
