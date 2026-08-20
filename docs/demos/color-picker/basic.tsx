import type { ReactElement } from 'react'
import { ColorPicker } from '@gedatou/cadenza-ui'

// 零组合的完整体验:swatch 触发器和弹层(饱和度/明度面板、hue 与 alpha 滑杆、
// hex 输入)全是默认在场的,只需要给一个初始色和可及名
export default function BasicDemo(): ReactElement {
  return <ColorPicker aria-label="强调色" defaultValue="#6366f1" />
}
