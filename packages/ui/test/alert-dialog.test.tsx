import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../src/components/alert-dialog'

function openAlert(popupProps: Partial<Parameters<typeof AlertDialogPopup>[0]> = {}): HTMLElement {
  const { baseElement } = render(
    <AlertDialog defaultOpen>
      <AlertDialogPopup {...popupProps}>
        <AlertDialogTitle>标题</AlertDialogTitle>
      </AlertDialogPopup>
    </AlertDialog>,
  )
  return baseElement
}

function slot(root: HTMLElement, name: string): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(`[data-slot=${name}]`)]
}

describe('alertDialogPopup structure', () => {
  // Same fix as Dialog: the vendored content box pinned itself with a fixed
  // translate and had no Viewport, so content taller than the screen overflowed
  // off both edges with nothing able to scroll it.
  it('wraps the popup in a scrollable viewport', () => {
    const base = openAlert()
    const [viewport] = slot(base, 'alert-dialog-viewport')
    const [popup] = slot(base, 'alert-dialog-popup')

    expect(viewport).toBeDefined()
    expect(popup).toBeDefined()
    expect(viewport.contains(popup)).toBe(true)
    expect(viewport.className).toContain('overflow-y-auto')
  })

  it('centres with auto margins rather than a fixed translate', () => {
    const [popup] = slot(openAlert(), 'alert-dialog-popup')

    expect(popup.className).toContain('m-auto')
    expect(popup.className).not.toContain('translate')
    expect(popup.className).not.toContain('fixed')
  })

  it('stamps the backdrop with its Base UI part name', () => {
    const base = openAlert()

    expect(slot(base, 'alert-dialog-backdrop')).toHaveLength(1)
    expect(slot(base, 'alert-dialog-overlay')).toHaveLength(0)
  })

  // The vendored Header, Footer, Title and Media all style themselves off
  // `group-data-[size=…]/alert-dialog-content:` selectors. Renaming this group
  // to match the part name would silently flatten every one of them — no error,
  // no failing type, just lost responsive alignment.
  it('keeps the vendored group name the header and footer style off', () => {
    const [popup] = slot(openAlert(), 'alert-dialog-popup')

    expect(popup.className).toContain('group/alert-dialog-content')
  })

  it('mirrors size as a data attribute for those selectors to read', () => {
    expect(slot(openAlert(), 'alert-dialog-popup')[0].dataset.size).toBe('default')
    // Portals render into document.body, so without this the second render
    // stacks a second popup there and `[0]` still points at the first one.
    cleanup()

    expect(slot(openAlert({ size: 'sm' }), 'alert-dialog-popup')[0].dataset.size).toBe('sm')
  })
})

describe('alertDialog contract', () => {
  // An alert dialog exists to force an answer. A `×` in the corner is an exit
  // that answers nothing, so unlike DialogPopup there is no showCloseButton and
  // nothing is rendered by default — every way out must carry a label.
  it('renders no close affordance of its own', () => {
    expect(slot(openAlert(), 'alert-dialog-close')).toHaveLength(0)
  })

  // The reason this seam builds on Dialog's root instead of Base UI's
  // AlertDialog one: that mode hard-codes `disablePointerDismissal = true`, so
  // an outside press could never be re-enabled. Locking it is opt-in now.
  it('keeps the alertdialog role after the swap', () => {
    const [popup] = slot(openAlert(), 'alert-dialog-popup')

    expect(popup.getAttribute('role')).toBe('alertdialog')
  })

  it('closes through a composed AlertDialogClose, running its onClick too', () => {
    const onClick = vi.fn()
    render(
      <AlertDialog defaultOpen>
        <AlertDialogPopup>
          <AlertDialogTitle>标题</AlertDialogTitle>
          <AlertDialogClose onClick={onClick}>删除</AlertDialogClose>
        </AlertDialogPopup>
      </AlertDialog>,
    )
    fireEvent.click(screen.getByText('删除'))

    expect(onClick).toHaveBeenCalledOnce()
  })
})

// The anchor logic lives in #lib/pointer-origin and is shared with Dialog;
// these two cases prove AlertDialog is wired into it, not that the maths works.
describe('alertDialogPopup pointer flip', () => {
  function openBy(press: (trigger: HTMLElement) => void): HTMLElement {
    cleanup()
    const { baseElement } = render(
      <AlertDialog>
        <AlertDialogTrigger>打开</AlertDialogTrigger>
        <AlertDialogPopup>
          <AlertDialogTitle>标题</AlertDialogTitle>
        </AlertDialogPopup>
      </AlertDialog>,
    )
    const trigger = screen.getByText('打开')
    press(trigger)
    fireEvent.click(trigger)
    return baseElement
  }

  it('translates to the pointer, as an offset from the screen centre', () => {
    // jsdom's viewport is 1024x768, so the centre is (512, 384).
    const base = openBy(trigger => fireEvent.pointerDown(trigger, { clientX: 300, clientY: 200 }))
    const [viewport] = slot(base, 'alert-dialog-viewport')

    expect(viewport.style.getPropertyValue('--dialog-flip')).toBe('translate(-212px, -184px) scale(0.3)')
  })

  it('drops a stale anchor when the trigger is pressed by keyboard', () => {
    openBy(trigger => fireEvent.pointerDown(trigger, { clientX: 300, clientY: 200 }))
    const base = openBy(trigger => fireEvent.keyDown(trigger, { key: 'Enter' }))
    const [viewport] = slot(base, 'alert-dialog-viewport')

    expect(viewport.style.getPropertyValue('--dialog-flip')).toBe('scale(0.95)')
  })
})
