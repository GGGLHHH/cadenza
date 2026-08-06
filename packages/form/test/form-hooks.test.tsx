import { act, renderHook, waitFor } from '@testing-library/react'
import { expect, it } from 'vitest'
import { useForm, useFormReset, useFormSubmitting } from '../src'

it('useFormReset：defaultValues 引用变化时整表回填（覆盖脏值）', () => {
  const { result, rerender } = renderHook(
    ({ defaultValues }) => {
      const form = useForm({ defaultValues })
      useFormReset(form, defaultValues)
      return form
    },
    { initialProps: { defaultValues: { name: 'a' } } },
  )

  act(() => result.current.setFieldValue('name', 'dirty'))
  expect(result.current.state.values.name).toBe('dirty')

  rerender({ defaultValues: { name: 'b' } })
  expect(result.current.state.values.name).toBe('b')
})

it('useFormReset：同一引用重渲染不触发回填', () => {
  const defaultValues = { name: 'a' }
  const { result, rerender } = renderHook(() => {
    const form = useForm({ defaultValues })
    useFormReset(form, defaultValues)
    return form
  })

  act(() => result.current.setFieldValue('name', 'dirty'))
  rerender()
  expect(result.current.state.values.name).toBe('dirty')
})

it('useFormSubmitting：跟随 isSubmitting', async () => {
  let resolveSubmit: (() => void) | undefined
  const { result } = renderHook(() => {
    const form = useForm({
      defaultValues: { name: '' },
      onSubmit: () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve
        }),
    })
    return { form, submitting: useFormSubmitting(form) }
  })

  expect(result.current.submitting).toBe(false)

  act(() => {
    void result.current.form.handleSubmit()
  })
  expect(result.current.submitting).toBe(true)

  // handleSubmit 的校验链是异步的：等 onSubmit 真正被调用、resolveSubmit 被赋值
  await waitFor(() => expect(resolveSubmit).toBeDefined())

  await act(async () => {
    resolveSubmit?.()
  })
  expect(result.current.submitting).toBe(false)
})
