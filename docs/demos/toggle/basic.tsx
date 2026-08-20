import type { ReactElement } from 'react'
import { Toggle } from '@gedatou/cadenza-ui'
import { IconBold, IconItalic } from '@tabler/icons-react'

// A real <button aria-pressed>: the root element is the button itself and
// the name comes straight from children, so there is no FieldLabel htmlFor
// channel like Checkbox/Switch have.
// Only add aria-label when there is an icon but no visible text.
export default function BasicDemo(): ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Toggle aria-label="Bold" defaultPressed><IconBold /></Toggle>
      <Toggle aria-label="Italic"><IconItalic /></Toggle>
      <Toggle variant="outline">
        <IconBold />
        Bold
      </Toggle>
    </div>
  )
}
