import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, expect, it, vi } from 'vitest'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '../src/components/input-otp'

beforeAll(() => {
  // `input-otp` measures the invisible input to line the caret up with the
  // boxes; jsdom has no ResizeObserver. A no-op is enough — nothing here
  // depends on the measurement.
  vi.stubGlobal('ResizeObserver', class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  })
  // Its hover tracking hit-tests on a timer, after the test has finished —
  // absent in jsdom, and an unhandled rejection if left to fire.
  document.elementFromPoint = (): null => null
})

it('adds to the separator class instead of replacing it', () => {
  // The vendored separator writes its className before the prop spread, so a
  // caller-passed one replaced the layout outright — the icon lost its box.
  render(<InputOTPSeparator className="mx-2" />)
  const separator = screen.getByRole('separator')
  expect(separator.getAttribute('class')).toContain('mx-2')
  expect(separator.getAttribute('class')).toContain('items-center')
})

it('fills slots by index across groups and reports the whole string', async () => {
  const user = userEvent.setup()
  const onChange = vi.fn()
  const onComplete = vi.fn()
  render(
    <InputOTP aria-label="验证码" maxLength={4} onChange={onChange} onComplete={onComplete}>
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={2} />
        <InputOTPSlot index={3} />
      </InputOTPGroup>
    </InputOTP>,
  )

  await user.type(screen.getByRole('textbox', { name: '验证码' }), '2468')

  // Not the house protocol: onChange takes the string itself, no event and no
  // eventDetails anywhere in this family.
  expect(onChange).toHaveBeenLastCalledWith('2468')
  expect(onComplete).toHaveBeenCalledWith('2468')
  const slots = document.querySelectorAll('[data-slot="input-otp-slot"]')
  expect([...slots].map(slot => slot.textContent)).toEqual(['2', '4', '6', '8'])
})
