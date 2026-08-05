import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
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
