import type { ReactElement } from 'react'
import type { InfiniteComboboxChildren, InfiniteComboboxProps } from '../src/components/infinite-combobox'
import type { InfiniteSelectOption } from '../src/components/infinite-select'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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
  triggerId?: string
  children?: InfiniteComboboxChildren<Person>
}

function Harness({ isDisabled, popoverProps, triggerId, children }: HarnessProps): ReactElement {
  const state = useInfiniteComboboxState({})
  return (
    <InfiniteCombobox<Person>
      getOption={getOption}
      isDisabled={isDisabled}
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

describe('infiniteCombobox label channel', () => {
  // React Aria hands the trigger a generated id no caller can predict, so
  // `triggerId` is the only way a `FieldLabel htmlFor` gets something to aim at.
  it('puts triggerId on the caller\'s own element', () => {
    render(<Harness triggerId="composer" />)
    expect(screen.getByRole('button', { name: '选择器' }).id).toBe('composer')
  })

  it('leaves an id the trigger brought itself alone', () => {
    render(<Harness triggerId="composer"><Button id="mine">选择器</Button></Harness>)
    expect(screen.getByRole('button', { name: '选择器' }).id).toBe('mine')
  })

  // A click forwarded from the label carries the coordinates of the click on the
  // *label*, so it reports a point outside the trigger's box — that is what the
  // wiring keys off. jsdom has no layout, so the box is stubbed here; the
  // end-to-end behaviour is verified in a real browser.
  function forwardedClick(x: number, y: number): void {
    const trigger = screen.getByRole('button', { name: '选择器' })
    vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      top: 100,
      right: 200,
      bottom: 150,
      x: 100,
      y: 100,
      width: 100,
      height: 50,
      toJSON: () => ({}),
    })
    fireEvent.click(trigger, { clientX: x, clientY: y, detail: 1 })
  }

  it('opens for a click forwarded from the label', async () => {
    render(<Harness triggerId="composer" />)
    forwardedClick(150, 60) // 落在触发器上方 —— 标签所在的位置
    expect(await screen.findByRole('option', { name: 'Alice' })).not.toBeNull()
  })

  it('leaves a press on the trigger itself to React Aria', () => {
    render(<Harness triggerId="composer" />)
    forwardedClick(150, 120) // 落在触发器盒子里
    expect(screen.queryByRole('option', { name: 'Alice' })).toBeNull()
  })

  it('stays shut when disabled', () => {
    render(<Harness isDisabled triggerId="composer" />)
    forwardedClick(150, 60)
    expect(screen.queryByRole('option', { name: 'Alice' })).toBeNull()
  })

  // The popover is non-modal, so a second click on the label really reaches it.
  // Left to React Aria that reads as an outside interaction and dismisses, and
  // then the forwarded click reopens what was just closed — the label could open
  // the popover but never close it. Pressing a `<label for>` is pressing the
  // trigger, so it is excluded from "outside".
  //
  // The exclusion is asserted through the caller's own predicate, which the
  // wiring only reaches once it has decided the element really is outside. The
  // full round trip cannot be reproduced here: jsdom forwards a label click with
  // `detail === 0`, which `usePress` accepts as a virtual press, where a browser
  // sends `detail === 1` and ignores it. That half is browser-verified.
  function renderLabelled(shouldCloseOnInteractOutside: (element: Element) => boolean): ReactElement {
    return (
      <>
        <label htmlFor="composer">作曲家</label>
        <p>别处</p>
        <Harness popoverProps={{ shouldCloseOnInteractOutside }} triggerId="composer" />
      </>
    )
  }

  it('never reaches the outside check for its own label', async () => {
    const isOutside = vi.fn(() => true)
    render(renderLabelled(isOutside))
    await userEvent.click(screen.getByRole('button', { name: '作曲家' }))
    expect(await screen.findByRole('option', { name: 'Alice' })).not.toBeNull()

    await userEvent.click(screen.getByText('作曲家'))
    expect(isOutside).not.toHaveBeenCalled()
  })

  it('still runs the outside check, and dismisses, for anything else', async () => {
    const isOutside = vi.fn(() => true)
    render(renderLabelled(isOutside))
    await userEvent.click(screen.getByRole('button', { name: '作曲家' }))
    expect(await screen.findByRole('option', { name: 'Alice' })).not.toBeNull()

    await userEvent.click(screen.getByText('别处'))
    expect(isOutside).toHaveBeenCalled()
    await waitFor(() => expect(screen.queryByRole('option', { name: 'Alice' })).toBeNull())
  })

  it('still runs an onClickCapture the trigger brought itself', () => {
    const spy = vi.fn()
    render(<Harness triggerId="composer"><Button onClickCapture={spy}>选择器</Button></Harness>)
    forwardedClick(150, 60)
    expect(spy).toHaveBeenCalledTimes(1)
  })
})
