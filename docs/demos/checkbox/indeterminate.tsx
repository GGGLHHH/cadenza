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
  { id: 'strings', label: 'Strings' },
  { id: 'winds', label: 'Woodwinds' },
  { id: 'brass', label: 'Brass' },
]

// checked and indeterminate are two orthogonal states: the select-all box is
// checked only when everything is ticked, indeterminate (aria-checked=
// "mixed") when only some are, and empty when both are false.
// Base UI's parent requires CheckboxGroup, which this library does not
// promote, so compute both values yourself.
export default function IndeterminateDemo(): ReactElement {
  const [selected, setSelected] = useState<string[]>(['strings'])
  const allChecked = selected.length === SECTIONS.length
  const someChecked = selected.length > 0 && !allChecked

  return (
    <FieldSet className="inline-full max-inline-sm">
      <FieldLegend variant="label">Performing sections</FieldLegend>
      <FieldGroup>
        <Field orientation="horizontal">
          <Checkbox
            checked={allChecked}
            id="checkbox-indeterminate-all"
            indeterminate={someChecked}
            onCheckedChange={next => setSelected(next ? SECTIONS.map(section => section.id) : [])}
          />
          <FieldLabel htmlFor="checkbox-indeterminate-all">Select all</FieldLabel>
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
