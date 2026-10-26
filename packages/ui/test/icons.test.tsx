import type { ComponentType } from 'react'
import { render } from '@testing-library/react'
import { expect, it } from 'vitest'
import * as icons from '../src/icons'
import manifest from '../src/icons/animate-ui/manifest.json'

// Every pulled icon is exported under its own name and as `<Name>Icon`; the
// base re-exports (`AnimateIcon`, `IconWrapper`) are not icons.
// Typed loosely: each icon's props name its own animations, so the union of
// all 392 is not something a bare `<Icon />` can be checked against.
const own = (Object.entries(icons) as [string, ComponentType][]).filter(([name]) => !name.endsWith('Icon') && name !== 'IconWrapper')

it('exports one component per pulled icon, plus the drawn ones', () => {
  // drawn.tsx: Tabler shapes on animate-ui's stroke draw, for what the set lacks.
  const drawn = ['Brain', 'ChevronsLeft', 'ChevronsRight', 'GripVertical', 'Server', 'Stop']
  expect(own.map(([name]) => name).filter(name => !drawn.includes(name))).toHaveLength(Object.keys(manifest).length)
  expect(drawn.every(name => own.some(([n]) => n === name))).toBe(true)
})

it('renders every icon as an svg', () => {
  for (const [name, Icon] of own) {
    const { container, unmount } = render(<Icon />)
    expect(container.querySelector('svg'), name).not.toBeNull()
    unmount()
  }
})

it('takes animate-ui\'s triggers on the icon itself', () => {
  const Bell = icons.Bell as ComponentType<{ animateOnHover?: boolean, size?: number }>
  const { container } = render(<Bell animateOnHover size={32} />)
  expect(container.querySelector('svg')?.getAttribute('width')).toBe('32')
})
