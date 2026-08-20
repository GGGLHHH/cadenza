import type { ReactElement } from 'react'
import { ColorPicker } from '@gedatou/cadenza-ui'
import { useState } from 'react'

// The controlled trio: value drives, onValueChange writes back. The
// callback's first argument is React Aria's Color object (get a string
// via toString('hex'/'hexa'/'css')); the second is eventDetails -- the
// kernel does not distinguish gesture sources, so every interactive
// change has reason: control-change
export default function ControlledDemo(): ReactElement {
  const [color, setColor] = useState('#f59e0b')
  return (
    <div className="flex flex-col items-start gap-3">
      <ColorPicker
        aria-label="Accent color"
        value={color}
        onValueChange={next => setColor(next.toString('hex'))}
      />
      <p className="font-mono text-sm text-muted-foreground">{color}</p>
    </div>
  )
}
