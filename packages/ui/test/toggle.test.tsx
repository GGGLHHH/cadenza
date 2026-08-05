import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { Toggle } from '../src/components/toggle'

it('is a real pressed button and reports changes with details', async () => {
  const user = userEvent.setup()
  const onPressedChange = vi.fn()
  render(<Toggle aria-label="加粗" onPressedChange={onPressedChange}>B</Toggle>)

  const toggle = screen.getByRole('button', { name: '加粗' })
  expect(toggle.getAttribute('aria-pressed')).toBe('false')

  await user.click(toggle)

  expect(onPressedChange).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'none' }))
  expect(toggle.getAttribute('aria-pressed')).toBe('true')
  expect(toggle.getAttribute('data-pressed')).toBe('')
})

it('carries the cva variant classes', () => {
  render(<Toggle aria-label="轮廓" size="sm" variant="outline">B</Toggle>)
  const className = screen.getByRole('button', { name: '轮廓' }).getAttribute('class') ?? ''
  expect(className).toContain('border')
  expect(className).toContain('h-7')
})
