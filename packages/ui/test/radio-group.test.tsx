import type { RadioGroupChangeEventDetails, RadioGroupProps } from '../src/components/radio-group'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { expect, it, vi } from 'vitest'
import { Field, FieldLabel, FieldLegend, FieldSet } from '../src/components/field'
import { RadioGroup, RadioGroupItem } from '../src/components/radio-group'

// Written out rather than `Parameters<typeof RadioGroup>[0]`: that instantiates
// the generic away, which is the very degradation the seam exists to prevent.
function renderPlans(props: Partial<RadioGroupProps<string>> = {}): void {
  render(
    <FieldSet>
      <FieldLegend id="plan">套餐</FieldLegend>
      <RadioGroup aria-labelledby="plan" defaultValue="free" name="plan" {...props}>
        <Field orientation="horizontal">
          <RadioGroupItem id="plan-free" value="free" />
          <FieldLabel htmlFor="plan-free">免费版</FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <RadioGroupItem id="plan-pro" value="pro" />
          <FieldLabel htmlFor="plan-pro">专业版</FieldLabel>
        </Field>
      </RadioGroup>
    </FieldSet>,
  )
}

it('selects through an item label and reports the value with details', async () => {
  const user = userEvent.setup()
  const onValueChange = vi.fn<(value: string, details: RadioGroupChangeEventDetails) => void>()
  renderPlans({ onValueChange })

  const pro = screen.getByRole('radio', { name: '专业版' })
  expect(screen.getByRole('radio', { name: '免费版' }).getAttribute('aria-checked')).toBe('true')

  await user.click(screen.getByText('专业版'))

  expect(onValueChange).toHaveBeenCalledWith('pro', expect.objectContaining({ reason: 'none' }))
  expect(pro.getAttribute('aria-checked')).toBe('true')
})

it('forwards refs through the generic wrappers', () => {
  const group = createRef<HTMLDivElement>()
  const item = createRef<HTMLSpanElement>()
  render(
    <RadioGroup aria-label="套餐" ref={group}>
      <RadioGroupItem aria-label="免费版" ref={item} value="free" />
    </RadioGroup>,
  )
  // The seam re-declares both parts as generic functions; `ref` rides in with
  // the rest of the props, so it must not get lost on the way through.
  expect(group.current?.getAttribute('role')).toBe('radiogroup')
  expect(item.current?.getAttribute('role')).toBe('radio')
})

it('stays unnamed until aria-labelledby points at the legend by hand', () => {
  // The group is a bare role="radiogroup" div. Base UI would name it from its
  // own Field.Root / Fieldset.Legend contexts, but the seam's FieldLegend is
  // shadcn's plain-DOM line — the two label channels do not meet.
  render(
    <FieldSet>
      <FieldLegend id="unwired">套餐</FieldLegend>
      <RadioGroup>
        <RadioGroupItem aria-label="免费版" value="free" />
      </RadioGroup>
    </FieldSet>,
  )
  expect(screen.getByRole('radiogroup').getAttribute('aria-labelledby')).toBeNull()
  expect(screen.queryByRole('radiogroup', { name: '套餐' })).toBeNull()
})
