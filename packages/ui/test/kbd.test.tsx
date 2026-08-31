import { render } from '@testing-library/react'
import { expect, it } from 'vitest'
import { Kbd, KbdGroup } from '../src/components/kbd'

it('renders real <kbd> elements for both the key and the group', () => {
  const { container } = render(
    <KbdGroup>
      <Kbd>Ctrl</Kbd>
      <Kbd>B</Kbd>
    </KbdGroup>,
  )
  const group = container.querySelector<HTMLElement>('[data-slot=kbd-group]')!
  // The vendored group types itself as a div but renders <kbd>; the seam's
  // cast makes the props type say what the element is.
  expect(group.tagName).toBe('KBD')
  expect(container.querySelectorAll('[data-slot=kbd]')).toHaveLength(2)
  expect(container.querySelector('[data-slot=kbd]')?.tagName).toBe('KBD')
})
