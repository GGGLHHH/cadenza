import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { InputGroup, InputGroupAddon } from '../src/components/input-group'
import {
  SearchField,
  SearchFieldClearButton,
  SearchFieldInput,
} from '../src/components/search-field'

// Real timers throughout: faking them deadlocks React Aria's press and focus
// machinery, which schedules its own. Timing is made deterministic by the
// debounce interval instead — a few ms when the query should arrive, a few
// seconds when the point is that it has not arrived yet.
const SETTLES = 20
const NEVER = 10_000

describe('searchField', () => {
  it('renders a searchbox — RAC gives the field its type and semantics', () => {
    render(<SearchField aria-label="搜索作曲家" placeholder="搜索..." />)
    const input = screen.getByRole('searchbox', { name: '搜索作曲家' })
    expect(input).not.toBeNull()
    expect(input.getAttribute('placeholder')).toBe('搜索...')
  })

  it('reports raw text on every keystroke and the query only once typing settles', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onQueryValueChange = vi.fn()
    render(
      <SearchField
        aria-label="搜索"
        debounceMs={SETTLES}
        onChange={onChange}
        onQueryValueChange={onQueryValueChange}
      />,
    )

    await user.type(screen.getByRole('searchbox'), 'rav')
    expect(onChange).toHaveBeenCalledTimes(3)
    await waitFor(() => expect(onQueryValueChange).toHaveBeenCalledWith('rav'))
    // Three keystrokes, one query: the intermediate values were debounced away.
    expect(onQueryValueChange).toHaveBeenCalledTimes(1)
  })

  it('holds the query back while typing continues', async () => {
    const user = userEvent.setup()
    const onQueryValueChange = vi.fn()
    render(
      <SearchField aria-label="搜索" debounceMs={NEVER} onQueryValueChange={onQueryValueChange} />,
    )

    await user.type(screen.getByRole('searchbox'), 'ravel')
    expect(onQueryValueChange).not.toHaveBeenCalled()
  })

  it('reads debounceMs at mount, like defaultValue — changing it later does nothing', async () => {
    const user = userEvent.setup()
    const onQueryValueChange = vi.fn()
    const { rerender } = render(
      <SearchField aria-label="搜索" debounceMs={NEVER} onQueryValueChange={onQueryValueChange} />,
    )

    rerender(
      <SearchField aria-label="搜索" debounceMs={SETTLES} onQueryValueChange={onQueryValueChange} />,
    )
    await user.type(screen.getByRole('searchbox'), 'a')
    await new Promise(resolve => setTimeout(resolve, SETTLES * 5))
    // Still the mount-time 10s interval: ahooks builds the debounce once.
    expect(onQueryValueChange).not.toHaveBeenCalled()
  })

  it('trims the query and normalises a blank one to undefined', async () => {
    const user = userEvent.setup()
    const onQueryValueChange = vi.fn()
    render(
      <SearchField aria-label="搜索" debounceMs={SETTLES} onQueryValueChange={onQueryValueChange} />,
    )

    await user.type(screen.getByRole('searchbox'), '  ravel  ')
    await waitFor(() => expect(onQueryValueChange).toHaveBeenLastCalledWith('ravel'))

    await user.clear(screen.getByRole('searchbox'))
    await user.type(screen.getByRole('searchbox'), '   ')
    await waitFor(() => expect(onQueryValueChange).toHaveBeenLastCalledWith(undefined))
  })

  it('clears through the button without waiting for the debounce', async () => {
    const user = userEvent.setup()
    const onQueryValueChange = vi.fn()
    render(
      <SearchField
        aria-label="搜索"
        debounceMs={NEVER}
        defaultValue="ravel"
        onQueryValueChange={onQueryValueChange}
      />,
    )

    await user.click(screen.getByRole('button', { name: '清除搜索' }))
    expect(screen.getByRole('searchbox')).toHaveProperty('value', '')
    // debounceMs is 10s here, so this can only have come from the immediate
    // path: dropping a filter must not lag behind the click.
    expect(onQueryValueChange).toHaveBeenCalledExactlyOnceWith(undefined)
  })

  it('clears on Escape — RAC behaviour, not ours', async () => {
    const user = userEvent.setup()
    render(<SearchField aria-label="搜索" defaultValue="ravel" />)

    await user.click(screen.getByRole('searchbox'))
    await user.keyboard('{Escape}')
    expect(screen.getByRole('searchbox')).toHaveProperty('value', '')
  })

  it('keeps the input on InputGroup\'s control slot, which is what draws the focus ring', () => {
    // `has-[[data-slot=input-group-control]:focus-visible]` on the group is how
    // the ring is drawn. The primitive spreads props after the attribute, so any
    // data-slot passed down here replaces the contract value and the ring dies
    // silently — no error, just no ring.
    render(<SearchField aria-label="搜索" />)
    expect(screen.getByRole('searchbox').dataset.slot).toBe('input-group-control')
  })

  it('marks the field empty so the clear button can hide itself', () => {
    render(<SearchField aria-label="搜索" />)
    const field = document.querySelector('[data-slot="search-field"]')
    expect(field?.getAttribute('data-empty')).not.toBeNull()
  })

  it('leaves the clear button out when read only', () => {
    // Not cosmetic: RAC disables that button in read-only mode, and InputGroup
    // dims itself for any disabled descendant — so leaving it in the DOM makes
    // a read-only field render as a disabled one. `hidden` would not help,
    // since a display:none element still answers `:has(:disabled)`.
    render(<SearchField aria-label="搜索" defaultValue="ravel" isReadOnly />)
    expect(screen.queryByRole('button', { name: '清除搜索' })).toBeNull()
    expect(document.querySelector('[data-slot="input-group"] :disabled')).toBeNull()
  })

  it('keeps the clear button on a disabled field, dimmed with the rest', () => {
    render(<SearchField aria-label="搜索" defaultValue="ravel" isDisabled />)
    expect(screen.getByRole('button', { name: '清除搜索' })).toHaveProperty('disabled', true)
  })

  it('lets children replace the default composition', () => {
    render(
      <SearchField aria-label="搜索">
        <InputGroup>
          <InputGroupAddon>搜</InputGroupAddon>
          <SearchFieldInput placeholder="自定义" />
          <SearchFieldClearButton />
          <span data-testid="extra">额外部件</span>
        </InputGroup>
      </SearchField>,
    )
    expect(screen.getByTestId('extra')).not.toBeNull()
    expect(screen.getByRole('searchbox').getAttribute('placeholder')).toBe('自定义')
  })

  it('passes RAC state props straight through', () => {
    render(<SearchField aria-label="搜索" defaultValue="ravel" isDisabled />)
    expect(screen.getByRole('searchbox')).toHaveProperty('disabled', true)
    expect(
      document.querySelector('[data-slot="search-field"]')?.getAttribute('data-disabled'),
    ).not.toBeNull()
  })
})
