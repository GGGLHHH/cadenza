import type { ReactElement } from 'react'
import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from '@gedatou/cadenza-ui'

const steps = [
  { step: 1, title: 'Account', description: 'Fill in basic details' },
  { step: 2, title: 'Configuration', description: 'Pick a plan and region' },
  { step: 3, title: 'Confirm', description: 'Review and submit' },
]

// Hand-written composition: title and description go inside the trigger so
// the whole text block is clickable for jumping; the connector is only
// written on non-last items. The Indicator's number / ✓ / Spinner are the
// part's built-in default visuals -- nothing to write yourself
export default function CompositionDemo(): ReactElement {
  return (
    <Stepper defaultValue={2}>
      {steps.map(({ description, step, title }) => (
        <StepperItem className="not-last:flex-1" key={step} step={step}>
          <StepperTrigger>
            <StepperIndicator />
            <div className="text-start">
              <StepperTitle>{title}</StepperTitle>
              <StepperDescription>{description}</StepperDescription>
            </div>
          </StepperTrigger>
          {step < steps.length && <StepperSeparator className="mx-4" />}
        </StepperItem>
      ))}
    </Stepper>
  )
}
