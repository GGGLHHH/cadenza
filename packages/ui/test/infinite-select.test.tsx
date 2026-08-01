import type { InfiniteSelectOption } from '../src/components/infinite-select'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import {
  InfiniteSelect,
  InfiniteSelectEmpty,
  InfiniteSelectError,
  InfiniteSelectList,
  InfiniteSelectLoadingOverlay,
  InfiniteSelectRetry,
  InfiniteSelectSearch,
} from '../src/components/infinite-select'

beforeAll(() => {
  // jsdom lacks the observers RAC's overlay/sentinel machinery expects.
  vi.stubGlobal('ResizeObserver', class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  })
  vi.stubGlobal('IntersectionObserver', class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): [] {
      return []
    }
  })
  Element.prototype.scrollIntoView = vi.fn()
  // Base UI's ScrollArea polls viewport.getAnimations(), absent in jsdom.
  Element.prototype.getAnimations = () => []
  // TanStack Virtual sizes its window from offsetWidth/offsetHeight, which are
  // always 0 in layout-less jsdom — every row would be culled. Pretend to be a
  // viewport.
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get: () => 256,
  })
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get: () => 288,
  })
})

function getOption(item: { id: string, label: string }): InfiniteSelectOption {
  return {
    id: item.id,
    label: item.label,
  }
}

// State slots: context-driven, self-rendering per panel state. The base has
// zero copy — all text below comes from these children. The List part joins
// the same composition channel (React Aria-style parts, caller order).
const slots = (
  <>
    <InfiniteSelectList />
    <InfiniteSelectEmpty>No results</InfiniteSelectEmpty>
    <InfiniteSelectError>
      Failed
      <InfiniteSelectRetry>Retry</InfiniteSelectRetry>
    </InfiniteSelectError>
  </>
)

describe('infiniteSelect state slots', () => {
  it('shows the empty slot when there are no items (and nothing else)', () => {
    render(
      <InfiniteSelect getOption={getOption} items={[]}>
        {slots}
      </InfiniteSelect>,
    )
    expect(screen.getByText('No results')).not.toBeNull()
    expect(screen.queryByText('Failed')).toBeNull()
  })

  it('frosts a min-height shell while first-page loading — one loading look, no copy', () => {
    render(
      <InfiniteSelect getOption={getOption} isLoading items={[]}>
        {slots}
      </InfiniteSelect>,
    )
    expect(screen.queryByText('No results')).toBeNull()
    const shell = document.querySelector('[data-slot="infinite-select-list-container"]')
    expect(shell?.className).toContain('min-block-24')
    expect(
      shell?.querySelector('[data-slot="loading-overlay"]')?.getAttribute('data-loading'),
    ).toBe('true')
  })

  it('keeps the list under a frosted overlay on refresh — never the loading slot', () => {
    // isLoading with results on screen (react-query placeholderData) used to
    // unmount the whole list; now the rows stay put and frost over.
    render(
      <InfiniteSelect getOption={getOption} isLoading items={[{ id: '1', label: 'Alice' }]}>
        {slots}
      </InfiniteSelect>,
    )
    expect(screen.getByText('Alice')).not.toBeNull()
    const overlay = document.querySelector('[data-slot="loading-overlay"]')
    expect(overlay?.getAttribute('data-loading')).toBe('true')
  })

  it('lifts a composed LoadingOverlay part into the list shell — fragment included', () => {
    // The marker renders null where written; the List renders its props at
    // the one position an absolute overlay works. Wrapped in a fragment on
    // purpose: slot channels routinely are.
    render(
      <InfiniteSelect getOption={getOption} isLoading items={[{ id: '1', label: 'Alice' }]}>
        <InfiniteSelectList />
        <>
          <InfiniteSelectLoadingOverlay className="backdrop-blur-lg">
            <span data-testid="brand">品牌加载</span>
          </InfiniteSelectLoadingOverlay>
        </>
      </InfiniteSelect>,
    )
    const overlay = document.querySelector('[data-slot="loading-overlay"]')
    expect(overlay?.className).toContain('backdrop-blur-lg')
    expect(screen.getByTestId('brand')).not.toBeNull()
    expect(overlay?.querySelector('[data-slot="spinner"]')).toBeNull()
  })

  it('shows the error slot with a retry button wired to onRetry', async () => {
    const onRetry = vi.fn()
    render(
      <InfiniteSelect getOption={getOption} isError items={[]} onRetry={onRetry}>
        {slots}
      </InfiniteSelect>,
    )
    expect(screen.getByText('Failed')).not.toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('renders items and hides state slots when loaded', () => {
    render(
      <InfiniteSelect getOption={getOption} items={[{ id: '1', label: 'Alice' }]}>
        {slots}
      </InfiniteSelect>,
    )
    expect(screen.getByText('Alice')).not.toBeNull()
    expect(screen.queryByText('No results')).toBeNull()
  })

  it('retry slot renders nothing when onRetry is absent', () => {
    render(
      <InfiniteSelect getOption={getOption} isError items={[]}>
        {slots}
      </InfiniteSelect>,
    )
    expect(screen.getByText('Failed')).not.toBeNull()
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull()
  })
})

describe('infiniteSelect selection', () => {
  const items = [
    { id: 'a', label: 'Alice' },
    { id: 'b', label: 'Bob' },
  ]

  it('renders an aria listbox with options', () => {
    render(
      <InfiniteSelect getOption={getOption} items={items}>
        <InfiniteSelectList />
      </InfiniteSelect>,
    )
    expect(screen.getByRole('listbox')).not.toBeNull()
    expect(screen.getAllByRole('option')).toHaveLength(2)
  })

  it('single: reports the picked item, then undefined on toggle-off', async () => {
    const onChange = vi.fn()
    render(
      <InfiniteSelect getOption={getOption} items={items} onChange={onChange}>
        <InfiniteSelectList />
      </InfiniteSelect>,
    )

    await userEvent.click(screen.getByRole('option', { name: 'Alice' }))
    expect(onChange).toHaveBeenLastCalledWith(items[0])

    await userEvent.click(screen.getByRole('option', { name: 'Alice' }))
    expect(onChange).toHaveBeenLastCalledWith(undefined)
  })

  it('multi: keeps preselected ids whose items were never loaded', async () => {
    // value=['x'] but only a/b are loaded — x has an id and no item object.
    // Toggling 'a' must yield ids ['x','a'], not collapse to ['a'].
    const onChange = vi.fn()
    render(
      <InfiniteSelect
        getOption={getOption}
        items={items}
        selectionMode="multiple"
        onChange={onChange}
        value={['x']}
      >
        <InfiniteSelectList />
      </InfiniteSelect>,
    )

    await userEvent.click(screen.getByRole('option', { name: 'Alice' }))
    expect(onChange).toHaveBeenCalledTimes(1)
    const [loadedItems, ids] = onChange.mock.calls[0] as [unknown[], string[]]
    expect([...ids].sort()).toEqual(['a', 'x'])
    // Only the loaded object echoes back.
    expect(loadedItems).toEqual([items[0]])
  })

  it('single: a controlled value can be cleared back to undefined', () => {
    const { rerender } = render(
      <InfiniteSelect getOption={getOption} items={items} value="a">
        <InfiniteSelectList />
      </InfiniteSelect>,
    )
    expect(screen.getByRole('option', { name: 'Alice', selected: true })).not.toBeNull()

    rerender(
      <InfiniteSelect getOption={getOption} items={items} value={undefined}>
        <InfiniteSelectList />
      </InfiniteSelect>,
    )
    expect(screen.getByRole('option', { name: 'Alice', selected: false })).not.toBeNull()
  })

  it('virtualizes: only the window plus overscan reaches the DOM', () => {
    const many = Array.from({ length: 1000 }, (_, i) => ({ id: `i${i}`, label: `Item ${i}` }))
    render(
      <InfiniteSelect getOption={getOption} items={many}>
        <InfiniteSelectList virtualized />
      </InfiniteSelect>,
    )
    const rendered = screen.getAllByRole('option').length
    // 256px viewport / 34px stride ≈ 8 visible + 12 overscan, far below 1000.
    expect(rendered).toBeGreaterThan(5)
    expect(rendered).toBeLessThan(60)
  })

  it('virtualized prefetch: fires onLoadMore near the tail, stays quiet far from it', () => {
    const onLoadMore = vi.fn()
    const many = Array.from({ length: 1000 }, (_, i) => ({ id: `i${i}`, label: `Item ${i}` }))
    const { unmount } = render(
      <InfiniteSelect getOption={getOption} hasNextPage items={many} onLoadMore={onLoadMore}>
        <InfiniteSelectList virtualized />
      </InfiniteSelect>,
    )
    // Window sits at the top; ~30k px of unrendered rows remain below.
    expect(onLoadMore).not.toHaveBeenCalled()
    unmount()

    const few = Array.from({ length: 5 }, (_, i) => ({ id: `i${i}`, label: `Item ${i}` }))
    render(
      <InfiniteSelect getOption={getOption} hasNextPage items={few} onLoadMore={onLoadMore}>
        <InfiniteSelectList virtualized />
      </InfiniteSelect>,
    )
    // The window covers the whole list: within a viewport of the tail.
    expect(onLoadMore).toHaveBeenCalled()
  })

  it('renderItem receives the loaded-list index in both render paths', () => {
    const many = Array.from({ length: 3 }, (_, i) => ({ id: `i${i}`, label: `Item ${i}` }))
    const renderWithIndex = ({ option, index }: { option: InfiniteSelectOption, index: number }): string => `#${index} ${String(option.label)}`

    const { unmount } = render(
      <InfiniteSelect getOption={getOption} items={many}>
        <InfiniteSelectList renderItem={renderWithIndex} />
      </InfiniteSelect>,
    )
    expect(screen.getByText('#2 Item 2')).not.toBeNull()
    unmount()

    render(
      <InfiniteSelect getOption={getOption} items={many}>
        <InfiniteSelectList renderItem={renderWithIndex} virtualized />
      </InfiniteSelect>,
    )
    expect(screen.getByText('#2 Item 2')).not.toBeNull()
  })

  it('multi: marks selected options with aria-selected', () => {
    render(
      <InfiniteSelect getOption={getOption} items={items} selectionMode="multiple" value={['b']}>
        <InfiniteSelectList />
      </InfiniteSelect>,
    )
    expect(screen.getByRole('option', { name: 'Bob', selected: true })).not.toBeNull()
    expect(screen.getByRole('option', { name: 'Alice', selected: false })).not.toBeNull()
  })

  it('passes RAC field props through the search part — only the filter wiring is reserved', () => {
    render(
      <InfiniteSelect getOption={getOption} items={items}>
        <InfiniteSelectSearch isDisabled />
        <InfiniteSelectList />
      </InfiniteSelect>,
    )
    expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveProperty('disabled', true)
  })

  it('lets children replace the search composition', () => {
    render(
      <InfiniteSelect getOption={getOption} items={items}>
        <InfiniteSelectSearch>
          <span data-testid="custom-search">自定义搜索</span>
        </InfiniteSelectSearch>
        <InfiniteSelectList />
      </InfiniteSelect>,
    )
    expect(screen.getByTestId('custom-search')).not.toBeNull()
    expect(document.querySelector('[data-slot="infinite-select-search-input"]')).toBeNull()
  })

  it('renders no placeholder copy by default — the aria fallback never shows', () => {
    render(
      <InfiniteSelect getOption={getOption} items={items}>
        <InfiniteSelectSearch />
        <InfiniteSelectList />
      </InfiniteSelect>,
    )
    const input = screen.getByRole('searchbox', { name: 'Search' })
    expect(input.getAttribute('placeholder')).toBeNull()
  })

  it('hands renderItem the full RAC render-prop vocabulary', () => {
    let captured: unknown
    render(
      <InfiniteSelect getOption={getOption} items={items} value="a">
        <InfiniteSelectList renderItem={(params) => {
          if (params.option.id === 'a')
            captured = params
          return params.option.label
        }}
        />
      </InfiniteSelect>,
    )
    expect(captured).toMatchObject({
      index: 0,
      isSelected: true,
      isHovered: false,
      isPressed: false,
      isFocusVisible: false,
      isDisabled: false,
      selectionMode: 'single',
      selectionBehavior: 'toggle',
    })
  })

  it('styles the listbox and the rows through their own outlets, function form included', () => {
    render(
      <InfiniteSelect getOption={getOption} items={items} value="b">
        <InfiniteSelectList
          itemClassName={({ isSelected }) => isSelected ? 'opacity-25' : 'opacity-75'}
          listClassName="tracking-widest"
        />
      </InfiniteSelect>,
    )
    expect(document.querySelector('[data-slot="infinite-select-list"]')?.className).toContain('tracking-widest')
    expect(screen.getByRole('option', { name: 'Bob' }).className).toContain('opacity-25')
    expect(screen.getByRole('option', { name: 'Alice' }).className).toContain('opacity-75')
  })
})
