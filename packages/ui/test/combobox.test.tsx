import type { ReactNode } from 'react'
import { IconSearch } from '@tabler/icons-react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
} from '../src/components/combobox'
import { InputGroupAddon } from '../src/components/input-group'

const COMPOSERS = ['拉威尔', '德彪西', '萨蒂']

function renderComposers(
  props: Partial<Parameters<typeof Combobox<string>>[0]> = {},
  addon?: ReactNode,
): void {
  render(
    <Combobox items={COMPOSERS} {...props}>
      <ComboboxInput aria-label="作曲家">{addon}</ComboboxInput>
      <ComboboxPopup>
        <ComboboxEmpty>没有匹配</ComboboxEmpty>
        <ComboboxList>
          {(composer: string) => (
            <ComboboxItem key={composer} value={composer}>{composer}</ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxPopup>
    </Combobox>,
  )
}

it('filters the list in the browser and reports the pick with details', async () => {
  const user = userEvent.setup()
  const onValueChange = vi.fn()
  renderComposers({ onValueChange })

  const input = screen.getByRole('combobox', { name: '作曲家' })
  await user.click(input)
  await waitFor(() => expect(screen.getByRole('option', { name: '德彪西' })).toBeTruthy())

  await user.type(input, '萨')
  await waitFor(() => expect(screen.queryByRole('option', { name: '德彪西' })).toBeNull())

  await user.click(screen.getByRole('option', { name: '萨蒂' }))
  expect(onValueChange).toHaveBeenCalledWith('萨蒂', expect.objectContaining({ reason: 'item-press' }))
})

it('swaps the arrow for the clear button once a value is picked', async () => {
  const user = userEvent.setup()
  renderComposers()
  const input = screen.getByRole('combobox', { name: '作曲家' })

  // Single selection — the mount condition is a *selected value*, not text.
  // Typing alone leaves the arrow up.
  await user.type(input, '拉')
  expect(document.querySelector('[data-slot="combobox-clear"]')).toBeNull()

  await user.click(await screen.findByRole('option', { name: '拉威尔' }))
  await waitFor(() => expect(document.querySelector('[data-slot="combobox-clear"]')).not.toBeNull())
})

it('renders one chip per value when multiple, each with its own remove', async () => {
  const user = userEvent.setup()
  render(
    <Combobox defaultValue={['拉威尔', '萨蒂']} items={COMPOSERS} multiple>
      <ComboboxChips>
        <ComboboxChip>拉威尔</ComboboxChip>
        <ComboboxChip>萨蒂</ComboboxChip>
        <ComboboxChipsInput aria-label="作曲家" />
      </ComboboxChips>
    </Combobox>,
  )

  expect(document.querySelectorAll('[data-slot="combobox-chip"]')).toHaveLength(2)
  expect(document.querySelectorAll('[data-slot="combobox-chip-remove"]')).toHaveLength(2)

  // `removable` is the bare-adjective replacement for the vendored `showRemove`.
  await user.click(screen.getByRole('combobox', { name: '作曲家' }))
  expect(screen.getByRole('combobox', { name: '作曲家' }).tagName).toBe('INPUT')
})

it('lets a root-level disabled reach the input and the row', () => {
  renderComposers({ disabled: true })

  // The vendored ComboboxInput defaulted `disabled` to false and handed it to
  // the render element, whose own props win the merge — so it overwrote the
  // `fieldDisabled || comboboxDisabled || disabledProp` Base UI had already
  // resolved, and `<Combobox disabled>` left a typable field behind.
  const input = screen.getByRole('combobox', { name: '作曲家' })
  expect(input.hasAttribute('disabled')).toBe(true)
  expect(input.closest('[data-slot="input-group"]')).not.toBeNull()
})

it('keeps the list open when the documented leading addon is pressed', async () => {
  const user = userEvent.setup()
  const onOpenChange = vi.fn()
  renderComposers({ onOpenChange }, <InputGroupAddon data-testid="search"><IconSearch /></InputGroupAddon>)

  const input = screen.getByRole('combobox', { name: '作曲家' })
  await user.click(input)
  await waitFor(() => expect(screen.getByRole('option', { name: '德彪西' })).toBeTruthy())
  onOpenChange.mockClear()

  // The row is the fourth anchor of Base UI's outside-press test
  // (`!contains(inputGroupElement, target)`, AriaCombobox.js:911), and only
  // `Combobox.InputGroup` fills that slot in. Rendered as a bare div the addon
  // matched none of the four anchors, so the press the docs teach —
  // `<InputGroupAddon><IconSearch /></InputGroupAddon>` inside `ComboboxInput`
  // — dismissed the list it was meant to search.
  await user.click(screen.getByTestId('search'))
  expect(screen.queryByRole('option', { name: '德彪西' })).not.toBeNull()
  expect(document.activeElement).toBe(input)
  // The end state alone cannot tell "never dismissed" from "dismissed, then
  // reopened a tick later by handleInputPress" — both leave the list up with
  // the input focused. Only the callback sequence separates them, and the
  // close/reopen is real churn the user can see (unmount, exit animation,
  // highlight reset). So: not one dismissal, cancelled or otherwise.
  expect(onOpenChange.mock.calls.filter(([nextOpen]) => nextOpen === false)).toEqual([])
})

it('registers the row as the popup anchor, not the bare input', async () => {
  const user = userEvent.setup()
  renderComposers()

  await user.click(screen.getByRole('combobox', { name: '作曲家' }))
  await waitFor(() => expect(screen.getByRole('option', { name: '德彪西' })).toBeTruthy())

  // `data-popup-open` is written only when the row renders through
  // `Combobox.InputGroup` (triggerStateAttributesMapping), so this catches a
  // swap back to a plain div. It is NOT proof the store holds the element —
  // that comes from the ref, and the attribute would survive a render element
  // that swallowed it. The addon test above is what covers the ref path: with
  // `inputGroupElement` null the addon press dismisses, and the dismissal shows
  // up in `onOpenChange` even though the end state looks identical. Identity,
  // not pixels — jsdom has no layout to measure.
  const row = document.querySelector('[data-slot="input-group"]')
  expect(row?.contains(screen.getByRole('combobox', { name: '作曲家' }))).toBe(true)
  expect(row?.hasAttribute('data-popup-open')).toBe(true)
})

it('drops the whole addon when neither button is asked for', () => {
  render(
    <Combobox items={COMPOSERS}>
      <ComboboxInput aria-label="搜索" clearable={false} trigger={false} />
    </Combobox>,
  )
  expect(document.querySelector('[data-slot="combobox-trigger"]')).toBeNull()
  expect(document.querySelector('[data-slot="combobox-clear"]')).toBeNull()
  expect(document.querySelector('[data-slot="input-group-addon"]')).toBeNull()
})

it('names the default buttons and keeps the arrow out of the tab order', async () => {
  const user = userEvent.setup()
  renderComposers()

  // The outer InputGroupButton's own defaults were winning the render merge:
  // `data-slot="button"` over the part's own slot, and useButton's `tabIndex=0`
  // over the -1 Base UI gives a trigger whose input sits outside the popup.
  // Neither icon button had an accessible name at all.
  const arrow = document.querySelector('[data-slot="combobox-trigger"]')
  expect(arrow?.getAttribute('aria-label')).toBe('Open list')
  expect(arrow?.getAttribute('tabindex')).toBe('-1')

  await user.type(screen.getByRole('combobox', { name: '作曲家' }), '拉')
  await user.click(await screen.findByRole('option', { name: '拉威尔' }))
  await waitFor(() => expect(document.querySelector('[data-slot="combobox-clear"]')).not.toBeNull())
  expect(document.querySelector('[data-slot="combobox-clear"]')?.getAttribute('aria-label')).toBe('Clear')
})
