import type { CheckboxChangeEventDetails } from '../src/components/checkbox'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { expect, it, vi } from 'vitest'
import { Checkbox } from '../src/components/checkbox'
import { Field, FieldLabel } from '../src/components/field'

it('takes both its click target and its accessible name from one FieldLabel htmlFor', async () => {
  const user = userEvent.setup()
  render(
    <Field orientation="horizontal">
      <Checkbox id="terms" />
      <FieldLabel htmlFor="terms">同意条款</FieldLabel>
    </Field>,
  )

  // `id` lands on the hidden input, not on the visible box — the box keeps a
  // generated one. That is what lets a single `htmlFor` do both jobs: the
  // native label forwards the click to the input, and Base UI reads
  // `input.labels` back out to name the box via aria-labelledby.
  const box = screen.getByRole('checkbox', { name: '同意条款' })
  expect(box.getAttribute('data-slot')).toBe('checkbox')
  expect(box.getAttribute('id')).not.toBe('terms')

  await user.click(screen.getByText('同意条款'))
  expect(box.getAttribute('aria-checked')).toBe('true')
})

it('hands onCheckedChange a details object whose cancel() blocks the change', async () => {
  const user = userEvent.setup()
  const onCheckedChange = vi.fn<(checked: boolean, details: CheckboxChangeEventDetails) => void>(
    (_checked, details) => {
      details.cancel()
    },
  )
  render(<Checkbox aria-label="订阅" onCheckedChange={onCheckedChange} />)

  const box = screen.getByRole('checkbox', { name: '订阅' })
  await user.click(box)

  expect(onCheckedChange).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'none' }))
  // cancel() is a real protocol here: the internal state never advanced.
  expect(box.getAttribute('aria-checked')).toBe('false')
})

it('renders the mixed state independently of checked, with a dash of its own', () => {
  render(<Checkbox aria-label="全选" defaultChecked indeterminate />)
  const box = screen.getByRole('checkbox', { name: '全选' })
  expect(box.getAttribute('aria-checked')).toBe('mixed')
  expect(box.getAttribute('data-indeterminate')).toBe('')
  // base-nova paints `data-checked` only, so a mixed box would come out
  // unfilled with the tick still showing. The seam supplies the mixed look.
  const className = box.getAttribute('class') ?? ''
  expect(className).toContain('data-indeterminate:bg-primary')
  expect(className).toContain('data-indeterminate:[&_svg]:hidden')
  // The dark pair is load-bearing, not decoration: the box's own
  // `dark:bg-input/30` matches at the same specificity and later in the sheet,
  // so without this the fill silently loses in dark mode.
  expect(className).toContain('dark:data-indeterminate:bg-primary')
})

it('forwards its ref past the seam wrapper', () => {
  const box = createRef<HTMLSpanElement>()
  render(<Checkbox aria-label="转发" ref={box} />)
  expect(box.current?.getAttribute('role')).toBe('checkbox')
})

it('keeps the function className contract while adding its own classes', () => {
  render(
    <Checkbox
      aria-label="函数类名"
      className={state => (state.indeterminate ? 'mixed-hook' : 'plain-hook')}
      indeterminate
    />,
  )
  const className = screen.getByRole('checkbox', { name: '函数类名' }).getAttribute('class') ?? ''
  // The seam's own classes survive, and the caller's function still sees state.
  expect(className).toContain('data-indeterminate:bg-primary')
  expect(className).toContain('mixed-hook')
})
