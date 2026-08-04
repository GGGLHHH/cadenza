import type { ReactElement } from 'react'
import { Button, Spinner } from '@gedatou/cadenza-ui'
import { useState } from 'react'

// 想自己画进行中的样子:别传 pending,传 disabled —— 暗纱和 Spinner 一概不注入,
// children 完全归你。这里是经典的「spinner 排旁边 + 换文案」形态;代价是内容
// 变化会改变宽度(默认组合的宽度恒定,靠的正是覆盖而不替换)
export default function PendingCustomDemo(): ReactElement {
  const [isPending, setIsPending] = useState(false)
  return (
    <Button
      disabled={isPending}
      onClick={() => {
        setIsPending(true)
        setTimeout(setIsPending, 2500, false)
      }}
    >
      {isPending && <Spinner aria-hidden className="block-[1em] inline-[1em]" />}
      {isPending ? '保存中…' : '保存'}
    </Button>
  )
}
