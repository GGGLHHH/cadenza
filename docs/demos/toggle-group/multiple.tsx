import type { ReactElement } from 'react'
import { AnimateIcon, BoldIcon, ItalicIcon, UnderlineIcon } from '@gedatou/cadenza-icons'
import { ToggleGroup, ToggleGroupItem } from '@gedatou/cadenza-ui'
import { useState } from 'react'

// multiple: several items can be pressed at once. value has exactly the
// same shape as in single mode -- always an array; multiple only decides
// how many items it can hold at a time. Controlled here, echoing the array
export default function MultipleDemo(): ReactElement {
  const [marks, setMarks] = useState<string[]>(['bold'])

  return (
    <div className="flex flex-col gap-4">
      <ToggleGroup
        aria-label="Text formatting"
        multiple
        onValueChange={setMarks}
        value={marks}
        variant="outline"
      >
        <AnimateIcon animateOnHover asChild><ToggleGroupItem aria-label="Bold" value="bold"><BoldIcon /></ToggleGroupItem></AnimateIcon>
        <AnimateIcon animateOnHover asChild><ToggleGroupItem aria-label="Italic" value="italic"><ItalicIcon /></ToggleGroupItem></AnimateIcon>
        <AnimateIcon animateOnHover asChild><ToggleGroupItem aria-label="Underline" value="underline"><UnderlineIcon /></ToggleGroupItem></AnimateIcon>
      </ToggleGroup>
      <p className="text-sm text-muted-foreground">
        {`value: [${marks.join(', ')}]`}
      </p>
    </div>
  )
}
