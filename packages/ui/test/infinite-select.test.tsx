import type { InfiniteSelectOption } from '../src/components/infinite-select'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import {
  InfiniteSelect,
  InfiniteSelectEmpty,
  InfiniteSelectError,
  InfiniteSelectInputGroup,
  InfiniteSelectList,
  InfiniteSelectLoadingMore,
  InfiniteSelectLoadingOverlay,
  InfiniteSelectNoMore,
  InfiniteSelectRetry,
} from '../src/components/infinite-select'

beforeAll(() => {
  // Base UI's ScrollArea polls viewport.getAnimations(), absent in jsdom.
  Element.prototype.getAnimations = () => []
  // jsdom measures everything as 0×0, and TanStack Virtual computes its window
  // from the scroll element's rect — a zero-height viewport yields an empty
  // window and no rows at all. Giving the prototype a size is what makes
  // windowing observable here; a real browser needs none of this.
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get: () => 256,
  })
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get: () => 288,
  })
  HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
    return { x: 0, y: 0, top: 0, left: 0, right: 288, bottom: 256, width: 288, height: 256, toJSON: () => ({}) }
  }
})

function getOption(item: { id: string, label: string }): InfiniteSelectOption {
  return {
    id: item.id,
    label: item.label,
  }
}

// State slots: context-driven, self-rendering per panel state. The base has
// zero copy — all text below comes from these children. The List part joins
// the same composition channel (composed parts, caller order).
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
    ).toBe('')
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
    expect(overlay?.getAttribute('data-loading')).toBe('')
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
    // Exactly the data rows. The end-of-list mark and the load-more sentinel
    // live OUTSIDE the listbox element, so they are not options and never
    // distort aria-setsize — unlike React Aria's loader rows, which had to be
    // non-selectable `role="option"` elements because a listbox may only
    // contain options.
    expect(screen.getAllByRole('option')).toHaveLength(2)
    expect(document.querySelectorAll('[data-slot="infinite-select-item"]')).toHaveLength(2)
  })

  it('single: reports the picked item, and re-clicking it keeps it picked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <InfiniteSelect getOption={getOption} items={items} onChange={onChange}>
        <InfiniteSelectList />
      </InfiniteSelect>,
    )

    await user.click(screen.getByRole('option', { name: 'Alice' }))
    expect(onChange).toHaveBeenLastCalledWith(items[0], expect.objectContaining({ reason: 'item-press' }))

    // Base UI does not toggle a single selection off by re-clicking it — once
    // a value is picked the control has one, the way a native <select> does.
    // Clearing goes through the footer's clear action. (React Aria toggled it
    // back to undefined here.)
    await user.click(screen.getByRole('option', { name: 'Alice' }))
    expect(onChange).toHaveBeenLastCalledWith(items[0], expect.anything())
    expect(screen.getByRole('option', { name: 'Alice', selected: true })).not.toBeNull()
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

  it('single: a controlled value clears with null — undefined belongs to "uncontrolled"', () => {
    const { rerender } = render(
      <InfiniteSelect getOption={getOption} items={items} value="a">
        <InfiniteSelectList />
      </InfiniteSelect>,
    )
    expect(screen.getByRole('option', { name: 'Alice', selected: true })).not.toBeNull()

    rerender(
      <InfiniteSelect getOption={getOption} items={items} value={null}>
        <InfiniteSelectList />
      </InfiniteSelect>,
    )
    expect(screen.getByRole('option', { name: 'Alice', selected: false })).not.toBeNull()
  })

  // TanStack Virtual computes its window from real layout, and jsdom reports
  // none — so the window itself is browser-verified (10000 rows → 16 in the
  // DOM). What jsdom can see is the spacer the virtualizer sizes from the row
  // count, which is proof the virtualizer is live and wired to the data.
  it('virtualized: sizes the scroll height from the whole loaded list', () => {
    const many = Array.from({ length: 1000 }, (_, i) => ({ id: `i${i}`, label: `Item ${i}` }))
    render(
      <InfiniteSelect getOption={getOption} items={many} rowHeight={32} virtualized>
        <InfiniteSelectList />
      </InfiniteSelect>,
    )
    const spacer = document.querySelector<HTMLElement>('[data-slot="infinite-select-list"] > div')
    expect(spacer?.style.height).toBe('32000px')
    // Not the plain path: there is one spacer, not a thousand rows in flow.
    expect(document.querySelectorAll('[data-slot="infinite-select-item"]').length).toBeLessThan(1000)
  })

  // The sentinel fires from an IntersectionObserver, which jsdom's stub can
  // never trip — so what is testable here is which tail element is present, in
  // both render paths. The trigger distance is browser-verified.
  it.each([true, false])('the tail row switches from load-more to end-of-list (virtualized: %s)', (virtualized) => {
    const many = Array.from({ length: 1000 }, (_, i) => ({ id: `i${i}`, label: `Item ${i}` }))
    const loadMore = '[data-slot="infinite-select-load-more"]'
    const noMore = '[data-slot="infinite-select-no-more"]'
    const { container, rerender } = render(
      <InfiniteSelect getOption={getOption} hasNextPage items={many} virtualized={virtualized} onLoadMore={vi.fn()}>
        <InfiniteSelectList />
      </InfiniteSelect>,
    )
    // More to come and not fetching: only the invisible sentinel, no visible row.
    expect(container.querySelector('[data-slot="infinite-select-load-more-sentinel"]')).not.toBeNull()
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
        <InfiniteSelectList />
        <InfiniteSelectLoadingMore>loading…</InfiniteSelectLoadingMore>
      </InfiniteSelect>,
    )
    expect(container.querySelector(loadMore)?.textContent).toBe('loading…')
    expect(container.querySelector(noMore)).toBeNull()

    // No indicator passed: the row still renders, with the copyless default.
    // The default is required, not decorative — without it the next page would
    // land with no feedback at all.
    rerender(
      <InfiniteSelect
        getOption={getOption}
        hasNextPage
        isFetchingNextPage
        items={many}
        onLoadMore={vi.fn()}
      >
        <InfiniteSelectList />
      </InfiniteSelect>,
    )
    expect(container.querySelector(`${loadMore} [data-slot="spinner"]`)).not.toBeNull()

    rerender(
      <InfiniteSelect getOption={getOption} items={many} onLoadMore={vi.fn()}>
        <InfiniteSelectList />
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

  it('renderItem receives the loaded-list index', () => {
    const many = Array.from({ length: 3 }, (_, i) => ({ id: `i${i}`, label: `Item ${i}` }))
    const renderWithIndex = ({ option, index }: { option: InfiniteSelectOption, index: number }): string => `#${index} ${String(option.label)}`

    render(
      <InfiniteSelect getOption={getOption} items={many}>
        <InfiniteSelectList renderItem={renderWithIndex} />
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

  it('names the search input from its placeholder', () => {
    render(
      <InfiniteSelect getOption={getOption} items={items}>
        <InfiniteSelectInputGroup />
        <InfiniteSelectList />
      </InfiniteSelect>,
    )
    expect(screen.getByRole('combobox', { name: 'Search' })).not.toBeNull()
  })

  it('lets children replace the search composition', () => {
    render(
      <InfiniteSelect getOption={getOption} items={items}>
        <InfiniteSelectInputGroup>
          <span data-testid="custom-search">自定义搜索</span>
        </InfiniteSelectInputGroup>
        <InfiniteSelectList />
      </InfiniteSelect>,
    )
    expect(screen.getByTestId('custom-search')).not.toBeNull()
    expect(document.querySelector('[data-slot="infinite-select-search-input"]')).toBeNull()
  })

  it('renders no placeholder copy by default — the aria fallback never shows', () => {
    render(
      <InfiniteSelect getOption={getOption} items={items}>
        <InfiniteSelectInputGroup />
        <InfiniteSelectList />
      </InfiniteSelect>,
    )
    const input = screen.getByRole('combobox', { name: 'Search' })
    expect(input.getAttribute('placeholder')).toBeNull()
  })

  it('hands renderItem the full render-prop vocabulary', () => {
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
      selected: true,
      disabled: false,
      selectionMode: 'single',
    })
  })

  it('styles the listbox and the rows through their own outlets, function form included', () => {
    render(
      <InfiniteSelect getOption={getOption} items={items} value="b">
        <InfiniteSelectList
          itemClassName={({ selected }) => selected ? 'opacity-25' : 'opacity-75'}
          listClassName="tracking-widest"
        />
      </InfiniteSelect>,
    )
    expect(document.querySelector('[data-slot="infinite-select-list"]')?.className).toContain('tracking-widest')
    expect(screen.getByRole('option', { name: 'Bob' }).className).toContain('opacity-25')
    expect(screen.getByRole('option', { name: 'Alice' }).className).toContain('opacity-75')
  })

  it('serializes into a form through name — one hidden input per selected id', () => {
    const { rerender } = render(
      <InfiniteSelect getOption={getOption} items={items} name="composer" selectionMode="multiple" value={['a', 'x']}>
        <InfiniteSelectList />
      </InfiniteSelect>,
    )
    const hidden = [...document.querySelectorAll<HTMLInputElement>('input[type="hidden"][name="composer"]')]
    // Every selected id serializes — the unloaded 'x' included, ids are authoritative.
    expect(hidden.map(input => input.value)).toEqual(['a', 'x'])

    rerender(
      <InfiniteSelect getOption={getOption} items={items} selectionMode="multiple" value={['a']}>
        <InfiniteSelectList />
      </InfiniteSelect>,
    )
    // No name, no inputs: absence is the decision, not a leak.
    expect(document.querySelector('input[type="hidden"]')).toBeNull()
  })

  it('single mode serializes the one value, empty string when cleared', () => {
    const { rerender } = render(
      <InfiniteSelect getOption={getOption} items={items} name="composer" value="a">
        <InfiniteSelectList />
      </InfiniteSelect>,
    )
    expect(document.querySelector<HTMLInputElement>('input[name="composer"]')?.value).toBe('a')
    rerender(
      <InfiniteSelect getOption={getOption} items={items} name="composer" value={null}>
        <InfiniteSelectList />
      </InfiniteSelect>,
    )
    expect(document.querySelector<HTMLInputElement>('input[name="composer"]')?.value).toBe('')
  })

  it('default composition: no children renders the input group and the list', () => {
    render(<InfiniteSelect getOption={getOption} items={items} searchPlaceholder="搜索作曲家" />)
    // The input group with its placeholder-as-name (Base UI's Combobox.Input
    // maps to role=combobox), and the listbox with the options.
    expect(screen.getByRole('combobox', { name: '搜索作曲家' })).not.toBeNull()
    expect(screen.getAllByRole('option')).toHaveLength(2)
  })

  it('written children take the whole channel over — no implicit parts', () => {
    render(
      <InfiniteSelect getOption={getOption} items={items}>
        <InfiniteSelectList />
      </InfiniteSelect>,
    )
    // Only what was written: the list, no input group.
    expect(document.querySelector('[data-slot="infinite-select-input-group"]')).toBeNull()
    expect(screen.getAllByRole('option')).toHaveLength(2)
  })
})
