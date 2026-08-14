import type { ReactElement } from 'react'
import { Select } from '@gedatou/cadenza-ui'
import { useState } from 'react'

// pending = 改选后的保存 round-trip:触发器保持可聚焦但弹层不再打开
// (底下走 readOnly),Spinner 站进 chevron 的位置,清除 ✕ 让位;
// 服务端确认(模拟 900ms)后才落新值。
const VOICES = {
  soprano: '女高音',
  alto: '女中音',
  tenor: '男高音',
  bass: '男低音',
}

export default function PendingDemo(): ReactElement {
  const [value, setValue] = useState<string | null>('soprano')
  const [pending, setPending] = useState(false)
  return (
    <Select
      aria-label="声部"
      placeholder="进行中"
      items={VOICES}
      pending={pending}
      value={value}
      onValueChange={(next) => {
        setPending(true)
        setTimeout(() => {
          setValue(next)
          setPending(false)
        }, 900)
      }}
    />
  )
}
