import type { ComponentType } from 'react'
import { pathClassName } from '@animate-ui/react/icons'
import { render } from '@testing-library/react'
import { expect, it } from 'vitest'
import * as icons from '../src'
import manifest from '../src/animate-ui/manifest.json'
import * as drawnIcons from '../src/drawn'

// Every icon is exported once, as `<Name>Icon`; AnimateIcon is the trigger.
// Typed loosely: each icon's props name its own animations, so the union of
// all of them is not something a bare `<Icon />` can be checked against.
const all = (Object.entries(icons) as [string, ComponentType<Record<string, unknown>>][])
  .filter(([name]) => name !== 'AnimateIcon')

it('exports each pulled and each drawn icon once, as <Name>Icon', () => {
  expect(all.every(([name]) => name.endsWith('Icon'))).toBe(true)
  const drawn = Object.keys(drawnIcons)
  expect(drawn.every(name => all.some(([n]) => n === name))).toBe(true)
  expect(all).toHaveLength(Object.keys(manifest).length + drawn.length)
})

it('renders every icon as an svg, hidden from assistive tech', () => {
  for (const [name, Icon] of all) {
    const { container, unmount } = render(<Icon />)
    expect(container.querySelector('svg')?.getAttribute('aria-hidden'), name).toBe('true')
    unmount()
  }
})

it('leaves a named icon to assistive tech', () => {
  const Bell = icons.BellIcon as ComponentType<Record<string, unknown>>
  for (const props of [{ 'aria-label': 'Notifications' }, { 'aria-labelledby': 'x' }, { 'role': 'img', 'aria-label': 'Bell' }]) {
    const { container, unmount } = render(<Bell {...props} />)
    expect(container.querySelector('svg')?.hasAttribute('aria-hidden'), JSON.stringify(props)).toBe(false)
    unmount()
  }
})

it('takes animate-ui\'s triggers and a size on the icon itself', () => {
  const Bell = icons.BellIcon as ComponentType<{ animateOnHover?: boolean, size?: number }>
  const { container } = render(<Bell animateOnHover size={32} />)
  expect(container.querySelector('svg')?.getAttribute('width')).toBe('32')
})

it('draws the drawn icons with the stroke-draw class beside the caller\'s', () => {
  const Bold = icons.BoldIcon as ComponentType<{ className?: string }>
  const { container } = render(<Bold className="text-primary" />)
  expect(container.querySelector('svg')?.getAttribute('class')).toBe(`${pathClassName} text-primary`)
  // React hoists the <style href precedence> into the head.
  expect(document.head.querySelector('style[data-href="animate-ui-icon-path"]')).not.toBeNull()
})
