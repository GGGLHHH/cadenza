import type { ReactElement } from 'react'
import type { InfiniteComboboxChildren, InfiniteComboboxProps } from '../src/components/infinite-combobox'
import type { InfiniteSelectOption } from '../src/components/infinite-select'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { Button } from '../src'
import { InfiniteCombobox, useInfiniteComboboxState } from '../src/components/infinite-combobox'
import { InfiniteSelectCancel, InfiniteSelectClose, InfiniteSelectFooter } from '../src/components/infinite-select'

beforeAll(() => {
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
  disabled?: boolean
  popoverProps?: InfiniteComboboxProps<Person>['popoverProps']
  triggerId?: string
  children?: InfiniteComboboxChildren<Person>
}

function Harness({ disabled, popoverProps, triggerId, children }: HarnessProps): ReactElement {
  const state = useInfiniteComboboxState({})
  return (
    <InfiniteCombobox<Person>
      getOption={getOption}
      disabled={disabled}
      list={list}
      popoverProps={popoverProps}
      state={state}
      triggerId={triggerId}
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

  it('disables the trigger element itself when disabled — not just the open handler', async () => {
    // The trigger is the caller's element, so Base UI's Popover.Trigger has to
    // carry `disabled` down onto it — otherwise it looks live and silently
    // swallows presses while the open handler refuses.
    render(<Harness disabled />)
    const trigger = screen.getByRole('button', { name: '选择器' })
    expect(trigger).toHaveProperty('disabled', true)
    await userEvent.click(trigger)
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('hands disabled to a function trigger for summary rendering', () => {
    let seen: boolean | undefined
    render(
      <Harness disabled>
        {({ disabled }) => {
          seen = disabled
          return <Button>选择器</Button>
        }}
      </Harness>,
    )
    expect(seen).toBe(true)
  })

  it('passes popoverProps to the popover shell, with the wiring written after the spread', async () => {
    render(<Harness popoverProps={{ side: 'top' }} />)
    await userEvent.click(screen.getByRole('button', { name: '选择器' }))
    const content = document.querySelector('[data-slot="infinite-combobox-content"]')
    expect(content).not.toBeNull()
    expect(content?.getAttribute('data-side')).toBe('top')
  })
})

describe('infiniteCombobox label channel', () => {
  // Base UI hands the trigger a generated id no caller can predict, so
  // `triggerId` is the only way a `FieldLabel htmlFor` gets something to aim at.
  it('puts triggerId on the caller\'s own element', () => {
    render(<Harness triggerId="composer" />)
    expect(screen.getByRole('button', { name: '选择器' }).id).toBe('composer')
  })

  it('leaves an id the trigger brought itself alone', () => {
    render(<Harness triggerId="composer"><Button id="mine">选择器</Button></Harness>)
    expect(screen.getByRole('button', { name: '选择器' }).id).toBe('mine')
  })

  function renderLabelled(): ReactElement {
    return (
      <>
        <label htmlFor="composer">作曲家</label>
        <p>别处</p>
        <Harness triggerId="composer" />
      </>
    )
  }

  it('opens for a click forwarded from the label', async () => {
    const user = userEvent.setup()
    render(renderLabelled())
    // The trigger is a real button now, so the browser forwards the label's
    // click to it and Base UI's Popover.Trigger toggles — no seam-side
    // coordinate sniffing, which is what the React Aria build needed.
    await user.click(screen.getByText('作曲家'))
    expect(await screen.findByRole('option', { name: 'Alice' })).not.toBeNull()
  })

  // A second click on the label reaches the page (the popover is non-modal),
  // which Base UI would otherwise read as an outside press and dismiss on
  // `pointerdown` — only for the forwarded `click` to reopen it a moment later,
  // so the label could open the popover but never close it.
  it('closes on a second click of its own label instead of flickering back open', async () => {
    const user = userEvent.setup()
    render(renderLabelled())
    await user.click(screen.getByText('作曲家'))
    expect(await screen.findByRole('option', { name: 'Alice' })).not.toBeNull()

    await user.click(screen.getByText('作曲家'))
    await waitFor(() => expect(screen.queryByRole('option', { name: 'Alice' })).toBeNull())
  })

  it('still dismisses for a press anywhere else', async () => {
    const user = userEvent.setup()
    render(renderLabelled())
    await user.click(screen.getByText('作曲家'))
    expect(await screen.findByRole('option', { name: 'Alice' })).not.toBeNull()

    await user.click(screen.getByText('别处'))
    await waitFor(() => expect(screen.queryByRole('option', { name: 'Alice' })).toBeNull())
  })

  it('stays shut when disabled', async () => {
    const user = userEvent.setup()
    render(<Harness disabled triggerId="composer" />)
    await user.click(screen.getByRole('button', { name: '选择器' }))
    expect(screen.queryByRole('option', { name: 'Alice' })).toBeNull()
  })
})

describe('infiniteCombobox commitOnClose draft', () => {
  function DraftHarness({ onCommit }: { onCommit: (ids: string[]) => void }): ReactElement {
    const state = useInfiniteComboboxState({})
    const [ids, setIds] = useState<string[]>(['a'])
    return (
      <InfiniteCombobox<Person>
        commitOnClose
        getOption={getOption}
        list={list}
        onValueChange={(_items, nextIds) => {
          setIds(nextIds)
          onCommit(nextIds)
        }}
        selectionMode="multiple"
        state={state}
        value={ids}
      >
        <Button>选择器</Button>
        <InfiniteSelectFooter>
          <InfiniteSelectCancel>取消</InfiniteSelectCancel>
          <InfiniteSelectClose>确定</InfiniteSelectClose>
        </InfiniteSelectFooter>
      </InfiniteCombobox>
    )
  }

  it('commits the draft on 确定', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()
    render(<DraftHarness onCommit={onCommit} />)

    await user.click(screen.getByRole('button', { name: '选择器' }))
    await user.click(await screen.findByRole('option', { name: 'Bob' }))
    expect(onCommit).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: '确定' }))
    await waitFor(() => expect(onCommit).toHaveBeenCalledWith(['a', 'b']))
  })

  // The bug cancel exists for: `eventDetails.cancel()` on the commit stopped the
  // write but left the draft holding the rejected ticks, so the next open showed
  // them again. Reopening is the assertion that matters.
  it('throws the draft away on 取消, and the next open is back to the applied selection', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()
    render(<DraftHarness onCommit={onCommit} />)

    await user.click(screen.getByRole('button', { name: '选择器' }))
    await user.click(await screen.findByRole('option', { name: 'Bob' }))
    await user.click(screen.getByRole('button', { name: '取消' }))
    await waitFor(() => expect(screen.queryByRole('option', { name: 'Bob' })).toBeNull())
    expect(onCommit).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: '选择器' }))
    expect(await screen.findByRole('option', { name: 'Bob', selected: false })).not.toBeNull()
    expect(screen.getByRole('option', { name: 'Alice', selected: true })).not.toBeNull()
  })
})
