import type { ReactElement } from 'react'
import type { DataTableColumn } from '../src/components/data-table'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import {
  DataTable,
  DataTableEmpty,
  DataTableError,
  DataTableLoadingMore,
  DataTableLoadingOverlay,
  DataTableRetry,
} from '../src/components/data-table'

beforeAll(() => {
  // Base UI's ScrollArea polls viewport.getAnimations(), absent in jsdom.
  Element.prototype.getAnimations = () => []
  // TanStack Virtual sizes its window from offsetWidth/offsetHeight, which are
  // always 0 in layout-less jsdom — every row would be culled. Pretend to be a
  // viewport.
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get: () => 400,
  })
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get: () => 800,
  })
  // TanStack's measureElement falls back to getBoundingClientRect (jsdom has no
  // ResizeObserver); jsdom's all-zero rect would collapse every measured row.
  Element.prototype.getBoundingClientRect = () =>
    ({ x: 0, y: 0, top: 0, left: 0, bottom: 40, right: 800, width: 800, height: 40, toJSON: () => ({}) })
})

interface Person {
  id: string
  name: string
  role: string
}

const people: Person[] = [
  { id: 'p1', name: 'Bach', role: 'Composer' },
  { id: 'p2', name: 'Argerich', role: 'Pianist' },
  { id: 'p3', name: 'Karajan', role: 'Conductor' },
]

const columns: DataTableColumn<Person>[] = [
  { id: 'name', header: 'Name', cell: person => person.name, rowHeader: true },
  { id: 'role', header: 'Role', cell: person => person.role },
]

// State slots: context-driven, self-rendering per table state. The base has
// zero copy — all text below comes from these children.
const slots = (
  <>
    <DataTableEmpty>No rows</DataTableEmpty>
    <DataTableError>
      Failed
      <DataTableRetry>Retry</DataTableRetry>
    </DataTableError>
  </>
)

describe('dataTable rendering', () => {
  it('renders header cells and body rows from column defs', () => {
    render(<DataTable aria-label="People" columns={columns} items={people} />)
    // A plain <table>, not a grid: arrow-key cell navigation went away with
    // React Aria, and Tab through the focusable controls is what remains.
    expect(screen.getByRole('table', { name: 'People' })).not.toBeNull()
    expect(screen.getByRole('columnheader', { name: 'Name' })).not.toBeNull()
    expect(screen.getByText('Argerich')).not.toBeNull()
    expect(screen.getByText('Conductor')).not.toBeNull()
    // header row + 3 data rows
    expect(screen.getAllByRole('row')).toHaveLength(4)
  })

  it('puts no second scroll container between the sticky header and the ScrollArea', () => {
    // `position: sticky` resolves against the NEAREST scrolling ancestor. The
    // vendored `Table` wraps itself in its own `overflow-x-auto` div, which has
    // no height cap and therefore never scrolls — sticking to it means the
    // header scrolls away with everything else. So the seam renders a bare
    // <table> and lets the ScrollArea viewport own both axes.
    render(<DataTable aria-label="People" columns={columns} items={people} />)
    const grid = document.querySelector('[data-slot="data-table-grid"]')!
    expect(grid.tagName).toBe('TABLE')
    expect(document.querySelector('[data-slot="table-container"]')).toBeNull()
    const viewport = document.querySelector('[data-slot="scroll-area-viewport"]')
    expect(viewport?.contains(grid)).toBe(true)
  })

  it('caps the row area by default, which is what gives the sticky header a scrollport', () => {
    render(<DataTable aria-label="People" columns={columns} items={people} />)
    const viewport = document.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]')
    expect(viewport?.style.maxHeight).toBe('480px')
  })

  it('drops the cap for maxHeight={Infinity} — the page scrolls the table instead', () => {
    render(
      <DataTable
        aria-label="People"
        columns={columns}
        items={people}
        maxHeight={Number.POSITIVE_INFINITY}
      />,
    )
    const viewport = document.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]')
    expect(viewport?.style.maxHeight).toBe('')
  })

  it('hands the row index to cell renderers', () => {
    const indexColumns: DataTableColumn<Person>[] = [
      { id: 'rank', header: '#', cell: (_person, index) => `#${index}`, rowHeader: true },
    ]
    render(<DataTable aria-label="People" columns={indexColumns} items={people} />)
    expect(screen.getByText('#0')).not.toBeNull()
    expect(screen.getByText('#2')).not.toBeNull()
  })
})

describe('dataTable state slots', () => {
  it('shows the empty slot when there are no rows (and nothing else)', () => {
    render(
      <DataTable aria-label="People" columns={columns} items={[]}>
        {slots}
      </DataTable>,
    )
    expect(screen.getByText('No rows')).not.toBeNull()
    expect(screen.queryByText('Failed')).toBeNull()
  })

  it('frosts a min-height blank while first-page loading — one loading look, no copy', () => {
    render(
      <DataTable aria-label="People" columns={columns} isLoading items={[]}>
        {slots}
      </DataTable>,
    )
    expect(screen.queryByText('No rows')).toBeNull()
    const card = document.querySelector('[data-slot="data-table"]')
    expect(card?.className).toContain('min-block-32')
    expect(
      card?.querySelector('[data-slot="loading-overlay"]')?.getAttribute('data-loading'),
    ).toBe('')
  })

  it('keeps loaded rows under a frosted overlay on refresh — never the loading slot', () => {
    // isLoading with rows on screen (react-query placeholderData) used to
    // blank the table; now the rows stay put and frost over.
    render(
      <DataTable aria-label="People" columns={columns} isLoading items={people}>
        {slots}
      </DataTable>,
    )
    expect(screen.getByText('Bach')).not.toBeNull()
    const overlay = document.querySelector('[data-slot="loading-overlay"]')
    expect(overlay?.getAttribute('data-loading')).toBe('')
  })

  it('lifts a composed LoadingOverlay part onto the card, keeping the z order', () => {
    render(
      <DataTable aria-label="People" columns={columns} isLoading items={people}>
        <DataTableLoadingOverlay className="backdrop-blur-lg">
          <span data-testid="brand">品牌加载</span>
        </DataTableLoadingOverlay>
      </DataTable>,
    )
    const overlay = document.querySelector('[data-slot="loading-overlay"]')
    expect(overlay?.className).toContain('backdrop-blur-lg')
    // The card's z-30 (clearing pinned cells) survives a caller className.
    expect(overlay?.className).toContain('z-30')
    expect(screen.getByTestId('brand')).not.toBeNull()
  })

  it('shows the error slot with a retry button wired to onRetry', async () => {
    const onRetry = vi.fn()
    render(
      <DataTable aria-label="People" columns={columns} isError items={people} onRetry={onRetry}>
        {slots}
      </DataTable>,
    )
    expect(screen.getByText('Failed')).not.toBeNull()
    expect(screen.queryByText('Bach')).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('retry slot renders nothing when onRetry is absent', () => {
    render(
      <DataTable aria-label="People" columns={columns} isError items={[]}>
        {slots}
      </DataTable>,
    )
    expect(screen.getByText('Failed')).not.toBeNull()
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull()
  })
})

describe('dataTable interactions', () => {
  it('fires onSortChange when a sortable header is pressed', async () => {
    const onSortChange = vi.fn()
    const sortable: DataTableColumn<Person>[] = [
      { ...columns[0], sortable: true },
      columns[1],
    ]
    render(
      <DataTable
        aria-label="People"
        columns={sortable}
        items={people}
        onSortChange={onSortChange}
      />,
    )
    // The sort affordance is a real button inside the header cell — reachable
    // by Tab and announceable, with aria-sort on the cell saying which way.
    await userEvent.click(screen.getByRole('button', { name: 'Name' }))
    expect(onSortChange).toHaveBeenCalledWith(
      { column: 'name', direction: 'ascending' },
      expect.objectContaining({ reason: 'sort-press' }),
    )
    expect(screen.getByRole('columnheader', { name: 'Name' }).getAttribute('aria-sort')).toBe('none')
  })

  it('hands the row item (not the key) to onRowAction', async () => {
    const onRowAction = vi.fn()
    render(
      <DataTable aria-label="People" columns={columns} items={people} onRowAction={onRowAction} />,
    )
    await userEvent.click(screen.getByRole('row', { name: /Argerich/ }))
    expect(onRowAction).toHaveBeenCalledWith(people[1])
  })

  it('reports selection changes through onSelectionChange', async () => {
    const onSelectionChange = vi.fn()
    render(
      <DataTable
        aria-label="People"
        columns={columns}
        items={people}
        onSelectionChange={onSelectionChange}
        selectionMode="multiple"
      />,
    )
    // With no checkbox column and no row action, a row click is the selection
    // gesture — the same fallback React Aria had.
    await userEvent.click(screen.getByRole('row', { name: /Bach/ }))
    expect(onSelectionChange).toHaveBeenCalledOnce()
    const selection = onSelectionChange.mock.calls[0][0] as Set<string>
    expect([...selection]).toEqual(['p1'])
  })

  it('pinned columns: sticky offsets accumulate from each edge', () => {
    const pinnedColumns: DataTableColumn<Person>[] = [
      { id: 'a', header: 'A', cell: person => person.name, rowHeader: true, width: 100, pinned: 'start' },
      { id: 'b', header: 'B', cell: person => person.role, width: 120, pinned: 'start' },
      { id: 'c', header: 'C', cell: person => person.id },
      { id: 'd', header: 'D', cell: person => person.id, width: 90, pinned: 'end' },
    ]
    const { container } = render(
      <DataTable aria-label="People" columns={pinnedColumns} items={people.slice(0, 1)} />,
    )
    const cells = [...container.querySelectorAll<HTMLElement>('[data-slot=data-table-row] [data-slot=table-cell], [data-slot=data-table-row] th')]
    expect(cells).toHaveLength(4)
    expect(cells[0].style.position).toBe('sticky')
    expect(cells[0].style.insetInlineStart).toBe('0px')
    expect(cells[1].style.insetInlineStart).toBe('100px')
    expect(cells[2].style.position).toBe('')
    expect(cells[3].style.insetInlineEnd).toBe('0px')
    // opaque background so scrolled content cannot show through
    expect(cells[0].className).toContain('bg-card')
  })

  it('virtualized: renders only a window of a large set, table stays native', () => {
    const many: Person[] = Array.from({ length: 1000 }, (_, index) => ({
      id: `p${index}`,
      name: `Person ${index}`,
      role: 'Composer',
    }))
    const { container } = render(
      <DataTable aria-label="People" columns={columns} items={many} maxHeight={400} virtualized />,
    )
    expect(container.querySelector('table')).not.toBeNull()
    const rendered = container.querySelectorAll('[data-slot=data-table-row]').length
    expect(rendered).toBeGreaterThan(0)
    expect(rendered).toBeLessThan(60)
  })

  it('dynamicRowHeight: rows keep natural height and carry the measure wiring', () => {
    const many: Person[] = Array.from({ length: 1000 }, (_, index) => ({
      id: `p${index}`,
      name: `Person ${index}`,
      role: 'Composer',
    }))
    const { container } = render(
      <DataTable
        aria-label="People"
        columns={columns}
        dynamicRowHeight
        items={many}
        maxHeight={400}
        virtualized
      />,
    )
    const rows = [...container.querySelectorAll<HTMLElement>('[data-slot=data-table-row]')]
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.length).toBeLessThan(60)
    // no fixed height pinned on the row; index attribute feeds measureElement
    expect(rows[0].style.blockSize).toBe('')
    expect(rows[0].getAttribute('data-index')).toBe('0')
  })

  it('virtualized + infinite scroll: window stays bounded and the tail indicator renders', () => {
    const many: Person[] = Array.from({ length: 200 }, (_, index) => ({
      id: `p${index}`,
      name: `Person ${index}`,
      role: 'Composer',
    }))
    render(
      <DataTable
        aria-label="People"
        columns={columns}
        hasNextPage
        isFetchingNextPage
        items={many}
        maxHeight={400}
        onLoadMore={() => {}}
        virtualized
      >
        <DataTableLoadingMore>More…</DataTableLoadingMore>
      </DataTable>,
    )
    expect(screen.getByText('More…')).not.toBeNull()
    expect(screen.getAllByRole('row').length).toBeLessThan(60)
  })

  it('selectionColumn: row checkboxes plus a select-all header, row header stays on data', async () => {
    const onSelectionChange = vi.fn()
    render(
      <DataTable
        aria-label="People"
        columns={columns}
        items={people}
        onSelectionChange={onSelectionChange}
        selectionColumn
        selectionMode="multiple"
      />,
    )
    // 3 row checkboxes + 1 select-all in the header
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(4)
    // the synthesized column never becomes the row header
    expect(screen.getByRole('rowheader', { name: 'Bach' })).not.toBeNull()

    await userEvent.click(checkboxes[1])
    expect([...onSelectionChange.mock.calls[0][0] as Set<string>]).toEqual(['p1'])

    await userEvent.click(checkboxes[0])
    expect(onSelectionChange.mock.lastCall![0]).toBe('all')
  })

  it('selectionColumn: no header checkbox in single mode, ignored without selectionMode', () => {
    const { unmount } = render(
      <DataTable
        aria-label="People"
        columns={columns}
        items={people}
        selectionColumn
        selectionMode="single"
      />,
    )
    expect(screen.getAllByRole('checkbox')).toHaveLength(3)
    unmount()

    render(
      <DataTable aria-label="People" columns={columns} items={people} selectionColumn />,
    )
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0)
  })

  it('value/onChange: toggling a row reports items and ids', async () => {
    const onChange = vi.fn()
    render(
      <DataTable
        aria-label="People"
        columns={columns}
        items={people}
        onValueChange={onChange}
        selectionColumn
        selectionMode="multiple"
        value={[]}
      />,
    )
    await userEvent.click(screen.getAllByRole('checkbox')[1])
    expect(onChange).toHaveBeenCalledWith(
      [people[0]],
      ['p1'],
      expect.objectContaining({ reason: 'item-press' }),
    )
  })

  it('cross-page archive: select-all unions loaded rows, keeps unloaded ids', async () => {
    const onChange = vi.fn()
    render(
      <DataTable
        aria-label="People"
        columns={columns}
        items={people}
        onValueChange={onChange}
        selectionColumn
        selectionMode="multiple"
        value={['ghost-from-other-page']}
      />,
    )
    await userEvent.click(screen.getAllByRole('checkbox')[0])
    const [items, ids] = onChange.mock.lastCall! as [Person[], string[]]
    expect(ids).toEqual(['ghost-from-other-page', 'p1', 'p2', 'p3'])
    // items echo loaded objects only — the ghost has no object to echo
    expect(items).toEqual(people)
  })

  it('cross-page archive: header deselect-all removes loaded rows only', async () => {
    const onChange = vi.fn()
    render(
      <DataTable
        aria-label="People"
        columns={columns}
        items={people}
        onValueChange={onChange}
        selectionColumn
        selectionMode="multiple"
        value={['ghost-from-other-page', 'p1', 'p2', 'p3']}
      />,
    )
    // all loaded rows selected → header checkbox unchecks everything loaded
    await userEvent.click(screen.getAllByRole('checkbox')[0])
    const [, ids] = onChange.mock.lastCall! as [Person[], string[]]
    expect(ids).toEqual(['ghost-from-other-page'])
  })

  it('cross-page archive: item objects are cached across page flips', async () => {
    const pageOne = people
    const pageTwo: Person[] = [
      { id: 'p4', name: 'Mahler', role: 'Composer' },
      { id: 'p5', name: 'Ravel', role: 'Pianist' },
    ]
    let latest: { items: Person[], ids: string[] } = { items: [], ids: [] }
    function Harness({ items, value }: { items: Person[], value: string[] }): ReactElement {
      return (
        <DataTable
          aria-label="People"
          columns={columns}
          items={items}
          onValueChange={(nextItems, nextIds) => {
            latest = { items: nextItems, ids: nextIds }
          }}
          selectionColumn
          selectionMode="multiple"
          value={value}
        />
      )
    }
    const { rerender } = render(<Harness items={pageOne} value={[]} />)
    await userEvent.click(screen.getAllByRole('checkbox')[1])
    expect(latest.ids).toEqual(['p1'])

    // flip to page 2 with the archive kept, then select a page-2 row
    rerender(<Harness items={pageTwo} value={latest.ids} />)
    await userEvent.click(screen.getAllByRole('checkbox')[1])
    expect(latest.ids).toEqual(['p1', 'p4'])
    // page 1's object came from the cache — it is not in the current items
    expect(latest.items).toEqual([pageOne[0], pageTwo[0]])
  })

  it('single mode value/onChange: reports the item, then null on toggle-off', async () => {
    // `null`, not `undefined`: undefined belongs to "uncontrolled", so the
    // emitted empty value is null — same convention as Base UI's Select.
    const onChange = vi.fn()
    render(
      <DataTable
        aria-label="People"
        columns={columns}
        items={people}
        onValueChange={onChange}
        selectionColumn
        selectionMode="single"
      />,
    )
    await userEvent.click(screen.getAllByRole('checkbox')[0])
    expect(onChange).toHaveBeenCalledWith(people[0], expect.objectContaining({ reason: 'item-press' }))
    await userEvent.click(screen.getAllByRole('checkbox')[0])
    expect(onChange).toHaveBeenLastCalledWith(null, expect.anything())
  })

  // jsdom has no layout, so scrollTop is a no-op there: give the viewport a
  // real accessor and watch what the table writes to it.
  const trackScrollTop = (container: HTMLElement, initial: number): { get: () => number } => {
    const viewport = container.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]')
    if (viewport === null)
      throw new Error('no viewport')
    let scrollTop = initial
    Object.defineProperty(viewport, 'scrollTop', {
      configurable: true,
      get: () => scrollTop,
      set: (next: number) => {
        scrollTop = next
      },
    })
    return { get: () => scrollTop }
  }

  it('page turn: a new batch of rows scrolls the body back to the top', () => {
    const { container, rerender } = render(
      <DataTable aria-label="People" columns={columns} items={people} />,
    )
    const scroll = trackScrollTop(container, 240)

    const nextPage: Person[] = [
      { id: 'p4', name: 'Satie', role: 'Composer' },
      { id: 'p5', name: 'Ravel', role: 'Composer' },
    ]
    rerender(<DataTable aria-label="People" columns={columns} items={nextPage} />)
    expect(scroll.get()).toBe(0)
  })

  it('appending the next page keeps the scroll offset — only the first row tells them apart', () => {
    const { container, rerender } = render(
      <DataTable aria-label="People" columns={columns} items={people} />,
    )
    const scroll = trackScrollTop(container, 240)

    // Infinite scroll appends; the first row is unchanged, so the offset stays.
    rerender(
      <DataTable
        aria-label="People"
        columns={columns}
        items={[...people, { id: 'p4', name: 'Satie', role: 'Composer' }]}
      />,
    )
    expect(scroll.get()).toBe(240)

    // Same rows again (a refresh keeping its placeholder data): also no reset.
    rerender(<DataTable aria-label="People" columns={columns} isLoading items={[...people]} />)
    expect(scroll.get()).toBe(240)
  })

  // The row click is the only selection gesture with `selectionColumn` off (the
  // default), so it has to answer the keyboard too.
  it('a clickable row is reachable and activatable from the keyboard', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <DataTable
        aria-label="People"
        columns={columns}
        items={people}
        selectionMode="multiple"
        value={[]}
        onValueChange={onValueChange}
      />,
    )
    const row = document.querySelector<HTMLElement>('[data-slot="data-table-row"]')!
    expect(row.tabIndex).toBe(0)
    row.focus()
    await user.keyboard('{Enter}')
    expect(onValueChange).toHaveBeenLastCalledWith(
      [people[0]],
      ['p1'],
      expect.objectContaining({ reason: 'item-press' }),
    )
  })

  it('the load-more sentinel keeps its observer ref when a composed part brings one', () => {
    const composed = vi.fn()
    render(
      <DataTable
        aria-label="People"
        columns={columns}
        hasNextPage
        items={people}
        onLoadMore={() => {}}
      >
        <DataTableLoadingMore ref={composed} />
      </DataTable>,
    )
    const sentinel = document.querySelector('[data-slot="data-table-load-more"]')
    // The caller's ref is honoured…
    expect(composed).toHaveBeenCalledWith(sentinel)
    // …and the row is still marked as a non-data tail row.
    expect(sentinel?.getAttribute('aria-hidden')).toBe('true')
  })

  it('renders the loading-more indicator at the tail while fetching the next page', () => {
    render(
      <DataTable
        aria-label="People"
        columns={columns}
        hasNextPage
        isFetchingNextPage
        items={people}
        onLoadMore={() => {}}
      >
        <DataTableLoadingMore>More…</DataTableLoadingMore>
      </DataTable>,
    )
    expect(screen.getByText('More…')).not.toBeNull()
  })
})
