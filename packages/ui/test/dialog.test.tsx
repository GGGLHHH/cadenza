import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Dialog, DialogBody, DialogClose, DialogPopup, DialogTitle, DialogTrigger } from '../src/components/dialog'

function openDialog(popupProps: Partial<Parameters<typeof DialogPopup>[0]> = {}): HTMLElement {
  const { baseElement } = render(
    <Dialog defaultOpen>
      <DialogPopup {...popupProps}>
        <DialogTitle>标题</DialogTitle>
      </DialogPopup>
    </Dialog>,
  )
  return baseElement
}

function slot(root: HTMLElement, name: string): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(`[data-slot=${name}]`)]
}

describe('dialogPopup structure', () => {
  // The whole reason this seam exists: the vendored DialogContent pinned itself
  // with `fixed ... -translate-1/2` and had no Viewport, so content taller than
  // the screen overflowed off both edges with nothing able to scroll it.
  it('wraps the popup in a scrollable viewport', () => {
    const base = openDialog()
    const [viewport] = slot(base, 'dialog-viewport')
    const [popup] = slot(base, 'dialog-popup')

    expect(viewport).toBeDefined()
    expect(popup).toBeDefined()
    expect(viewport.contains(popup)).toBe(true)
    expect(viewport.className).toContain('overflow-y-auto')
  })

  // Auto margins, not `items-center` — centring a flex item taller than its
  // scroll container clips the leading edge out of reach.
  it('centres the popup with auto margins rather than a fixed translate', () => {
    const [popup] = slot(openDialog(), 'dialog-popup')

    expect(popup.className).toContain('m-auto')
    expect(popup.className).not.toContain('translate')
    expect(popup.className).not.toContain('fixed')
  })

  // Renaming the public part to Backdrop is only half the job: reusing the
  // vendored overlay would leave `[data-slot=dialog-overlay]` in the DOM and
  // the documented selector would miss.
  it('stamps the backdrop with its Base UI part name', () => {
    const base = openDialog()

    expect(slot(base, 'dialog-backdrop')).toHaveLength(1)
    expect(slot(base, 'dialog-overlay')).toHaveLength(0)
  })

  it('routes backdropClassName and viewportClassName to their own layers', () => {
    const base = openDialog({
      backdropClassName: 'test-backdrop',
      viewportClassName: 'test-viewport',
      className: 'test-popup',
    })
    const [backdrop] = slot(base, 'dialog-backdrop')
    const [viewport] = slot(base, 'dialog-viewport')
    const [popup] = slot(base, 'dialog-popup')

    expect(backdrop.className).toContain('test-backdrop')
    expect(viewport.className).toContain('test-viewport')
    expect(popup.className).toContain('test-popup')
  })
})

// The popup grows out of where the pointer was, FLIP-style: `--dialog-flip` is
// the shrunk-and-translated state both ends of the transition sit at, and the
// translation is "pointer minus screen centre" because the centred popup is
// already at the screen centre. See the FLIP comment in dialog.tsx.
describe('dialogPopup pointer flip', () => {
  // Portals render into document.body, so a second render inside one test would
  // stack two dialogs there. The module-level pointer origin survives cleanup,
  // which is the point — the keyboard case opens twice to prove it is reset.
  function openBy(press: (trigger: HTMLElement) => void): HTMLElement {
    cleanup()
    const { baseElement } = render(
      <Dialog>
        <DialogTrigger>打开</DialogTrigger>
        <DialogPopup>
          <DialogTitle>标题</DialogTitle>
        </DialogPopup>
      </Dialog>,
    )
    const trigger = screen.getByText('打开')
    press(trigger)
    fireEvent.click(trigger)
    return baseElement
  }

  it('translates to the pointer, as an offset from the screen centre', () => {
    // jsdom's viewport is 1024x768, so the centre is (512, 384).
    const base = openBy(trigger => fireEvent.pointerDown(trigger, { clientX: 300, clientY: 200 }))
    const [viewport] = slot(base, 'dialog-viewport')

    expect(viewport.style.getPropertyValue('--dialog-flip')).toBe('translate(-212px, -184px) scale(0.3)')
  })

  // Without the keydown reset a keyboard-opened dialog would fly out of
  // whatever was last clicked, which is nowhere near the user's attention.
  it('drops a stale anchor when the trigger is pressed by keyboard', () => {
    openBy(trigger => fireEvent.pointerDown(trigger, { clientX: 300, clientY: 200 }))
    const base = openBy(trigger => fireEvent.keyDown(trigger, { key: 'Enter' }))
    const [viewport] = slot(base, 'dialog-viewport')

    expect(viewport.style.getPropertyValue('--dialog-flip')).toBe('scale(0.95)')
  })

  // `transform: var(--x)` is an invalid declaration when the variable is
  // missing, so the fallback has to be a real value, never an absent one.
  it('always sets the variable the transform reads', () => {
    const base = openBy(trigger => fireEvent.keyDown(trigger, { key: 'Enter' }))
    const [viewport] = slot(base, 'dialog-viewport')
    const [popup] = slot(base, 'dialog-popup')

    expect(popup.className).toContain('transform-(--dialog-flip)')
    expect(viewport.style.getPropertyValue('--dialog-flip')).not.toBe('')
  })
})

// Both parts carry handlers of their own — the trigger records the pointer
// origin, the close button closes — so a caller's handler has to survive the
// merge. "Save" is an ordinary DialogClose with an onClick; if that were
// swallowed the button would look fine and do nothing.
describe('dialog caller handlers', () => {
  it('keeps the trigger\'s own onClick', () => {
    const onClick = vi.fn()
    render(
      <Dialog>
        <DialogTrigger onClick={onClick}>打开</DialogTrigger>
        <DialogPopup>
          <DialogTitle>标题</DialogTitle>
        </DialogPopup>
      </Dialog>,
    )
    fireEvent.click(screen.getByText('打开'))

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('keeps a close button\'s own onClick', () => {
    const onClick = vi.fn()
    render(
      <Dialog defaultOpen>
        <DialogPopup>
          <DialogTitle>标题</DialogTitle>
          <DialogClose onClick={onClick}>保存</DialogClose>
        </DialogPopup>
      </Dialog>,
    )
    fireEvent.click(screen.getByText('保存'))

    expect(onClick).toHaveBeenCalledOnce()
  })
})

// Composing a DialogBody is what switches the popup to inside-scrolling, and
// the popup detects it with `:has(> [data-slot=dialog-body])` — a DIRECT child
// selector. Anything that nests the body one level deeper silently turns the
// whole feature off, with no error and no failing type.
describe('dialogBody', () => {
  it('is a direct child of the popup, which the :has() selector requires', () => {
    const { baseElement } = render(
      <Dialog defaultOpen>
        <DialogPopup>
          <DialogTitle>标题</DialogTitle>
          <DialogBody>内容</DialogBody>
        </DialogPopup>
      </Dialog>,
    )
    const [popup] = slot(baseElement, 'dialog-popup')
    const [body] = slot(baseElement, 'dialog-body')

    expect(body).toBeDefined()
    expect(body.parentElement).toBe(popup)
  })

  // `overflow` has to sit on the flex item itself. Handing the scrolling to a
  // nested element that sizes with a percentage silently does nothing: a flex
  // main size leaves `height` computing to `auto`, so the percentage never
  // resolves and the content is never clipped.
  it('scrolls on the flex item itself, with no percentage in the chain', () => {
    const { baseElement } = render(
      <Dialog defaultOpen>
        <DialogPopup>
          <DialogTitle>标题</DialogTitle>
          <DialogBody>内容</DialogBody>
        </DialogPopup>
      </Dialog>,
    )
    const [body] = slot(baseElement, 'dialog-body')

    expect(body.className).toContain('flex-1')
    expect(body.className).toContain('min-block-0')
    expect(body.className).toContain('overflow-y-auto')
  })
})

describe('dialogPopup close button', () => {
  it('renders one by default', () => {
    expect(slot(openDialog(), 'dialog-close')).toHaveLength(1)
  })

  // `inset-bs-2` is block-START. Typing `inset-be-2` puts the ✕ in the bottom
  // corner, on top of whatever the footer holds — and the logical-properties
  // lint rule only checks that a logical property was used, not which end.
  it('pins itself to the top corner', () => {
    const [close] = slot(openDialog(), 'dialog-close')

    expect(close.className).toContain('inset-bs-2')
    expect(close.className).not.toContain('inset-be-')
  })

  it('drops it under showCloseButton={false}', () => {
    expect(slot(openDialog({ showCloseButton: false }), 'dialog-close')).toHaveLength(0)
  })
})
