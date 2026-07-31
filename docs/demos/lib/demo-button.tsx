import type { ComponentProps, ReactElement } from 'react'
import { Button } from '@gedatou/cadenza-ui'

/**
 * demo 专用触发按钮:Button 不在文档收录范围,demo 源码统一走这个壳,
 * 读者不会看到未收录的 API。底下仍是库的 RAC Button ——
 * InfiniteCombobox 的 trigger 需要真实的按压语义(onPress / 键盘)。
 */
export function DemoButton({
  variant = 'outline',
  ...props
}: ComponentProps<typeof Button>): ReactElement {
  return <Button variant={variant} {...props} />
}
