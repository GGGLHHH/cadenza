import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { FieldLabel, FieldLegend, FieldTitle } from '../src/components/field'

it('required 在三个标签形部件上都渲染 aria-hidden 的红星', () => {
  render(
    <>
      <FieldLabel htmlFor="a" required>姓名</FieldLabel>
      <FieldLegend required>声部</FieldLegend>
      <FieldTitle required>音量</FieldTitle>
    </>,
  )

  const marks = document.querySelectorAll('[aria-hidden]')
  expect(marks.length).toBe(3)
  marks.forEach(mark => expect(mark.textContent).toBe('*'))
  // 星号对可达名不可见
  expect(screen.getByText('姓名').textContent).toContain('姓名')
})

it('不传 required 不渲染星号', () => {
  render(<FieldLabel htmlFor="b">备注</FieldLabel>)
  expect(document.querySelector('[aria-hidden]')).toBeNull()
})
