import type { InfiniteSelectOption } from '../src/components/infinite-select'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import {
  InfiniteSelect,
  InfiniteSelectEmpty,
  InfiniteSelectError,
  InfiniteSelectList,
  InfiniteSelectLoadingMore,
  InfiniteSelectLoadingOverlay,
  InfiniteSelectNoMore,
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
  // React Aria's Virtualizer sizes its window from clientWidth/clientHeight and
  // deliberately falls back to Infinity — rendering the whole collection — when
  // it detects a test env that has NOT mocked them (ScrollView.mjs). Mocking
  // them on the prototype is the opt-in that makes windowing observable here.
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get: () => 256,
  })
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
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
    // Two data rows plus the end-of-list mark. React Aria renders loader rows
    // as non-selectable `role="option"` elements — a listbox may only contain
    // options — so count the real rows by slot, not by role.
    expect(screen.getAllByRole('option')).toHaveLength(3)
    expect(document.querySelectorAll('[data-slot="infinite-select-item"]')).toHaveLength(2)
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

  // Prefetch itself is React Aria's: the sentinel fires from an
  // IntersectionObserver, which jsdom's stub can never trip. What stays ours is
  // whether the sentinel is in the collection at all — assert that, in both
  // render paths, and leave the trigger distance to RAC's `scrollOffset`.
  it.each([true, false])('the tail row switches from load-more to end-of-list (virtualized: %s)', (virtualized) => {
    const many = Array.from({ length: 1000 }, (_, i) => ({ id: `i${i}`, label: `Item ${i}` }))
    const loadMore = '[data-slot="infinite-select-load-more"]'
    const noMore = '[data-slot="infinite-select-no-more"]'
    const { container, rerender } = render(
      <InfiniteSelect getOption={getOption} hasNextPage items={many} onLoadMore={vi.fn()}>
        <InfiniteSelectList virtualized={virtualized} />
      </InfiniteSelect>,
    )
    // More to come and not fetching: the sentinel is a 0×0 probe, no visible row.
    expect(container.querySelector('[data-testid="loadMoreSentinel"]')).not.toBeNull()
    expect(container.querySelector(loadMore)).toBeNull()
    expect(container.querySelector(noMore)).toBeNull()

    rerender(
      <InfiniteSelect
        getOption={getOption}
        hasNextPage
        isFetchingNextPage
        items={many}
        onLoadMore={vi.fn()}
      >
        <InfiniteSelectList virtualized={virtualized} />
        <InfiniteSelectLoadingMore>loading…</InfiniteSelectLoadingMore>
      </InfiniteSelect>,
    )
    expect(container.querySelector(loadMore)?.textContent).toBe('loading…')
    expect(container.querySelector(noMore)).toBeNull()

    // No indicator passed: the row still renders, with the copyless default.
    // React Aria only renders it when it has children — an empty one would
    // mean the next page lands with no feedback at all.
    rerender(
      <InfiniteSelect
        getOption={getOption}
        hasNextPage
        isFetchingNextPage
        items={many}
        onLoadMore={vi.fn()}
      >
        <InfiniteSelectList virtualized={virtualized} />
      </InfiniteSelect>,
    )
    expect(container.querySelector(`${loadMore} [data-slot="spinner"]`)).not.toBeNull()

    rerender(
      <InfiniteSelect getOption={getOption} items={many} onLoadMore={vi.fn()}>
        <InfiniteSelectList virtualized={virtualized} />
      </InfiniteSelect>,
    )
    expect(container.querySelector(loadMore)).toBeNull()
    // Default: a mark, not a sentence — the base ships zero copy.
    expect(container.querySelector(noMore)?.textContent).toBe('')
    expect(container.querySelector('[data-slot="infinite-select-no-more-rule"]')).not.toBeNull()
  })

  it('infiniteSelectNoMore replaces the default end-of-list mark, and only then', () => {
    render(
      <InfiniteSelect getOption={getOption} items={items}>
        <InfiniteSelectList />
        <InfiniteSelectNoMore>没有更多数据</InfiniteSelectNoMore>
      </InfiniteSelect>,
    )
    expect(document.querySelector('[data-slot="infinite-select-no-more"]')?.textContent).toBe('没有更多数据')
    expect(document.querySelector('[data-slot="infinite-select-no-more-rule"]')).toBeNull()
  })

  it('no end-of-list mark while a next page exists or the list is empty', () => {
    const { rerender } = render(
      <InfiniteSelect getOption={getOption} hasNextPage items={items} onLoadMore={vi.fn()}>
        <InfiniteSelectList />
        <InfiniteSelectNoMore>没有更多数据</InfiniteSelectNoMore>
      </InfiniteSelect>,
    )
    expect(document.querySelector('[data-slot="infinite-select-no-more"]')).toBeNull()

    rerender(
      <InfiniteSelect getOption={getOption} items={[]}>
        <InfiniteSelectList />
        <InfiniteSelectNoMore>没有更多数据</InfiniteSelectNoMore>
      </InfiniteSelect>,
    )
    expect(document.querySelector('[data-slot="infinite-select-no-more"]')).toBeNull()
  })

  it('virtualized: the collection keeps every loaded row even though the DOM does not', () => {
    const many = Array.from({ length: 1000 }, (_, i) => ({ id: `i${i}`, label: `Item ${i}` }))
    render(
      <InfiniteSelect getOption={getOption} items={many}>
        <InfiniteSelectList virtualized />
      </InfiniteSelect>,
    )
    const options = screen.getAllByRole('option')
    expect(options.length).toBeLessThan(60)
    // Windowing is a DOM concern; screen readers still hear the full count.
    expect(options[0].getAttribute('aria-setsize')).toBe('1000')
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
