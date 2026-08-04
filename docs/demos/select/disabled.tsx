import type { ReactElement } from 'react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@gedatou/cadenza-ui'

// 两种粒度:isDisabled 落在 Select 上禁整个控件(弹层打不开),
// 落在 SelectItem 上只禁那一行(键盘导航会跳过它)
export default function DisabledDemo(): ReactElement {
  return (
    <div className="flex flex-col gap-4 inline-full max-inline-sm">
      <Select aria-label="整体禁用" defaultValue="viola" isDisabled>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem id="viola">中提琴</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select aria-label="单项禁用" placeholder="大提琴已被占用">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem id="violin">小提琴</SelectItem>
            <SelectItem id="viola">中提琴</SelectItem>
            <SelectItem id="cello" isDisabled>大提琴</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
