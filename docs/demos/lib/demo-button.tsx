import type { ComponentProps, ReactElement } from 'react'
import { Button } from '@gedatou/cadenza-ui'

/**
 * demo 专用触发按钮:Button 不在文档收录范围,demo 源码统一走这个壳,
 * 读者不会看到未收录的 API。底下仍是库的 Button —— InfiniteCombobox 的 trigger
 * 由 Base UI 的 Popover.Trigger 接管(任何元素都行),用真按钮最省事。
 */
export function DemoButton({
  variant = 'outline',
  ...props
}: ComponentProps<typeof Button>): ReactElement {
  return <Button variant={variant} {...props} />
}
