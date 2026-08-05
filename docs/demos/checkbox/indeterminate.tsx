import type { ReactElement } from 'react'
import {
  Checkbox,
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'

const SECTIONS = [
  { id: 'strings', label: '弦乐' },
  { id: 'winds', label: '木管' },
  { id: 'brass', label: '铜管' },
]

// checked 与 indeterminate 是两个正交状态:全选框只在「全勾」时 checked,
// 「勾了一部分」时 indeterminate(aria-checked="mixed"),两者都为 false 才是空。
// Base UI 的 parent 需要 CheckboxGroup,本库没提升,所以这两个值自己算。
export default function IndeterminateDemo(): ReactElement {
  const [selected, setSelected] = useState<string[]>(['strings'])
  const allChecked = selected.length === SECTIONS.length
  const someChecked = selected.length > 0 && !allChecked

  return (
    <FieldSet className="inline-full max-inline-sm">
      <FieldLegend variant="label">参演声部</FieldLegend>
      <FieldGroup>
        <Field orientation="horizontal">
          <Checkbox
            checked={allChecked}
            id="checkbox-indeterminate-all"
            indeterminate={someChecked}
            onCheckedChange={next => setSelected(next ? SECTIONS.map(section => section.id) : [])}
          />
          <FieldLabel htmlFor="checkbox-indeterminate-all">全选</FieldLabel>
        </Field>
        <FieldGroup className="ps-6">
          {SECTIONS.map(section => (
            <Field key={section.id} orientation="horizontal">
              <Checkbox
                checked={selected.includes(section.id)}
                id={`checkbox-indeterminate-${section.id}`}
                onCheckedChange={next => setSelected(current => (
                  next
                    ? [...current, section.id]
                    : current.filter(id => id !== section.id)
                ))}
              />
              <FieldLabel htmlFor={`checkbox-indeterminate-${section.id}`}>
                {section.label}
              </FieldLabel>
            </Field>
          ))}
        </FieldGroup>
      </FieldGroup>
    </FieldSet>
  )
}
