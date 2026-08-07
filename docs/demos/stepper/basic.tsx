import type { ReactElement } from 'react'
import { Stepper } from '@gedatou/cadenza-ui'

// 默认组合:不写 children,steps 直接渲染「数字指示器 + 连线」的完整分步条
// defaultValue 指定初始步;走过的步自动打 ✓,当前步高亮,trigger 可点击跳步
export default function BasicDemo(): ReactElement {
  return <Stepper className="max-inline-sm" defaultValue={2} steps={4} />
}
