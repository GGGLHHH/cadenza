import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import {
  NumberField,
  NumberFieldGroup,
  NumberFieldInput,
} from '../src/components/number-field'

it('默认组合:不写 children 就有 减号/输入框/加号,步进走上游协议', () => {
  const onValueChange = vi.fn()
  render(<NumberField aria-label="数量" defaultValue={4} onValueChange={onValueChange} />)

  const input = screen.getByRole('textbox', { name: '数量' })
  expect(input).toHaveProperty('value', '4')

  const increment = screen.getByRole('button', { name: 'Increase' })
  fireEvent.pointerDown(increment)
  fireEvent.pointerUp(increment)

  expect(onValueChange).toHaveBeenCalled()
  const [value, details] = onValueChange.mock.calls[0] as [number, { reason: string }]
  expect(value).toBe(5)
  expect(details.reason).toBe('increment-press')
})

it('label 通道:根上的 id 落在真输入框上,htmlFor 直连', () => {
  render(
    <>
      <label htmlFor="qty">每箱数量</label>
      <NumberField id="qty" defaultValue={1} />
    </>,
  )

  const input = screen.getByLabelText('每箱数量')
  expect(input.tagName).toBe('INPUT')
})

it('组合让位:写了 children 就不再渲染默认步进钮', () => {
  render(
    <NumberField aria-label="数量" defaultValue={1}>
      <NumberFieldGroup>
        <NumberFieldInput aria-label="数量" />
      </NumberFieldGroup>
    </NumberField>,
  )

  expect(screen.queryByRole('button')).toBeNull()
})

it('表单序列化:有 name 才渲染隐藏 input', () => {
  const { container, rerender } = render(<NumberField aria-label="数量" defaultValue={3} name="qty" />)
  const hidden = container.querySelector('input[name="qty"]')
  expect(hidden).not.toBeNull()

  rerender(<NumberField aria-label="数量" defaultValue={3} />)
  expect(container.querySelector('input[name="qty"]')).toBeNull()
})
