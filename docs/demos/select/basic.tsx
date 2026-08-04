import type { ReactElement } from 'react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@gedatou/cadenza-ui'

// 最小骨架:Select 持状态,SelectTrigger 才是真正的控件,SelectValue 回显当前值,
// SelectContent 是 SelectPopover + SelectList 的捷径。
// 未选中时上屏的是 Select 的 placeholder —— 不是 SelectValue 的 children
export default function BasicDemo(): ReactElement {
  return (
    <Select aria-label="声部" className="inline-56" placeholder="选一个声部">
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem id="soprano">女高音</SelectItem>
          <SelectItem id="alto">女中音</SelectItem>
          <SelectItem id="tenor">男高音</SelectItem>
          <SelectItem id="bass">男低音</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
