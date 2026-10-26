import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { Button, RadioGroup, RadioGroupItem, Switch, Toggle } from '../src'

// A replayed press is a non-bubbling pointerdown on the pressed element, then
// a pointerup on `window` `MIN_PRESS` later — Motion's own press gesture, so
// animate-ui plays its press itself. Record those, nothing else.
let replays: { target: EventTarget | null, type: string }[] = []
beforeEach(() => {
  // jsdom's window dispatches through its own method, not EventTarget's.
  for (const host of [EventTarget.prototype, window]) {
    // eslint-disable-next-line ts/unbound-method -- re-bound with `call` below
    const original = host.dispatchEvent
    vi.spyOn(host, 'dispatchEvent').mockImplementation(function (this: EventTarget, event) {
      if (event instanceof PointerEvent && event.pointerId === -1)
        replays.push({ target: this, type: event.type })
      return original.call(this, event)
    })
  }
})
afterEach(() => {
  vi.restoreAllMocks()
  replays = []
})

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

// Real timers: Motion hands tap callbacks to its next animation frame, and a
// fake clock swapped out between tests strands that frame.
async function press(element: Element, heldMs: number): Promise<void> {
  fireEvent.pointerDown(element, { button: 0, isPrimary: true, pointerId: 1 })
  // A tap releases with no yield in between, as tap-to-click does: a yielded
  // tick on a loaded machine can itself outlast the 100ms and make a "hold".
  if (heldMs > 0)
    await sleep(heldMs)
  fireEvent.pointerUp(element, { button: 0, isPrimary: true, pointerId: 1 })
  await sleep(50)
}

function replayed(element: Element): { target: EventTarget | null, type: string }[] {
  return [{ target: element, type: 'pointerdown' }, { target: window, type: 'pointerup' }]
}

it('replays a tap too short for animate-ui\'s spring as a full-length press', async () => {
  // A trackpad tap-to-click releases within a frame: animate-ui's whileTap
  // turns back before it has moved, so the press is played again, held.
  render(<Button>tap</Button>)
  const button = screen.getByRole('button', { name: 'tap' })
  await press(button, 0)
  await waitFor(() => expect(replays).toEqual(replayed(button)))
})

it('leaves a held press to animate-ui alone', async () => {
  render(<Button>hold</Button>)
  await press(screen.getByRole('button', { name: 'hold' }), 150)
  await sleep(150)
  expect(replays).toEqual([])
})

it('does not press while disabled', async () => {
  render(<Button disabled>off</Button>)
  await press(screen.getByRole('button', { name: 'off' }), 0)
  await sleep(150)
  expect(replays).toEqual([])
})

it('replays on the other animate-ui presses too: toggle and radio', async () => {
  render(
    <>
      <Toggle aria-label="bold" />
      <RadioGroup aria-label="voice"><RadioGroupItem aria-label="alto" value="alto" /></RadioGroup>
    </>,
  )
  const toggle = screen.getByRole('button', { name: 'bold' })
  const radio = screen.getByRole('radio', { name: 'alto' })
  await press(toggle, 0)
  await waitFor(() => expect(replays).toEqual(replayed(toggle)))
  replays = []
  await press(radio, 0)
  await waitFor(() => expect(replays).toEqual(replayed(radio)))
})

it('replays a tapped switch, so animate-ui stretches its thumb as when held', async () => {
  render(<Switch aria-label="reminders" />)
  const root = screen.getByRole('switch', { name: 'reminders' })
  await press(root, 0)
  await waitFor(() => expect(replays).toEqual(replayed(root)))
})

it('leaves a read-only switch still', async () => {
  render(<Switch aria-label="locked" readOnly />)
  await press(screen.getByRole('switch', { name: 'locked' }), 0)
  await sleep(150)
  expect(replays).toEqual([])
})
