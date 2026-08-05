import type { ReactElement } from 'react'
import { ToggleGroup, ToggleGroupItem } from '@gedatou/cadenza-ui'
import { IconBold, IconItalic, IconUnderline } from '@tabler/icons-react'
import { useState } from 'react'

// multiple:同时可以按下多项。value 的形状和单选时完全一样 —— 永远是数组,
// multiple 只决定里面同时能有几项。这里受控,把数组原样显示出来
export default function MultipleDemo(): ReactElement {
  const [marks, setMarks] = useState<string[]>(['bold'])

  return (
    <div className="flex flex-col gap-4">
      <ToggleGroup
        aria-label="文字样式"
        multiple
        onValueChange={setMarks}
        value={marks}
        variant="outline"
      >
        <ToggleGroupItem aria-label="加粗" value="bold"><IconBold /></ToggleGroupItem>
        <ToggleGroupItem aria-label="斜体" value="italic"><IconItalic /></ToggleGroupItem>
        <ToggleGroupItem aria-label="下划线" value="underline"><IconUnderline /></ToggleGroupItem>
      </ToggleGroup>
      <p className="text-sm text-muted-foreground">
        {`value: [${marks.join(', ')}]`}
      </p>
    </div>
  )
}
