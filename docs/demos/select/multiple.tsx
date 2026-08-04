import type { Key } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'

// selectionMode="multiple" 之后 value / onChange 整体换型:Key[] 而不是 Key | null。
// 选中两项及以上时 SelectValue 显示的是 React Aria 按语言拼好的 selectedText
export default function MultipleDemo(): ReactElement {
  const [value, setValue] = useState<Key[]>(['violin'])

  return (
    <div className="flex flex-col gap-4 inline-full max-inline-sm">
      <Select
        aria-label="乐器"
        placeholder="可多选"
        selectionMode="multiple"
        value={value}
        onChange={setValue}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem id="violin">小提琴</SelectItem>
            <SelectItem id="viola">中提琴</SelectItem>
            <SelectItem id="cello">大提琴</SelectItem>
            <SelectItem id="bass">低音提琴</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-muted-foreground">value</dt>
        <dd className="font-mono">{value.length === 0 ? '—' : value.join(', ')}</dd>
      </dl>
    </div>
  )
}
