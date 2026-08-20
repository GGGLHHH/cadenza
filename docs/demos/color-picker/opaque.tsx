import type { ReactElement } from 'react'
import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerInput,
  ColorPickerPopup,
  ColorPickerSlider,
  ColorPickerSwatch,
  ColorPickerTrigger,
} from '@gedatou/cadenza-ui'

// Composition is configuration: write the popup content yourself and
// leave out the channel="alpha" slider, and it becomes a picker that
// only emits opaque colors; the trigger can also carry your own text
// beside the swatch
export default function OpaqueDemo(): ReactElement {
  return (
    <ColorPicker defaultValue="#0ea5e9">
      <ColorPickerTrigger aria-label="Background color">
        <ColorPickerSwatch />
        <span className="pe-1 text-sm">Background color</span>
      </ColorPickerTrigger>
      <ColorPickerPopup>
        <ColorPickerArea />
        <ColorPickerSlider channel="hue" />
        <ColorPickerInput />
      </ColorPickerPopup>
    </ColorPicker>
  )
}
