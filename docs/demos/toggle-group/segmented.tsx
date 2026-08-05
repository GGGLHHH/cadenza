import type { ReactElement } from 'react'
import { ToggleGroup, ToggleGroupItem } from '@gedatou/cadenza-ui'

// spacing={0}:间距归零,同时给每一项打开「融成一条」的那组样式 ——
// 中间项去圆角、首尾各补外侧圆角,outline 变体相邻的边框合并成一条
export default function SegmentedDemo(): ReactElement {
  return (
    <ToggleGroup aria-label="时间范围" defaultValue={['week']} spacing={0} variant="outline">
      <ToggleGroupItem value="day">日</ToggleGroupItem>
      <ToggleGroupItem value="week">周</ToggleGroupItem>
      <ToggleGroupItem value="month">月</ToggleGroupItem>
    </ToggleGroup>
  )
}
