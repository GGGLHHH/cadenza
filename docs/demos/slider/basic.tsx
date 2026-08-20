import type { ReactElement } from 'react'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldTitle,
  Slider,
} from '@gedatou/cadenza-ui'

// One value, one thumb: defaultValue is a number, so exactly one thumb
// renders. The root is a <div role="group">, not a labelable element --
// give the visible label an id via FieldTitle (a div) and point
// aria-labelledby at it; Base UI passes that down to the
// <input type="range"> inside each thumb, so the thumb itself gets a
// name too. With no visible text at all, write aria-label directly.
export default function BasicDemo(): ReactElement {
  return (
    <FieldGroup className="max-inline-sm">
      <Field>
        <FieldTitle id="slider-basic-volume">Master volume</FieldTitle>
        <Slider aria-labelledby="slider-basic-volume" defaultValue={40} name="volume" />
        <FieldDescription>Arrow keys ±1; Shift + arrows / PageUp / PageDown ±10.</FieldDescription>
      </Field>
      <Field>
        <Slider aria-label="Reverb" defaultValue={25} />
      </Field>
    </FieldGroup>
  )
}
