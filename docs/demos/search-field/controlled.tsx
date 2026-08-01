import type { ReactElement } from 'react'
import { SearchField } from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { DemoButton } from '../lib/demo-button'

// 受控:文本放在外部 state,组件只负责渲染 ——
// 外面的按钮直接改 state 就能填进输入框
export default function ControlledDemo(): ReactElement {
  const [value, setValue] = useState('')

  return (
    <div className="flex flex-col gap-4 inline-full max-inline-sm">
      <SearchField
        aria-label="搜索作曲家"
        placeholder="搜索作曲家..."
        value={value}
        onChange={setValue}
      />
      <div className="flex flex-wrap items-center gap-2">
        <DemoButton onPress={() => setValue('Debussy')}>填入 Debussy</DemoButton>
        <DemoButton onPress={() => setValue('')}>清空</DemoButton>
        <span className="text-sm text-muted-foreground">
          value:
          {value === '' ? ' —' : ` ${value}`}
        </span>
      </div>
    </div>
  )
}
