import type { ReactElement } from 'react'
import { SearchField } from '@gedatou/cadenza-ui'
import { useState } from 'react'

// 基础用法:输入即时更新 value,停顿 300ms 后 queryValue 才落定 ——
// 下面两行把这个时间差直接显示出来
export default function BasicDemo(): ReactElement {
  const [text, setText] = useState('')
  const [query, setQuery] = useState<string | undefined>(undefined)

  return (
    <div className="flex flex-col gap-4 inline-full max-inline-sm">
      <SearchField
        aria-label="搜索作曲家"
        placeholder="搜索作曲家..."
        onChange={setText}
        onQueryValueChange={setQuery}
      />
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-muted-foreground">输入</dt>
        <dd className="font-mono">{text === '' ? '—' : text}</dd>
        <dt className="text-muted-foreground">去抖后</dt>
        <dd className="font-mono">{query ?? '—'}</dd>
      </dl>
    </div>
  )
}
