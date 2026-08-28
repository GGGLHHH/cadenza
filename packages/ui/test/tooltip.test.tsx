import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { Tooltip, TooltipPopup, TooltipProvider, TooltipTrigger } from '../src/components/tooltip'

// Base UI's tooltip popup carries no `role="tooltip"` (upstream leaves the
// trigger's own label as the accessible text), so the popup is located by
// its slot rather than by role.
function getPopup(): HTMLElement {
  const popup = document.querySelector<HTMLElement>('[data-slot="tooltip-content"]')
  if (!popup)
    throw new Error('tooltip popup not mounted')
  return popup
}

it('mounts the popup in a portal when open, under the vendored content slot', () => {
  render(
    <TooltipProvider>
      <Tooltip open>
        <TooltipTrigger>Hover</TooltipTrigger>
        <TooltipPopup>Add to library</TooltipPopup>
      </Tooltip>
    </TooltipProvider>,
  )
  const popup = getPopup()
  expect(popup.textContent).toContain('Add to library')
  expect(popup.getAttribute('data-open')).toBe('')
  expect(popup.getAttribute('data-side')).toBe('top')
  // The seam renames the part to Popup; the slot stays what shadcn wrote,
  // because Kbd's vendored styles key on `in-data-[slot=tooltip-content]`.
  expect(screen.getByText('Hover').getAttribute('data-slot')).toBe('tooltip-trigger')
})

it('resolves a function className against the popup state', () => {
  render(
    <Tooltip open>
      <TooltipTrigger>Hover</TooltipTrigger>
      <TooltipPopup className={state => (state.open ? 'is-open' : 'is-closed')}>tip</TooltipPopup>
    </Tooltip>,
  )
  expect(getPopup().className).toContain('is-open')
})
