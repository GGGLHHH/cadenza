import type { ReactElement } from 'react'
import { Field, FieldDescription, FieldTitle, Slider } from '@gedatou/cadenza-ui'

// Orientation: orientation="vertical" flips data-orientation to vertical
// all the way down, and the track switches axis into an upright bar.
// The wrapper deliberately sets no height -- the control's built-in
// min-block-40 catches the floor, so it never collapses to 0.
export default function VerticalDemo(): ReactElement {
  return (
    <Field className="max-inline-sm">
      <FieldTitle id="slider-vertical-gain">Gain</FieldTitle>
      <Slider aria-labelledby="slider-vertical-gain" defaultValue={60} orientation="vertical" />
      <FieldDescription>↑ / ↓ ±1; PageUp / PageDown ±10.</FieldDescription>
    </Field>
  )
}
