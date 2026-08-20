import type { ReactElement } from 'react'
import { Field, FieldDescription, FieldTitle, Slider } from '@gedatou/cadenza-ui'

// The one family htmlFor cannot reach: Slider's root is a role="group" div,
// and the native <label for> only honours labelable elements, so pointing at
// it does nothing; the inputs inside the thumbs carry generated ids you
// cannot guess.
// So use FieldTitle (a div, made for groupings with no single control to
// point at) + aria-labelledby — Base UI forwards it all the way down to each
// thumb's input.
export default function SliderDemo(): ReactElement {
  return (
    <Field className="inline-full max-inline-sm">
      <FieldTitle id="field-slider-volume">Master volume</FieldTitle>
      <Slider aria-labelledby="field-slider-volume" defaultValue={60} name="volume" />
      <FieldDescription>Fall back to aria-label only without visible text — it names the group alone and does not reach the thumbs.</FieldDescription>
    </Field>
  )
}
