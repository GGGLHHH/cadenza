import type { ReactElement } from 'react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@gedatou/cadenza-ui'

// 两种粒度:disabled 落在 Select 上禁整个控件(弹层打不开),
// 落在 SelectItem 上只禁那一行(键盘导航会跳过它)
export default function DisabledDemo(): ReactElement {
  return (
    <div className="flex flex-col gap-4 inline-full max-inline-sm">
      <Select defaultValue="viola" disabled items={{ viola: '中提琴' }}>
        <SelectTrigger aria-label="整体禁用">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="viola">中提琴</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select items={{ violin: '小提琴', viola: '中提琴', cello: '大提琴' }}>
        <SelectTrigger aria-label="单项禁用">
          <SelectValue placeholder="大提琴已被占用" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="violin">小提琴</SelectItem>
            <SelectItem value="viola">中提琴</SelectItem>
            <SelectItem disabled value="cello">大提琴</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
