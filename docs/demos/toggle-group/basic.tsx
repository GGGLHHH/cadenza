import type { ReactElement } from 'react'
import { ToggleGroup, ToggleGroupItem } from '@gedatou/cadenza-ui'
import { IconAlignCenter, IconAlignLeft, IconAlignRight } from '@tabler/icons-react'

// 默认 multiple={false}:同时只有一项按下。value 仍然是数组,
// 再点一次已按下的那项会把它松开,数组变空
export default function BasicDemo(): ReactElement {
  return (
    <ToggleGroup aria-label="对齐方式" defaultValue={['start']}>
      <ToggleGroupItem aria-label="左对齐" value="start"><IconAlignLeft /></ToggleGroupItem>
      <ToggleGroupItem aria-label="居中" value="center"><IconAlignCenter /></ToggleGroupItem>
      <ToggleGroupItem aria-label="右对齐" value="end"><IconAlignRight /></ToggleGroupItem>
    </ToggleGroup>
  )
}
