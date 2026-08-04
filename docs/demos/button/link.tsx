import type { ReactElement } from 'react'
import { LinkButton } from '@gedatou/cadenza-ui'

// 链接穿上按钮的衣服:有 href、可禁用。禁用时 href 被整个摘掉,
// 变灰靠 data-disabled(:disabled 在链接上永远不会命中)
export default function LinkDemo(): ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <LinkButton href="https://base-ui.com/react/overview/quick-start" target="_blank">
        Base UI 文档
      </LinkButton>
      <LinkButton href="https://base-ui.com/react/overview/quick-start" target="_blank" variant="outline">
        描边
      </LinkButton>
      <LinkButton href="https://base-ui.com/react/overview/quick-start" disabled>
        禁用的链接
      </LinkButton>
    </div>
  )
}
