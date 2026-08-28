import { render } from '@testing-library/react'
import { expect, it } from 'vitest'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../src/components/empty'

it('lays out header, media, title, description and content under their slots', () => {
  const { container } = render(
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">i</EmptyMedia>
        <EmptyTitle>No threads yet</EmptyTitle>
        <EmptyDescription>Start a conversation to see it here.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>action</EmptyContent>
    </Empty>,
  )
  const q = (slot: string): HTMLElement | null => container.querySelector(`[data-slot=${slot}]`)
  expect(q('empty')).not.toBeNull()
  expect(q('empty-header')).not.toBeNull()
  // shadcn names the media slot `empty-icon` whatever the variant — a
  // vendored quirk the seam documents rather than patches.
  expect(q('empty-icon')?.dataset.variant).toBe('icon')
  expect(q('empty-title')?.textContent).toBe('No threads yet')
  // Typed as a <p> upstream but rendered as a <div>; the seam re-types it.
  expect(q('empty-description')?.tagName).toBe('DIV')
  expect(q('empty-content')?.textContent).toBe('action')
})
