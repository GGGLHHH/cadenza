import { fireEvent, render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Field, FieldLabel } from '../src/components/field'
import {
  Select,
  SelectContent,
  SelectEmpty,
  SelectGroup,
  SelectItem,
  SelectList,
  SelectPopover,
  SelectTrigger,
  SelectValue,
} from '../src/components/select'

interface Fruit { id: string, name: string }
const FRUITS: Fruit[] = [{ id: 'apple', name: '苹果' }, { id: 'pear', name: '梨' }]

describe('the seam restates refs the vendored parts drop', () => {
  // Four parts type their props with a bare RAC interface — RAC declares the ref
  // on the component type instead, so those signatures lose it. The ref reaches
  // the DOM either way (React 19 spreads it); these pin that the types now agree.
  it('forwards ref on Select and SelectValue', () => {
    const root = createRef<HTMLDivElement>()
    const value = createRef<HTMLSpanElement>()
    render(
      <Select aria-label="水果" ref={root}>
        <SelectTrigger><SelectValue ref={value} /></SelectTrigger>
        <SelectContent><SelectItem id="apple">苹果</SelectItem></SelectContent>
      </Select>,
    )
    expect(root.current?.dataset.slot).toBe('select')
    expect(value.current?.dataset.slot).toBe('select-value')
  })

  it('forwards ref on SelectList and SelectGroup', () => {
    const list = createRef<HTMLDivElement>()
    const group = createRef<HTMLElement>()
    render(
      <Select aria-label="水果" defaultOpen>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectPopover>
          <SelectList aria-label="水果" ref={list}>
            <SelectGroup ref={group}>
              <SelectItem id="apple">苹果</SelectItem>
            </SelectGroup>
          </SelectList>
        </SelectPopover>
      </Select>,
    )
    expect(list.current?.dataset.slot).toBe('select-list')
    // A collection node: RAC renders it once hidden to build the collection,
    // then again for real. The ref must survive that round trip, or the type
    // restated above would be promising something the runtime never delivers.
    expect(group.current?.dataset.slot).toBe('select-group')
  })
})

describe('the seam restates the generics the vendored parts collapse', () => {
  it('infers the item type from items on SelectList', () => {
    render(
      <Select aria-label="水果" defaultOpen>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectPopover>
          <SelectList aria-label="水果" items={FRUITS}>
            {/* fruit is Fruit, not unknown — that is the whole point of the cast */}
            {fruit => <SelectItem id={fruit.id}>{fruit.name}</SelectItem>}
          </SelectList>
        </SelectPopover>
      </Select>,
    )
    expect(screen.getByRole('option', { name: '苹果' })).not.toBeNull()
  })

  it('infers the item type from items on SelectGroup — the only collection SelectContent can carry', () => {
    render(
      <Select aria-label="水果" defaultOpen>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectGroup items={FRUITS}>
            {fruit => <SelectItem id={fruit.id}>{fruit.name}</SelectItem>}
          </SelectGroup>
        </SelectContent>
      </Select>,
    )
    expect(screen.getByRole('option', { name: '梨' })).not.toBeNull()
  })

  it('rejects SelectValue children that the primitive would silently discard', () => {
    render(
      <Select aria-label="水果">
        <SelectTrigger>
          {/* @ts-expect-error non-function children render nothing — see the seam JSDoc */}
          <SelectValue>占位</SelectValue>
        </SelectTrigger>
        <SelectContent><SelectItem id="apple">苹果</SelectItem></SelectContent>
      </Select>,
    )
    expect(screen.queryByText('占位')).toBeNull()
  })
})

describe('the label channel documented on the seam', () => {
  function renderLabelled(props: { htmlFor?: string, ariaLabel?: string }): void {
    render(
      <Field>
        <FieldLabel htmlFor={props.htmlFor}>水果</FieldLabel>
        <Select aria-label={props.ariaLabel}>
          <SelectTrigger id="fruit"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem id="apple">苹果</SelectItem></SelectContent>
        </Select>
      </Field>,
    )
  }

  it('names the trigger when the label text is on both channels', () => {
    renderLabelled({ htmlFor: 'fruit', ariaLabel: '水果' })
    expect(screen.getByRole('button', { name: /水果/ })).not.toBeNull()
  })

  // The browser forwards a label click to the trigger carrying the coordinates
  // of the click on the *label*, so it reports a point outside the trigger's own
  // box. That is what the seam keys off to open the menu. jsdom has no layout —
  // every rect is 0×0 — so the box is stubbed and the discriminator is what is
  // under test here; the end-to-end behaviour is verified in a real browser.
  function clickAt(x: number, y: number): void {
    const trigger = document.querySelector('[data-slot=select-trigger]')!
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

  it('opens the menu for a click forwarded from the label', () => {
    renderLabelled({ htmlFor: 'fruit', ariaLabel: '水果' })
    clickAt(150, 60) // 落在 trigger 上方 —— 标签所在的位置
    expect(document.querySelector('[data-slot=select-list]')).not.toBeNull()
  })

  it('leaves a press on the trigger itself to React Aria', () => {
    renderLabelled({ htmlFor: 'fruit', ariaLabel: '水果' })
    clickAt(150, 120) // 落在 trigger 盒子里 —— usePress 的地盘,别插手
    expect(document.querySelector('[data-slot=select-list]')).toBeNull()
  })

  it('loses the name when aria-label is dropped — htmlFor alone cannot carry it', () => {
    // React Aria puts its own `aria-labelledby` on the trigger, and that beats a
    // native `<label for>` in the accessible-name computation. The htmlFor is
    // still worth having: it is what makes the text clickable.
    renderLabelled({ htmlFor: 'fruit' })
    expect(screen.queryByRole('button', { name: /水果/ })).toBeNull()
  })
})

describe('selectEmpty only works through renderEmptyState', () => {
  function renderEmpty(node: (empty: () => React.ReactElement) => React.ReactElement): void {
    render(
      <Select aria-label="水果" defaultOpen>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectPopover>{node(() => <SelectEmpty>无结果</SelectEmpty>)}</SelectPopover>
      </Select>,
    )
  }

  it('renders inside the list, where its group-data-empty rule can match', () => {
    renderEmpty(empty => (
      <SelectList aria-label="水果" items={[] as Fruit[]} renderEmptyState={empty}>
        {(fruit: Fruit) => <SelectItem id={fruit.id}>{fruit.name}</SelectItem>}
      </SelectList>
    ))
    const list = document.querySelector('[data-slot=select-list]')
    const empty = document.querySelector('[data-slot=select-empty]')
    expect(empty).not.toBeNull()
    expect(list?.contains(empty)).toBe(true)
    expect(list?.hasAttribute('data-empty')).toBe(true)
    expect(list?.className).toContain('group/select-list')
  })

  it('is swallowed by the collection builder when written as a list child', () => {
    renderEmpty(empty => <SelectList aria-label="水果">{empty()}</SelectList>)
    expect(document.querySelector('[data-slot=select-empty]')).toBeNull()
  })

  it('escapes its visibility rule when written outside the list', () => {
    renderEmpty(empty => (
      <>
        <SelectList aria-label="水果">{[]}</SelectList>
        {empty()}
      </>
    ))
    const list = document.querySelector('[data-slot=select-list]')
    const empty = document.querySelector('[data-slot=select-empty]')
    // It renders, but not as a descendant of the group it keys off — so the
    // base `hidden` class never lifts.
    expect(empty).not.toBeNull()
    expect(list?.contains(empty)).toBe(false)
  })
})
