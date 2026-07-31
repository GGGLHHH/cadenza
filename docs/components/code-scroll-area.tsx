'use client'

import type { ReactElement, ReactNode } from 'react'
import { ScrollArea } from '@gedatou/cadenza-ui'

/**
 * ComponentSource(RSC)不能直接 import cadenza-ui —— dist 没有 'use client'
 * banner,会把整个客户端 bundle 拽进服务端图。这个文件就是客户端边界。
 * 视口挂 scroll-fade-inset:两轴渐隐;滚动条是视口的兄弟节点,不被 mask 压暗。
 */
export function CodeScrollArea({ children }: { children: ReactNode }): ReactElement {
  return (
    <ScrollArea
      orientation="both"
      viewportClassName="scroll-fade-inset max-block-96"
    >
      {children}
    </ScrollArea>
  )
}
