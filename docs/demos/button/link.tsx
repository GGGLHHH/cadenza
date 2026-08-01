import type { ReactElement } from 'react'
import { LinkButton } from '@gedatou/cadenza-ui'

// 链接穿上按钮的衣服:有 href、可禁用。禁用时 React Aria 渲染 <span>,
// 变灰靠 data-disabled(:disabled 在链接上永远不会命中)
export default function LinkDemo(): ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <LinkButton href="https://react-spectrum.adobe.com/react-aria/" target="_blank">
        React Aria 文档
      </LinkButton>
      <LinkButton href="https://react-spectrum.adobe.com/react-aria/" target="_blank" variant="outline">
        描边
      </LinkButton>
      <LinkButton href="https://react-spectrum.adobe.com/react-aria/" isDisabled>
        禁用的链接
      </LinkButton>
    </div>
  )
}
