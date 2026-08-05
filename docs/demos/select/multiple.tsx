import type { ReactElement } from 'react'
import {
  Select,
  SelectGroup,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'

const INSTRUMENTS = {
  violin: '小提琴',
  viola: '中提琴',
  cello: '大提琴',
  bass: '低音提琴',
}

// multiple 之后 value / onValueChange 整体换型:string[] 而不是 string | null。
// 触发器上多选的显示由 SelectValue 拼:默认逗号分隔,想换写法就传函数 children
export default function MultipleDemo(): ReactElement {
  const [value, setValue] = useState<string[]>(['violin'])

  return (
    <div className="flex flex-col gap-4 inline-full max-inline-sm">
      <Select items={INSTRUMENTS} multiple value={value} onValueChange={setValue}>
        <SelectTrigger aria-label="乐器">
          <SelectValue placeholder="可多选" />
        </SelectTrigger>
        <SelectPopup>
          <SelectGroup>
            {Object.entries(INSTRUMENTS).map(([id, label]) => (
              <SelectItem key={id} value={id}>{label}</SelectItem>
            ))}
          </SelectGroup>
        </SelectPopup>
      </Select>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-muted-foreground">value</dt>
        <dd className="font-mono">{value.length === 0 ? '—' : value.join(', ')}</dd>
      </dl>
    </div>
  )
}
