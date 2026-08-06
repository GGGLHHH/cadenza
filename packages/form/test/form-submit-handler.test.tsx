import type { ReactElement } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { fieldErrors, formProps, formSubmitHandler, useForm } from '../src'

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

// 回归:字段已 touched、已有错误、但未 blur 时,提交不产生任何字段级 store 写入,
// 字段组件不重渲染,门禁的 submissionAttempts 半边形同虚设 —— 传 form api 的形态
// 在提交后把有错误的字段标记为已 blur,用字段本地状态驱动展示
function TouchedProbe(): ReactElement {
  const form = useForm({
    defaultValues: { name: '' },
    validators: {
      onChange: ({ value }) =>
        value.name.length < 2 ? { fields: { name: { message: '太短' } } } : undefined,
    },
    onSubmit: () => {},
  })

  return (
    <form data-testid="form" onSubmit={formSubmitHandler(form)}>
      <form.Field name="name">
        {field => (
          <>
            <input
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={event => field.handleChange(event.target.value)}
            />
            <span data-testid="errors">
              {fieldErrors(field).map(error => error.message).join(',')}
            </span>
          </>
        )}
      </form.Field>
    </form>
  )
}

it('form api 形态:已 touched 未 blur 的错误字段,提交后也显示错误', async () => {
  render(<TouchedProbe />)
  const input = screen.getByRole('textbox')

  fireEvent.change(input, { target: { value: 'a' } })
  expect(screen.getByTestId('errors').textContent).toBe('')

  fireEvent.submit(screen.getByTestId('form'))
  await waitFor(() => {
    expect(screen.getByTestId('errors').textContent).toBe('太短')
  })
})

// 回归:handleSubmit 在字段级校验后见 isFieldsValid=false 即返回(form-core 行为),
// 表单级校验被跳过 —— 新添加、从未被校验过的数组子字段 meta 里没有错误,
// 揭示步骤会跳过它。form api 形态在失败提交后补跑一次表单级校验再揭示
function ArrayProbe(): ReactElement {
  const form = useForm({
    defaultValues: { items: [''] },
    validators: {
      onChange: ({ value }) => {
        const fields: Record<string, { message: string }> = {}
        value.items.forEach((item, index) => {
          if (item === '')
            fields[`items[${index}]`] = { message: '必填' }
        })
        return Object.keys(fields).length > 0 ? { fields } : undefined
      },
    },
    onSubmit: () => {},
  })

  return (
    <form data-testid="form" onSubmit={formSubmitHandler(form)}>
      <form.Field name="items" mode="array">
        {field => (
          <>
            {field.state.value.map((_, index) => (
              // 数组字段按位置寻址,index 就是身份
              // eslint-disable-next-line react/no-array-index-key
              <form.Field key={index} name={`items[${index}]`}>
                {subField => (
                  <span data-testid={`error-${index}`}>
                    {fieldErrors(subField).map(error => error.message).join(',')}
                  </span>
                )}
              </form.Field>
            ))}
            <button
              type="button"
              onClick={() => void field.pushValue('', { dontValidate: true })}
            >
              添加
            </button>
          </>
        )}
      </form.Field>
    </form>
  )
}

it('form api 形态:提交过的表单,新增子字段登记后立即补校验并显示错误', async () => {
  render(<ArrayProbe />)

  fireEvent.submit(screen.getByTestId('form'))
  await waitFor(() => {
    expect(screen.getByTestId('error-0').textContent).toBe('必填')
  })

  // 提交过 = 实时纠错模式:新成员登记的那一刻就该显示错误,
  // 不该等下一次无关输入或再次提交来"唤醒"校验
  fireEvent.click(screen.getByRole('button', { name: '添加' }))
  await waitFor(() => {
    expect(screen.getByTestId('error-1').textContent).toBe('必填')
  })
})

// formProps:noValidate + 提交管线一次展开 —— 原生约束校验会在 submit 事件
// 之前拦截提交,统一关掉;schema 是唯一校验真源
function FormPropsProbe(): ReactElement {
  const form = useForm({
    defaultValues: { name: '' },
    validators: {
      onChange: ({ value }) =>
        value.name === '' ? { fields: { name: { message: '必填' } } } : undefined,
    },
    onSubmit: () => {},
  })

  return (
    <form data-testid="form" {...formProps(form)}>
      <form.Field name="name">
        {field => (
          <span data-testid="errors">
            {fieldErrors(field).map(error => error.message).join(',')}
          </span>
        )}
      </form.Field>
    </form>
  )
}

it('formProps:展开 noValidate 并接通提交管线', async () => {
  render(<FormPropsProbe />)
  const form = screen.getByTestId('form')

  expect(form.hasAttribute('novalidate')).toBe(true)

  expect(fireEvent.submit(form)).toBe(false)
  await waitFor(() => {
    expect(screen.getByTestId('errors').textContent).toBe('必填')
  })
})
