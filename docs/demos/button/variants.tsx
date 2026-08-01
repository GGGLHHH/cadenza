import type { ReactElement } from 'react'
import { Button } from '@gedatou/cadenza-ui'

// 六个变体:default 是主操作,其余按语义递弱;destructive 只给不可逆操作
export default function VariantsDemo(): ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button>默认</Button>
      <Button variant="secondary">次要</Button>
      <Button variant="outline">描边</Button>
      <Button variant="ghost">幽灵</Button>
      <Button variant="destructive">危险</Button>
      <Button variant="link">链接样式</Button>
      <Button isDisabled>禁用</Button>
    </div>
  )
}
