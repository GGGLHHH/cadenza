import type { ReactElement } from 'react'
import type { InfiniteComboboxChildren, InfiniteComboboxProps } from '../src/components/infinite-combobox'
import type { InfiniteSelectOption } from '../src/components/infinite-select'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { Button } from '../src'
import { InfiniteCombobox, useInfiniteComboboxState } from '../src/components/infinite-combobox'

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
})

interface Person { id: string, label: string }

const people: Person[] = [
  { id: 'a', label: 'Alice' },
  { id: 'b', label: 'Bob' },
]

const list = {
  items: people,
  isLoading: false,
  isFetchingNextPage: false,
  hasNextPage: false,
  isError: false,
  onLoadMore: (): void => {},
  onRetry: (): void => {},
}

function getOption(person: Person): InfiniteSelectOption {
  return { id: person.id, label: person.label }
}

interface HarnessProps {
  isDisabled?: boolean
  popoverProps?: InfiniteComboboxProps<Person>['popoverProps']
  children?: InfiniteComboboxChildren<Person>
}

function Harness({ isDisabled, popoverProps, children }: HarnessProps): ReactElement {
  const state = useInfiniteComboboxState({})
  return (
    <InfiniteCombobox<Person>
      getOption={getOption}
      isDisabled={isDisabled}
      list={list}
      popoverProps={popoverProps}
      state={state}
    >
      {children ?? <Button>选择器</Button>}
    </InfiniteCombobox>
  )
}

describe('infiniteCombobox trigger and popover', () => {
  it('opens on press and shows the option list', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: '选择器' }))
    expect(await screen.findByRole('option', { name: 'Alice' })).not.toBeNull()
  })

  it('disables the trigger element itself when isDisabled — not just the open handler', async () => {
    // The trigger is the caller's element; without the cloned isDisabled it
    // would look live and silently swallow presses.
    render(<Harness isDisabled />)
    const trigger = screen.getByRole('button', { name: '选择器' })
    expect(trigger).toHaveProperty('disabled', true)
    await userEvent.click(trigger)
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('hands isDisabled to a function trigger for summary rendering', () => {
    let seen: boolean | undefined
    render(
      <Harness isDisabled>
        {({ isDisabled }) => {
          seen = isDisabled
          return <Button>选择器</Button>
        }}
      </Harness>,
    )
    expect(seen).toBe(true)
  })

  it('passes popoverProps to the popover shell, with the wiring written after the spread', async () => {
    render(<Harness popoverProps={{ placement: 'top' }} />)
    await userEvent.click(screen.getByRole('button', { name: '选择器' }))
    const content = document.querySelector('[data-slot="infinite-combobox-content"]')
    expect(content).not.toBeNull()
    expect(content?.getAttribute('data-placement')).toBe('top')
  })
})
