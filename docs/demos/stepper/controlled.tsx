import type { ReactElement } from 'react'
import { Stepper } from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { DemoButton } from '../lib/demo-button'

// Controlled + async advance (the Origin UI stepper-05 shape): "Next"
// simulates a 1s request, during which the current step's indicator turns
// into a Spinner; clicking any trigger still jumps straight to that step
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
          Previous
        </DemoButton>
        <DemoButton disabled={step > 4 || loading} onClick={handleNext}>
          Next
        </DemoButton>
      </div>
    </div>
  )
}
