import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { formSubmitHandler } from '../src'

it('preventDefault 生效且调用 handleSubmit', () => {
  const handleSubmit = vi.fn()
  render(
    <form data-testid="form" onSubmit={formSubmitHandler(handleSubmit)}>
      <button type="submit">提交</button>
    </form>,
  )

  // fireEvent 返回 false 即 preventDefault 被调用
  expect(fireEvent.submit(screen.getByTestId('form'))).toBe(false)
  expect(handleSubmit).toHaveBeenCalledOnce()
})

it('提交 settle 后聚焦首个非禁用 invalid 控件', async () => {
  render(
    <form data-testid="form" onSubmit={formSubmitHandler(() => {})}>
      <input aria-invalid="true" disabled data-testid="disabled-bad" />
      <input aria-invalid="true" data-testid="bad" />
    </form>,
  )

  fireEvent.submit(screen.getByTestId('form'))
  await waitFor(() => {
    expect(document.activeElement).toBe(screen.getByTestId('bad'))
  })
})

it('focusFirstError: false 时不聚焦', async () => {
  const handleSubmit = vi.fn()
  render(
    <form data-testid="form" onSubmit={formSubmitHandler(handleSubmit, { focusFirstError: false })}>
      <input aria-invalid="true" data-testid="bad" />
    </form>,
  )

  fireEvent.submit(screen.getByTestId('form'))
  await waitFor(() => expect(handleSubmit).toHaveBeenCalledOnce())
  // 给 rAF 一个机会跑完，确认没有聚焦发生
  await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)))
  expect(document.activeElement).not.toBe(screen.getByTestId('bad'))
})
