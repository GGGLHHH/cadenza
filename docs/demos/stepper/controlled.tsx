import type { ReactElement } from 'react'
import { Stepper } from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { DemoButton } from '../lib/demo-button'

// 受控 + 异步前进(Origin UI stepper-05 的形态):「下一步」模拟 1s 请求,
// 期间当前步的指示器转 Spinner;点击任意 trigger 也能直接跳步
export default function ControlledDemo(): ReactElement {
  const [step, setStep] = useState(2)
  const [loading, setLoading] = useState(false)

  const handleNext = (): void => {
    setLoading(true)
    setTimeout(() => {
      setStep(current => current + 1)
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="flex flex-col items-center gap-6 inline-full max-inline-sm">
      <Stepper
        loading={loading}
        onValueChange={value => setStep(value)}
        steps={4}
        value={step}
      />
      <div className="flex gap-2">
        <DemoButton disabled={step === 1 || loading} onClick={() => setStep(current => current - 1)}>
          上一步
        </DemoButton>
        <DemoButton disabled={step > 4 || loading} onClick={handleNext}>
          下一步
        </DemoButton>
      </div>
    </div>
  )
}
