import type { ReactElement } from 'react'
import { ColorPicker } from '@gedatou/cadenza-ui'

// The full experience with zero composition: the swatch trigger and the
// popup (saturation/brightness area, hue and alpha sliders, hex input)
// are all present by default; it only needs an initial color and an
// accessible name
export default function BasicDemo(): ReactElement {
  return <ColorPicker aria-label="Accent color" defaultValue="#6366f1" />
}
