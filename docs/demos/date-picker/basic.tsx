import type { ReactElement } from 'react'
import { DatePicker } from '@gedatou/cadenza-ui'

// 一行式:不给 children 就渲染完整默认组合 —— 可编辑输入框、清除 ✕、
// 日历按钮、弹层日历全部就位。点输入框或日历按钮打开,直接键入
// 「2026-08-16」也立即生效。
export default function BasicDemo(): ReactElement {
  return <DatePicker aria-label="日期" placeholder="选择日期" />
}
