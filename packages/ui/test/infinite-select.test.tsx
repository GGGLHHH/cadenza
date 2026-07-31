import type { InfiniteSelectOption } from '../src/components/infinite-select'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import {
  InfiniteSelect,
  InfiniteSelectEmpty,
  InfiniteSelectError,
  InfiniteSelectLoading,

  InfiniteSelectRetry,
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
})

function getOption(item: { id: string, label: string }): InfiniteSelectOption {
  return {
    id: item.id,
    label: item.label,
  }
}

// State slots: context-driven, self-rendering per panel state. The base has
// zero copy — all text below comes from these children.
const slots = (
  <>
    <InfiniteSelectEmpty>No results</InfiniteSelectEmpty>
    <InfiniteSelectLoading>Loading</InfiniteSelectLoading>
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
    expect(screen.queryByText('Loading')).toBeNull()
    expect(screen.queryByText('Failed')).toBeNull()
  })

  it('shows the loading slot (not empty) while first-page loading', () => {
    render(
      <InfiniteSelect getOption={getOption} isLoading items={[]}>
        {slots}
      </InfiniteSelect>,
    )
    expect(screen.getByText('Loading')).not.toBeNull()
    expect(screen.queryByText('No results')).toBeNull()
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
    expect(screen.queryByText('Loading')).toBeNull()
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
    render(<InfiniteSelect getOption={getOption} items={items} />)
    expect(screen.getByRole('listbox')).not.toBeNull()
    expect(screen.getAllByRole('option')).toHaveLength(2)
  })

  it('single: reports the picked item, then undefined on toggle-off', async () => {
    const onChange = vi.fn()
    render(<InfiniteSelect getOption={getOption} items={items} onChange={onChange} />)

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
        multiple
        onChange={onChange}
        value={['x']}
      />,
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
      <InfiniteSelect getOption={getOption} items={items} value="a" />,
    )
    expect(screen.getByRole('option', { name: 'Alice', selected: true })).not.toBeNull()

    rerender(<InfiniteSelect getOption={getOption} items={items} value={undefined} />)
    expect(screen.getByRole('option', { name: 'Alice', selected: false })).not.toBeNull()
  })

  it('multi: marks selected options with aria-selected', () => {
    render(
      <InfiniteSelect getOption={getOption} items={items} multiple value={['b']} />,
    )
    expect(screen.getByRole('option', { name: 'Bob', selected: true })).not.toBeNull()
    expect(screen.getByRole('option', { name: 'Alice', selected: false })).not.toBeNull()
  })
})
