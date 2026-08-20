import type { ReactElement } from 'react'
import { useControllableState } from '@gedatou/cadenza-utils'
import { useState } from 'react'
import { DemoButton } from '../lib/demo-button'

// One component: pass value and it is controlled; pass only defaultValue
// and it is uncontrolled.
interface StepperProps {
  value?: number
  defaultValue?: number
  onChange?: (value: number) => void
}

function Stepper({ value, defaultValue, onChange }: StepperProps): ReactElement {
  const [count, setCount] = useControllableState({ value, defaultValue, onChange, fallback: 0 })

  return (
    <div className="flex items-center gap-2">
      <DemoButton onClick={() => setCount(current => current - 1)} size="sm" variant="outline">
        −
      </DemoButton>
      <span className="text-center text-sm tabular-nums inline-8">{count}</span>
      <DemoButton onClick={() => setCount(current => current + 1)} size="sm" variant="outline">
        +
      </DemoButton>
    </div>
  )
}

export default function ControllableDemo(): ReactElement {
  const [volume, setVolume] = useState(5)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground inline-44">Uncontrolled (defaultValue=1), state lives inside the component:</span>
        <Stepper defaultValue={1} />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground inline-44">
          Controlled (value=
          {volume}
          ), state lives in the parent:
        </span>
        <Stepper onChange={setVolume} value={volume} />
        <DemoButton onClick={() => setVolume(0)} size="sm" variant="outline">
          Reset to 0 from outside
        </DemoButton>
      </div>
    </div>
  )
}
