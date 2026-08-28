import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { defaultCatalog } from '../src/catalog'
import { createByok } from '../src/runtime/byok'
import { ByokKeyDialog } from '../src/view/byok-key-dialog'

describe('byokKeyDialog', () => {
  it('opens on a key request, saves through the client, and marks server-covered providers', async () => {
    const byok = createByok({ persistent: false, catalog: defaultCatalog })
    await byok.ready()
    render(<ByokKeyDialog byok={byok} catalog={defaultCatalog} />)
    expect(screen.queryByRole('dialog')).toBeNull()
    act(() => byok.request('openai', 'missing'))
    expect(await screen.findByRole('dialog')).toBeTruthy()
    const row = screen.getByRole('dialog').querySelector('[data-slot=byok-key-dialog-provider][data-provider=openai]')!
    expect(row.getAttribute('data-key-status')).toBe('empty')
    await userEvent.type(row.querySelector('input')!, 'sk-test')
    await userEvent.click(row.querySelector('button[aria-label="Save"]')!)
    expect(byok.getSnapshot().status.openai?.state).toBe('set')
    const vertex = screen.getByRole('dialog').querySelector('[data-provider=vertex]')!
    expect(vertex.hasAttribute('data-server-key')).toBe(true)
  })
})
