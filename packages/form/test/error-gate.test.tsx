import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, it } from 'vitest'
import { fieldErrors, useForm } from '../src'

function GateProbe() {
  const form = useForm({
    defaultValues: { name: '' },
    validators: {
      onChange: ({ value }) =>
        value.name.length < 2 ? { fields: { name: '太短' } } : undefined,
    },
    onSubmit: () => {},
  })

  return (
    <form
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
  const input = screen.getByRole('textbox')

  fireEvent.change(input, { target: { value: 'a' } })
  expect(screen.getByTestId('errors').textContent).toBe('')

  fireEvent.click(screen.getByRole('button', { name: '提交' }))
  await waitFor(() => {
    expect(screen.getByTestId('errors').textContent).toBe('太短')
  })
})
