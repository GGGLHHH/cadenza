import type { ReactElement } from 'react'
import { Button } from '@gedatou/cadenza-ui'

// children 的函数形态:参数就是状态表右列那套 render props,
// 内容随交互状态走,不用自己监听任何事件
export default function RenderPropsDemo(): ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="outline">
        {({ isPressed, isHovered }) =>
          isPressed ? '按住了!' : isHovered ? '就是现在' : '悬停看看'}
      </Button>
      <Button variant="outline">
        {({ isFocusVisible }) => (isFocusVisible ? 'Tab 到我了' : '用 Tab 过来')}
      </Button>
    </div>
  )
}
