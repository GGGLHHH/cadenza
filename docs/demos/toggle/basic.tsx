import type { ReactElement } from 'react'
import { AnimateIcon, BoldIcon, ItalicIcon } from '@gedatou/cadenza-icons'
import { Toggle } from '@gedatou/cadenza-ui'

// A real <button aria-pressed>: the root element is the button itself and
// the name comes straight from children, so there is no FieldLabel htmlFor
// channel like Checkbox/Switch have.
// Only add aria-label when there is an icon but no visible text.
export default function BasicDemo(): ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <AnimateIcon animateOnHover asChild><Toggle aria-label="Bold" defaultPressed><BoldIcon /></Toggle></AnimateIcon>
      <AnimateIcon animateOnHover asChild><Toggle aria-label="Italic"><ItalicIcon /></Toggle></AnimateIcon>
      <AnimateIcon animateOnHover asChild>
        <Toggle variant="outline">
          <BoldIcon />
          Bold
        </Toggle>
      </AnimateIcon>
    </div>
  )
}
