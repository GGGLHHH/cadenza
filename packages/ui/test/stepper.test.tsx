import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperTrigger,
} from '../src/components/stepper'

describe('stepper', () => {
  it('default composition: `steps` renders the triggers, `defaultValue` places the states', () => {
    render(<Stepper defaultValue={2} steps={4} />)
    const triggers = screen.getAllByRole('button')
    expect(triggers).toHaveLength(4)
    expect(triggers[1].getAttribute('aria-current')).toBe('step')

    const itemOf = (trigger: Element): Element | null => trigger.closest('[data-slot="stepper-item"]')
    // Behind the active step: completed, in Base UI's empty-string value form.
    expect(itemOf(triggers[0])?.getAttribute('data-completed')).toBe('')
    expect(itemOf(triggers[1])?.hasAttribute('data-completed')).toBe(false)
    expect(itemOf(triggers[2])?.hasAttribute('data-completed')).toBe(false)
  })

  it('trigger press moves the step and reports (value, details) with trigger-press', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Stepper defaultValue={1} onValueChange={onValueChange} steps={3} />)

    await user.click(screen.getAllByRole('button')[2])
    expect(onValueChange).toHaveBeenCalledWith(3, expect.objectContaining({ reason: 'trigger-press' }))
    expect(screen.getAllByRole('button')[2].getAttribute('aria-current')).toBe('step')
  })

  it('cancel() on the details rejects the change — the active step stays put', async () => {
    const user = userEvent.setup()
    render(<Stepper defaultValue={1} onValueChange={(_value, details) => details.cancel()} steps={3} />)

    await user.click(screen.getAllByRole('button')[2])
    expect(screen.getAllByRole('button')[0].getAttribute('aria-current')).toBe('step')
  })

  it('controlled: a click without a parent update does not move the step', async () => {
    const user = userEvent.setup()
    render(<Stepper steps={3} value={2} />)

    await user.click(screen.getAllByRole('button')[2])
    expect(screen.getAllByRole('button')[1].getAttribute('aria-current')).toBe('step')
  })

  it('loading bites only on the active step, and its indicator shows the spinner', () => {
    const { container } = render(<Stepper defaultValue={2} loading steps={3} />)
    const items = container.querySelectorAll('[data-slot="stepper-item"]')
    expect(items[1].hasAttribute('data-loading')).toBe(true)
    expect(items[0].hasAttribute('data-loading')).toBe(false)
    expect(items[1].querySelector('[data-slot="spinner"]')).not.toBeNull()
    expect(items[0].querySelector('[data-slot="spinner"]')).toBeNull()
  })

  it('multi-step jumps cascade: each item schedules its delay by distance from the previous step', () => {
    const { container, rerender } = render(<Stepper steps={4} value={1} />)
    rerender(<Stepper steps={4} value={4} />)

    const items = [...container.querySelectorAll<HTMLElement>('[data-slot="stepper-item"]')]
    // Wave origin is step 1, the 450ms budget split over 2×3+1 beats (~64.3ms):
    // rings arrive two beats per step crossed, lines one beat behind their ring.
    expect(items.map(item => item.style.getPropertyValue('--stepper-ring-delay')))
      .toEqual(['0ms', '129ms', '257ms', '386ms'])
    expect(items.map(item => item.style.getPropertyValue('--stepper-line-delay')))
      .toEqual(['64ms', '193ms', '321ms', '450ms'])
  })

  it('composed items own the structure; indicator children replace the number slot', () => {
    render(
      <Stepper defaultValue={2}>
        <StepperItem step={1}>
          <StepperTrigger>
            <StepperIndicator>A</StepperIndicator>
          </StepperTrigger>
        </StepperItem>
        <StepperItem disabled step={2}>
          <StepperTrigger>
            <StepperIndicator>B</StepperIndicator>
          </StepperTrigger>
        </StepperItem>
      </Stepper>,
    )
    const triggers = screen.getAllByRole('button')
    expect(triggers[0].textContent).toBe('A')
    expect((triggers[1] as HTMLButtonElement).disabled).toBe(true)
  })
})
