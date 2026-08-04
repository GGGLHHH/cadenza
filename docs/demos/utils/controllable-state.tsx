import type { ReactElement } from 'react'
import { useControllableState } from '@gedatou/cadenza-utils'
import { useState } from 'react'
import { DemoButton } from '../lib/demo-button'

// 同一个组件:传了 value 就受控,只传 defaultValue 就非受控。
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
        <span className="text-sm text-muted-foreground inline-44">非受控(defaultValue=1),状态在组件内部:</span>
        <Stepper defaultValue={1} />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground inline-44">
          受控(value=
          {volume}
          ),状态在父级:
        </span>
        <Stepper onChange={setVolume} value={volume} />
        <DemoButton onClick={() => setVolume(0)} size="sm" variant="outline">
          外部归零
        </DemoButton>
      </div>
    </div>
  )
}
