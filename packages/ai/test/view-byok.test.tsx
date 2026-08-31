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

describe('byokKeyDialog confirm', () => {
  it('focuses the prompted provider, Enter saves and closes with reason confirm', async () => {
    const byok = createByok({ persistent: false, catalog: defaultCatalog })
    await byok.ready()
    const closes: string[] = []
    render(
      <ByokKeyDialog
        byok={byok}
        catalog={defaultCatalog}
        onOpenChange={(open, details) => {
          if (!open)
            closes.push(details.reason)
        }}
      />,
    )
    act(() => byok.request('deepseek', 'missing'))
    const dialog = await screen.findByRole('dialog')
    const row = dialog.querySelector('[data-provider=deepseek]')!
    expect(row.hasAttribute('data-prompted')).toBe(true)
    const input = row.querySelector('input')!
    expect(document.activeElement).toBe(input)
    await userEvent.type(input, 'sk-deepseek{Enter}')
    expect(byok.getSnapshot().status.deepseek?.state).toBe('set')
    expect(closes).toEqual(['confirm'])
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('confirm saves every row that has a draft', async () => {
    const byok = createByok({ persistent: false, catalog: defaultCatalog })
    await byok.ready()
    render(<ByokKeyDialog byok={byok} catalog={defaultCatalog} defaultOpen />)
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(dialog.querySelector('[data-provider=openai] input')!, 'sk-a')
    await userEvent.type(dialog.querySelector('[data-provider=groq] input')!, 'sk-b')
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(byok.getSnapshot().status.openai?.state).toBe('set')
    expect(byok.getSnapshot().status.groq?.state).toBe('set')
    expect(byok.getSnapshot().status.mistral?.state ?? 'empty').toBe('empty')
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

describe('byokKeyDialog storage line', () => {
  it('tells where keys go in the storage\'s own words', async () => {
    const byok = createByok({ persistent: false, catalog: defaultCatalog })
    await byok.ready()
    render(<ByokKeyDialog byok={byok} catalog={defaultCatalog} defaultOpen />)
    const line = (await screen.findByRole('dialog')).querySelector('[data-slot=byok-key-dialog-storage]')!
    expect(line.textContent).toContain(byok.storage.label)
    expect(line.hasAttribute('data-persistent')).toBe(false)
  })
})
