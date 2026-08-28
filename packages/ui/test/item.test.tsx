import { render } from '@testing-library/react'
import { expect, it } from 'vitest'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '../src/components/item'

it('mirrors variant and size on the item and lists the group', () => {
  const { container } = render(
    <ItemGroup>
      <Item variant="outline" size="sm">
        <ItemMedia variant="icon">i</ItemMedia>
        <ItemContent>
          <ItemTitle>Thread</ItemTitle>
          <ItemDescription>Yesterday</ItemDescription>
        </ItemContent>
        <ItemActions>x</ItemActions>
      </Item>
    </ItemGroup>,
  )
  const group = container.querySelector<HTMLElement>('[data-slot=item-group]')!
  expect(group.getAttribute('role')).toBe('list')
  const item = container.querySelector<HTMLElement>('[data-slot=item]')!
  expect(item.dataset.variant).toBe('outline')
  expect(item.dataset.size).toBe('sm')
  expect(container.querySelector<HTMLElement>('[data-slot=item-media]')?.dataset.variant).toBe('icon')
  expect(container.querySelector('[data-slot=item-description]')?.tagName).toBe('P')
})

it('renders as a link through render', () => {
  const { container } = render(<Item render={<a href="/t/1" />}>row</Item>)
  const item = container.querySelector<HTMLElement>('[data-slot=item]')!
  expect(item.tagName).toBe('A')
})
