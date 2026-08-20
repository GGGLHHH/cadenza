import type { ReactElement } from 'react'
import { ColorPicker } from '@gedatou/cadenza-ui'
import { useState } from 'react'

// 受控三件套:value 驱动、onValueChange 回写。回调的第一参是 React Aria 的
// Color 对象(toString('hex'/'hexa'/'css') 取字符串);第二参是 eventDetails,
// 内核不区分手势来源,交互变更的 reason 一律是 control-change
export default function ControlledDemo(): ReactElement {
  const [color, setColor] = useState('#f59e0b')
  return (
    <div className="flex flex-col items-start gap-3">
      <ColorPicker
        aria-label="强调色"
        value={color}
        onValueChange={next => setColor(next.toString('hex'))}
      />
      <p className="font-mono text-sm text-muted-foreground">{color}</p>
    </div>
  )
}
