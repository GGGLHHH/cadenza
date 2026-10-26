import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { Button, RadioGroup, RadioGroupItem, Toggle } from '../src'

// The echo is a WAAPI animation on the CSS `scale` property; animate-ui's own
// press is Motion on `transform`. Count only the echo.
let echoes: Element[] = []
beforeEach(() => {
  // eslint-disable-next-line ts/unbound-method -- re-bound with `call` below
  const original = Element.prototype.animate
  vi.spyOn(Element.prototype, 'animate').mockImplementation(function (this: Element, keyframes, options) {
    if (Array.isArray(keyframes) && keyframes.some(frame => 'scale' in frame))
      echoes.push(this)
    return original.call(this, keyframes, options)
  })
})
afterEach(() => {
  vi.restoreAllMocks()
  echoes = []
})

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

// Real timers: Motion hands tap callbacks to its next animation frame, and a
// fake clock swapped out between tests strands that frame.
async function press(element: Element, heldMs: number): Promise<void> {
  fireEvent.pointerDown(element, { button: 0, isPrimary: true, pointerId: 1 })
  await sleep(heldMs)
  fireEvent.pointerUp(element, { button: 0, isPrimary: true, pointerId: 1 })
  await sleep(50)
}

it('plays the press once through when a tap releases too soon for the spring', async () => {
  // A trackpad tap-to-click releases within a frame: animate-ui's whileTap
  // turns back before it has moved, so the release echoes the press.
  render(<Button>tap</Button>)
  const button = screen.getByRole('button', { name: 'tap' })
  await press(button, 0)
  await waitFor(() => expect(echoes).toEqual([button]))
})

it('leaves a held press to animate-ui alone', async () => {
  render(<Button>hold</Button>)
  await press(screen.getByRole('button', { name: 'hold' }), 150)
  expect(echoes).toEqual([])
})

it('does not press while disabled', async () => {
  render(<Button disabled>off</Button>)
  await press(screen.getByRole('button', { name: 'off' }), 0)
  expect(echoes).toEqual([])
})

it('echoes on the other animate-ui presses too: toggle and radio', async () => {
  render(
    <>
      <Toggle aria-label="bold" />
      <RadioGroup aria-label="voice"><RadioGroupItem aria-label="alto" value="alto" /></RadioGroup>
    </>,
  )
  const toggle = screen.getByRole('button', { name: 'bold' })
  const radio = screen.getByRole('radio', { name: 'alto' })
  await press(toggle, 0)
  await press(radio, 0)
  await waitFor(() => expect(echoes).toEqual([toggle, radio]))
})
