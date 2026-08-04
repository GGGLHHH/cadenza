import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { InputGroup, InputGroupAddon } from '../src/components/input-group'
import {
  SearchField,
  SearchFieldClearButton,
  SearchFieldInput,
} from '../src/components/search-field'

// Real timers throughout: faking them deadlocks the press and focus machinery
// under userEvent, which schedules its own. Timing is made deterministic by the
// debounce interval instead — a few ms when the query should arrive, a few
// seconds when the point is that it has not arrived yet.
const SETTLES = 20
const NEVER = 10_000

describe('searchField', () => {
  it('renders a searchbox — type=search is what gives it the role', () => {
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

    await user.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(screen.getByRole('searchbox')).toHaveProperty('value', '')
    // debounceMs is 10s here, so this can only have come from the immediate
    // path: dropping a filter must not lag behind the click.
    expect(onQueryValueChange).toHaveBeenCalledExactlyOnceWith(undefined)
  })

  it('clears on Escape', async () => {
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
    // Not cosmetic: a read-only field's clear button is disabled, and InputGroup
    // dims itself for any disabled descendant — so leaving it in the DOM makes
    // a read-only field render as a disabled one. `hidden` would not help,
    // since a display:none element still answers `:has(:disabled)`.
    render(<SearchField aria-label="搜索" defaultValue="ravel" readOnly />)
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull()
    expect(document.querySelector('[data-slot="input-group"] :disabled')).toBeNull()
  })

  it('keeps the clear button on a disabled field, dimmed with the rest', () => {
    render(<SearchField aria-label="搜索" defaultValue="ravel" disabled />)
    expect(screen.getByRole('button', { name: 'Clear search' })).toHaveProperty('disabled', true)
  })

  it('chains a caller onClear after the immediate reset instead of being replaced by it', async () => {
    const user = userEvent.setup()
    const onClear = vi.fn()
    const onQueryValueChange = vi.fn()
    render(
      <SearchField
        aria-label="搜索"
        debounceMs={NEVER}
        defaultValue="ravel"
        onClear={onClear}
        onQueryValueChange={onQueryValueChange}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(onClear).toHaveBeenCalledTimes(1)
    // Still the immediate path: listening to onClear must not silently turn
    // clearing back into a debounced act.
    expect(onQueryValueChange).toHaveBeenCalledExactlyOnceWith(undefined)
  })

  it('publishes its state as data attributes — the root is a plain div', () => {
    // No function className here: the root bottoms out in a <div>, not a Base UI
    // slot, so the type says string and means it. State styling goes through
    // these attributes (`data-disabled:opacity-50`), which is also what the
    // default composition uses to hide the clear button.
    render(<SearchField aria-label="搜索" className="opacity-25" disabled readOnly />)
    const field = document.querySelector('[data-slot="search-field"]')
    expect(field?.getAttribute('data-disabled')).toBe('true')
    expect(field?.getAttribute('data-readonly')).toBe('true')
    expect(field?.getAttribute('data-empty')).toBe('true')
    expect(field?.className).toContain('opacity-25')
    expect(field?.className).toContain('group/search-field')
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

  it('hands function children the field render props — the dual-form children contract', () => {
    // A takeover, like Button's: the default composition is not injected, and
    // the caller reads the same states the default composition itself uses
    // (it hides the clear button off readOnly).
    render(
      <SearchField aria-label="搜索" defaultValue="ravel">
        {({ empty }) => (
          <InputGroup>
            <SearchFieldInput />
            <span data-testid="state">{empty ? '空' : '有值'}</span>
          </InputGroup>
        )}
      </SearchField>,
    )
    expect(screen.getByTestId('state').textContent).toBe('有值')
    expect(screen.getByRole('searchbox')).toHaveProperty('value', 'ravel')
  })

  it('hands function children the default composition as defaultChildren — extend, not rebuild', () => {
    // The defaultChildren contract: nothing is injected, but the
    // function can render the default composition and add around it.
    render(
      <SearchField aria-label="搜索" placeholder="搜索...">
        {({ defaultChildren }) => (
          <>
            {defaultChildren}
            <span data-testid="extra">追加部件</span>
          </>
        )}
      </SearchField>,
    )
    expect(screen.getByRole('searchbox').getAttribute('placeholder')).toBe('搜索...')
    expect(screen.getByTestId('extra')).not.toBeNull()
  })

  it('pushes disabled down to the control and out as a data attribute', () => {
    render(<SearchField aria-label="搜索" defaultValue="ravel" disabled />)
    expect(screen.getByRole('searchbox')).toHaveProperty('disabled', true)
    expect(
      document.querySelector('[data-slot="search-field"]')?.getAttribute('data-disabled'),
    ).not.toBeNull()
  })
  it('submits the raw text on Enter', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<SearchField aria-label="搜索" defaultValue="ravel" onSubmit={onSubmit} />)

    await user.click(screen.getByRole('searchbox'))
    await user.keyboard('{Enter}')
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith('ravel')
  })

  it('keeps the clear button out of the tab order', () => {
    // Keyboard users clear with Escape; a stop between the input and the next
    // control is friction, not an affordance.
    render(<SearchField aria-label="搜索" defaultValue="ravel" />)
    expect(screen.getByRole('button', { name: 'Clear search' }).tabIndex).toBe(-1)
  })
})
