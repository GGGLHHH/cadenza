import type { ReactElement } from 'react'
import { Button, Spinner } from '@gedatou/cadenza-ui'
import { useState } from 'react'

// 函数 children = 全权接管:不注入暗纱、不注入 Spinner,isPending 从
// render props 取。这里是经典的「spinner 排旁边 + 换文案」形态 ——
// 代价是内容变化会改变宽度(默认组合的宽度恒定靠覆盖不替换)
export default function PendingCustomDemo(): ReactElement {
  const [isPending, setIsPending] = useState(false)
  return (
    <Button
      isPending={isPending}
      onPress={() => {
        setIsPending(true)
        setTimeout(setIsPending, 2500, false)
      }}
    >
      {renderProps => (
        <>
          {renderProps.isPending && (
            <Spinner
              aria-hidden
              className="block-[1em] inline-[1em]"
            />
          )}
          {renderProps.isPending ? '保存中…' : '保存'}
        </>
      )}
    </Button>
  )
}
