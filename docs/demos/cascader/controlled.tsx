import type { CascaderNode } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import { Cascader } from '@gedatou/cadenza-ui'
import { useState } from 'react'

// 受控三件套:value / defaultValue / onValueChange。值是从根到叶的一条路径
// (string[]),受控空值是 null。回调第二参是 eventDetails,cancel() 可拒绝
// 这次变更(清除也走同一条回调,reason: 'clear-press')。
const INSTRUMENTS: CascaderNode[] = [
  {
    value: 'strings',
    label: '弦乐',
    items: [
      { value: 'violin', label: '小提琴' },
      { value: 'cello', label: '大提琴' },
    ],
  },
  {
    value: 'woodwinds',
    label: '木管',
    items: [
      { value: 'flute', label: '长笛' },
      { value: 'oboe', label: '双簧管' },
    ],
  },
]

export default function ControlledDemo(): ReactElement {
  const [value, setValue] = useState<string[] | null>(['strings', 'cello'])
  return (
    <div className="flex flex-col items-start gap-2">
      <Cascader
        aria-label="乐器"
        items={INSTRUMENTS}
        placeholder="选择乐器"
        value={value}
        onValueChange={setValue}
      />
      <p className="text-sm text-muted-foreground">
        value:
        {' '}
        {value === null ? 'null' : JSON.stringify(value)}
      </p>
    </div>
  )
}
