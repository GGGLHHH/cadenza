import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { Field, FieldLabel } from '../src/components/field'
import { Input } from '../src/components/input'
import { Textarea } from '../src/components/textarea'

it('keeps the Base UI props the vendored type had flattened away', async () => {
  const user = userEvent.setup()
  const onValueChange = vi.fn()
  render(
    <Field>
      <FieldLabel htmlFor="title">曲目</FieldLabel>
      <Input className={state => (state.disabled ? 'off' : 'on')} id="title" onValueChange={onValueChange} />
    </Field>,
  )

  const input = screen.getByRole('textbox', { name: '曲目' })
  // The function className resolves against Base UI's state — the vendored
  // `ComponentProps<'input'>` type had hidden both this and onValueChange.
  expect(input.getAttribute('class')).toContain('on')

  await user.type(input, '水')
  expect(onValueChange).toHaveBeenLastCalledWith('水', expect.objectContaining({ reason: 'none' }))
})

it('gives Textarea the ordinary label channel and a plain string className', async () => {
  const user = userEvent.setup()
  render(
    <Field>
      <FieldLabel htmlFor="notes">备注</FieldLabel>
      <Textarea className="min-block-24" id="notes" />
    </Field>,
  )

  const textarea = screen.getByRole('textbox', { name: '备注' })
  expect(textarea.tagName).toBe('TEXTAREA')
  expect(textarea.getAttribute('class')).toContain('min-block-24')

  await user.type(textarea, '排练')
  expect((textarea as HTMLTextAreaElement).value).toBe('排练')
})
