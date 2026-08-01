import type { ReactElement } from 'react'
import { Button } from '@gedatou/cadenza-ui'
import { IconPlus } from '@tabler/icons-react'

// 四档高度 + 对应的方形图标档;纯图标按钮必给 aria-label
export default function SizesDemo(): ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="xs" variant="outline">超小</Button>
      <Button size="sm" variant="outline">小</Button>
      <Button variant="outline">默认</Button>
      <Button size="lg" variant="outline">大</Button>
      <Button aria-label="新增" size="icon-xs" variant="outline"><IconPlus /></Button>
      <Button aria-label="新增" size="icon-sm" variant="outline"><IconPlus /></Button>
      <Button aria-label="新增" size="icon" variant="outline"><IconPlus /></Button>
      <Button aria-label="新增" size="icon-lg" variant="outline"><IconPlus /></Button>
    </div>
  )
}
