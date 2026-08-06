import type { ReactElement } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, it } from 'vitest'
import { fieldErrors, useForm } from '../src'

function GateProbe() {
  const form = useForm({
    defaultValues: { name: '' },
    validators: {
      onChange: ({ value }) =>
        value.name.length < 2 ? { fields: { name: { message: '太短' } } } : undefined,
    },
    onSubmit: () => {},
  })

  return (
    <form
      data-testid="form"
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
    >
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
      <button type="submit">提交</button>
    </form>
  )
}

it('onChange 校验实时跑，但错误在 blur 前隐藏、blur 后显示', () => {
  render(<GateProbe />)
  const input = screen.getByRole('textbox')

  fireEvent.change(input, { target: { value: 'a' } })
  expect(screen.getByTestId('errors').textContent).toBe('')

  fireEvent.blur(input)
  expect(screen.getByTestId('errors').textContent).toBe('太短')
})

it('未 blur 但提交过（submissionAttempts > 0）也显示错误', async () => {
  render(<GateProbe />)

  fireEvent.submit(screen.getByTestId('form'))
  await waitFor(() => {
    expect(screen.getByTestId('errors').textContent).toBe('太短')
  })
})

// 门禁语义:只骂动过的字段 —— 整表 onChange 校验会给没碰过的字段写入错误,
// 纯聚焦+失焦(未输入)不该揭示它们;dirty 是粘性的,输入过再清空仍算动过
function TwoFieldProbe(): ReactElement {
  const form = useForm({
    defaultValues: { name: '', title: '' },
    validators: {
      onChange: ({ value }) => {
        const fields: Record<string, { message: string }> = {}
        if (value.name.length < 2)
          fields.name = { message: '太短' }
        if (value.title.length < 2)
          fields.title = { message: '太短' }
        return Object.keys(fields).length > 0 ? { fields } : undefined
      },
    },
    onSubmit: () => {},
  })

  return (
    <form
      data-testid="form"
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
    >
      {(['name', 'title'] as const).map(fieldName => (
        <form.Field key={fieldName} name={fieldName}>
          {field => (
            <>
              <input
                data-testid={`${fieldName}-input`}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={event => field.handleChange(event.target.value)}
              />
              <span data-testid={`${fieldName}-errors`}>
                {fieldErrors(field).map(error => error.message).join(',')}
              </span>
            </>
          )}
        </form.Field>
      ))}
    </form>
  )
}

it('未动过的字段:整表校验写入的错误不因纯 blur 而显示', () => {
  render(<TwoFieldProbe />)

  // name 输入 'a':整表校验给 name 与 title 都写入错误
  fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'a' } })

  // title 从未输入,纯聚焦+失焦:不显示
  fireEvent.blur(screen.getByTestId('title-input'))
  expect(screen.getByTestId('title-errors').textContent).toBe('')

  // name 动过且失焦:显示
  fireEvent.blur(screen.getByTestId('name-input'))
  expect(screen.getByTestId('name-errors').textContent).toBe('太短')
})
