import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { Field, FieldLabel } from '../src/components/field'
import { Switch } from '../src/components/switch'

it('takes both its click target and its accessible name from one FieldLabel htmlFor', async () => {
  const user = userEvent.setup()
  render(
    <Field orientation="horizontal">
      <Switch id="notify" />
      <FieldLabel htmlFor="notify">邮件通知</FieldLabel>
    </Field>,
  )

  const track = screen.getByRole('switch', { name: '邮件通知' })
  expect(track.getAttribute('data-slot')).toBe('switch')

  await user.click(screen.getByText('邮件通知'))
  expect(track.getAttribute('aria-checked')).toBe('true')
})

it('mirrors the shadcn size onto data-size for the thumb to read', () => {
  render(<Switch aria-label="紧凑" size="sm" />)
  expect(screen.getByRole('switch', { name: '紧凑' }).getAttribute('data-size')).toBe('sm')
})

it('pending keeps the switch focusable but inert, a spinner turning inside the thumb', async () => {
  const onCheckedChange = vi.fn()
  const { container } = render(<Switch aria-label="同步" pending onCheckedChange={onCheckedChange} />)
  const track = screen.getByRole('switch', { name: '同步' })
  // Says so, and the caller cannot half-set the pair.
  expect(track.getAttribute('aria-busy')).toBe('true')
  expect(track.hasAttribute('data-pending')).toBe(true)
  // The Button rule via the form-control channel: focus stays, toggling stops.
  track.focus()
  expect(document.activeElement).toBe(track)
  const user = userEvent.setup({ pointerEventsCheck: 0 })
  await user.click(track)
  expect(onCheckedChange).not.toHaveBeenCalled()
  // The spinner lives inside the thumb — the antd treatment.
  const thumb = container.querySelector('[data-slot="switch-thumb"]')
  expect(thumb?.querySelector('[data-slot="spinner"]')).not.toBeNull()
})

it('without pending the thumb is empty — no spinner', () => {
  const { container } = render(<Switch aria-label="同步" />)
  expect(container.querySelector('[data-slot="spinner"]')).toBeNull()
})
