import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { createFormHook, fieldControlProps, fieldErrorMessage, useFieldContext } from '../src'

function TextField({ label }: { label: string }) {
  const field = useFieldContext<string>()

  return (
    <label>
      {label}
      <input
        {...fieldControlProps(field)}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={event => field.handleChange(event.target.value)}
      />
      <span data-testid="message">{fieldErrorMessage(field) ?? ''}</span>
    </label>
  )
}

const { useAppForm } = createFormHook({ fieldComponents: { TextField } })

function Demo() {
  const form = useAppForm({
    defaultValues: { name: '' },
    validators: {
      onChange: ({ value }) => (value.name ? undefined : { fields: { name: '必填' } }),
      onBlur: ({ value }) => (value.name ? undefined : { fields: { name: '必填' } }),
    },
    onSubmit: () => {},
  })

  return (
    <form.AppField name="name">
      {field => <field.TextField label="姓名" />}
    </form.AppField>
  )
}

it('使用方注入的 field 组件经包内单例 contexts 拿到字段，门禁贯通', () => {
  render(<Demo />)
  const input = screen.getByLabelText('姓名')

  // fieldControlProps 的 aria 接线
  expect(input).toHaveProperty('id', 'name')
  expect(input.getAttribute('aria-describedby')).toBe('name-error')
  expect(input.getAttribute('aria-invalid')).toBe('false')

  fireEvent.blur(input)
  expect(screen.getByTestId('message').textContent).toBe('必填')
  expect(input.getAttribute('aria-invalid')).toBe('true')
})

it('不传 fieldComponents 也能创建 useAppForm', () => {
  const { useAppForm: useBareAppForm } = createFormHook()
  expect(typeof useBareAppForm).toBe('function')
})
