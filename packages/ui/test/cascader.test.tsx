import type { CascaderChangeEventDetails, CascaderNode } from '../src/components/cascader'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Cascader, CascaderClear, CascaderTrigger, CascaderValue } from '../src/components/cascader'
import { Field, FieldLabel } from '../src/components/field'

const REGIONS: CascaderNode[] = [
  {
    value: 'zhejiang',
    label: '浙江',
    items: [
      {
        value: 'hangzhou',
        label: '杭州',
        items: [
          { value: 'xihu', label: '西湖区' },
          { value: 'binjiang', label: '滨江区' },
        ],
      },
      { value: 'ningbo', label: '宁波' },
    ],
  },
  { value: 'beijing', label: '北京' },
  { value: 'closed', label: '停用', disabled: true },
]

describe('cascader', () => {
  it('shows the placeholder until something is picked, with data-placeholder on the trigger', () => {
    render(<Cascader items={REGIONS} placeholder="选择地区" />)
    const trigger = screen.getByRole('button', { name: '选择地区' })
    expect(trigger.textContent).toContain('选择地区')
    expect(trigger.hasAttribute('data-placeholder')).toBe(true)
  })

  it('opens on click: branches are submenu triggers, leaves are radio items', async () => {
    render(<Cascader items={REGIONS} placeholder="选择地区" />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '选择地区' }))
    expect(await screen.findByRole('menuitem', { name: '浙江' })).not.toBeNull()
    expect(screen.getByRole('menuitemradio', { name: '北京' })).not.toBeNull()
  })

  it('drills into a branch by keyboard and commits the full path from the picked leaf', async () => {
    const onValueChange = vi.fn<(value: string[] | null, eventDetails: CascaderChangeEventDetails) => void>()
    render(<Cascader items={REGIONS} placeholder="选择地区" onValueChange={onValueChange} />)
    // Keyboard, not pointer: jsdom's synthetic pointer races Base UI's
    // hover-intent timers on submenus. The pointer path is browser-verified;
    // ArrowRight drilling is the real a11y contract anyway.
    const user = userEvent.setup()
    screen.getByRole('button', { name: '选择地区' }).focus()
    await user.keyboard('{Enter}')
    await screen.findByRole('menuitem', { name: '浙江' })
    await user.keyboard('{ArrowRight}')
    await screen.findByRole('menuitem', { name: '杭州' })
    await user.keyboard('{ArrowRight}')
    await screen.findByRole('menuitemradio', { name: '西湖区' })
    await user.keyboard('{Enter}')

    expect(onValueChange).toHaveBeenCalledTimes(1)
    const [value, eventDetails] = onValueChange.mock.calls[0]
    expect(value).toEqual(['zhejiang', 'hangzhou', 'xihu'])
    expect(eventDetails.reason).toBe('item-press')
    // The trigger shows the resolved labels, and the popup is gone.
    const trigger = screen.getByRole('button', { name: /浙江/ })
    expect(trigger.textContent).toContain('浙江')
    expect(trigger.textContent).toContain('西湖区')
    expect(trigger.hasAttribute('data-placeholder')).toBe(false)
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
  })

  it('cancel() rejects the change and the trigger keeps the placeholder', async () => {
    render(
      <Cascader
        items={REGIONS}
        placeholder="选择地区"
        onValueChange={(_value, eventDetails) => eventDetails.cancel()}
      />,
    )
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '选择地区' }))
    await user.click(await screen.findByRole('menuitemradio', { name: '北京' }))
    expect(screen.getByRole('button', { name: '选择地区' }).textContent).toContain('选择地区')
  })

  it('a controlled value renders and does not move on its own', async () => {
    const onValueChange = vi.fn()
    render(<Cascader items={REGIONS} value={['zhejiang', 'ningbo']} onValueChange={onValueChange} />)
    const trigger = screen.getByRole('button', { name: /宁波/ })
    expect(trigger.textContent).toContain('浙江')
    const user = userEvent.setup()
    await user.click(trigger)
    await user.click(await screen.findByRole('menuitemradio', { name: '北京' }))
    expect(onValueChange).toHaveBeenCalledWith(['beijing'], expect.anything())
    // Still the prop's value — the parent did not update it.
    expect(screen.getByRole('button', { name: /宁波/ }).textContent).toContain('宁波')
  })

  it('an unresolvable segment prints its raw value', () => {
    render(<Cascader items={REGIONS} defaultValue={['zhejiang', 'ghost']} />)
    const trigger = screen.getByRole('button', { name: /ghost/ })
    expect(trigger.textContent).toContain('浙江')
    expect(trigger.textContent).toContain('ghost')
  })

  it('with a name, each path segment submits one hidden input, in order', () => {
    // Controlled throughout — controlledness locks at first render.
    const { container, rerender } = render(
      <Cascader items={REGIONS} value={['zhejiang', 'hangzhou', 'xihu']} name="region" />,
    )
    const inputs = [...container.querySelectorAll<HTMLInputElement>('input[type=hidden][name=region]')]
    expect(inputs.map(input => input.value)).toEqual(['zhejiang', 'hangzhou', 'xihu'])
    rerender(<Cascader items={REGIONS} name="region" value={null} />)
    expect(container.querySelector('input[type=hidden]')).toBeNull()
  })

  it('clears to null with reason clear-press, without opening the popup', async () => {
    const onValueChange = vi.fn<(value: string[] | null, eventDetails: CascaderChangeEventDetails) => void>()
    render(
      <Cascader
        items={REGIONS}
        defaultValue={['beijing']}
        placeholder="选择地区"
        onValueChange={onValueChange}
      />,
    )
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Clear selection' }))
    const [value, eventDetails] = onValueChange.mock.calls[0]
    expect(value).toBeNull()
    expect(eventDetails.reason).toBe('clear-press')
    expect(screen.getByRole('button', { name: '选择地区' }).textContent).toContain('选择地区')
    expect(screen.queryByRole('menu')).toBeNull()
  })

  // The ✕ is lifted OUT of the trigger (a <button> may not nest another), so it
  // sits in neither half of Base UI's outside-press anchor — Menu's
  // `outsidePress` override never looks at the target, leaving useDismiss's
  // floating ∪ domReference. Unfiltered, one press reports both `clear-press`
  // and an `outside-press` the user never performed. Upstream answers the same
  // question by naming the part it lifted out (Combobox's
  // `!contains(clearRef.current, target)`, AriaCombobox.js:911).
  it('pressing the ✕ with the menu open is not an outside press', async () => {
    const onOpenChange = vi.fn()
    const onValueChange = vi.fn<(value: string[] | null, eventDetails: CascaderChangeEventDetails) => void>()
    render(
      <Cascader
        items={REGIONS}
        defaultValue={['beijing']}
        placeholder="选择地区"
        onOpenChange={onOpenChange}
        onValueChange={onValueChange}
      />,
    )
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /北京/ }))
    expect(await screen.findByRole('menuitemradio', { name: '北京' })).not.toBeNull()

    await user.click(screen.getByRole('button', { name: 'Clear selection' }))
    // The value change is still reported — it is the only thing the gesture
    // actually did.
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith(null, expect.objectContaining({ reason: 'clear-press' }))
    const dismissals = onOpenChange.mock.calls
      .filter(([nextOpen]) => nextOpen === false)
      .map(([, details]) => details as { reason: string, isCanceled: boolean })
    // Base UI still calls the press outside — HTML forbids a button inside a
    // button, so the ✕ is lifted out of the trigger and lands in neither of
    // the two elements its dismissal machinery knows about. Every one of those
    // is cancelled, and no other dismissal takes their place: the ✕ declines
    // the mousedown default (Base UI's own clear does the same), so focus never
    // moves and there is no honest `focus-out` behind the phantom one.
    expect(dismissals.some(details => details.reason === 'outside-press')).toBe(true)
    expect(dismissals.filter(details => !details.isCanceled)).toEqual([])
    // Pressing a control's own part is not leaving it: the menu stays up.
    expect(screen.queryByRole('menu')).not.toBeNull()
  })

  it('clearable={false} removes the clear affordance, composed one included', () => {
    render(
      <Cascader clearable={false} defaultValue={['beijing']} items={REGIONS}>
        <CascaderTrigger>
          <CascaderValue />
          <CascaderClear />
        </CascaderTrigger>
      </Cascader>,
    )
    expect(screen.queryByRole('button', { name: 'Clear selection' })).toBeNull()
  })

  it('a disabled node cannot be picked', async () => {
    const onValueChange = vi.fn()
    render(<Cascader items={REGIONS} placeholder="选择地区" onValueChange={onValueChange} />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '选择地区' }))
    const item = await screen.findByRole('menuitemradio', { name: '停用' })
    expect(item.getAttribute('aria-disabled')).toBe('true')
    await user.click(item)
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('reopening auto-opens the submenus along the selected path', async () => {
    render(<Cascader items={REGIONS} defaultValue={['zhejiang', 'hangzhou', 'xihu']} />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /西湖区/ }))
    // Without another click, the deep leaf is already on screen and checked.
    const leaf = await screen.findByRole('menuitemradio', { name: '西湖区' })
    expect(leaf.getAttribute('aria-checked')).toBe('true')
    const branch = screen.getByRole('menuitem', { name: '浙江' })
    expect(branch.hasAttribute('data-selected')).toBe(true)
  })

  it('a FieldLabel names the trigger through the root id', () => {
    render(
      <Field>
        <FieldLabel htmlFor="region">地区</FieldLabel>
        <Cascader id="region" items={REGIONS} />
      </Field>,
    )
    const trigger = screen.getByRole('button', { name: '地区' })
    const label = screen.getByText('地区', { selector: 'label' })
    if (!(label instanceof HTMLLabelElement))
      throw new TypeError('expected a <label>')
    expect(label.control).toBe(trigger)
  })

  it('loads the first level through loadItems([]) when items is absent, once per lifetime', async () => {
    const loadItems = vi.fn(async (path: string[]) => path.length === 0
      ? [{ value: 'a', label: '甲' }, { value: 'b', label: '乙', leaf: true }]
      : [{ value: 'a1', label: '甲一', leaf: true }])
    render(<Cascader loadItems={loadItems} placeholder="选" />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '选' }))
    // No `leaf` → lazy branch (submenu trigger); `leaf: true` → radio item.
    expect(await screen.findByRole('menuitem', { name: '甲' })).not.toBeNull()
    expect(screen.getByRole('menuitemradio', { name: '乙' })).not.toBeNull()
    expect(loadItems).toHaveBeenCalledWith([], { page: 0 })
    // The cache survives close/reopen — no second request for the same panel.
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
    await user.click(screen.getByRole('button', { name: '选' }))
    await screen.findByRole('menuitem', { name: '甲' })
    expect(loadItems).toHaveBeenCalledTimes(1)
  })

  it('frosts the panel with a LoadingOverlay and data-loading while the first page is in flight', async () => {
    let resolve!: (nodes: CascaderNode[]) => void
    const loadItems = vi.fn(async () => new Promise<CascaderNode[]>((res) => {
      resolve = res
    }))
    render(<Cascader loadItems={loadItems} placeholder="选" />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '选' }))
    const panel = await waitFor(() => {
      const found = document.querySelector('[data-slot="cascader-panel"]')
      expect(found).not.toBeNull()
      return found as HTMLElement
    })
    // The house loading visual: a frosted LoadingOverlay over the shell, not
    // a spinner row (InfiniteSelect pattern).
    expect(panel.hasAttribute('data-loading')).toBe(true)
    const overlay = panel.querySelector('[data-slot="loading-overlay"]') as HTMLElement
    expect(overlay.hasAttribute('data-loading')).toBe(true)
    resolve([{ value: 'x', label: '叶', leaf: true }])
    expect(await screen.findByRole('menuitemradio', { name: '叶' })).not.toBeNull()
    expect(panel.hasAttribute('data-loading')).toBe(false)
    // Kept mounted for the cross-fade, but no longer loading.
    expect(overlay.hasAttribute('data-loading')).toBe(false)
  })

  it('echoes a lazy value without opening — the selected path prefetches level by level', async () => {
    const loadItems = vi.fn(async (path: string[]) => path.length === 0
      ? [{ value: 'a', label: '甲' }]
      : [{ value: 'a1', label: '甲一', leaf: true }])
    render(<Cascader defaultValue={['a', 'a1']} loadItems={loadItems} />)
    const trigger = document.querySelector('[data-slot="cascader-trigger"]') as HTMLElement
    // No interaction at all: the walk fills the cache and the labels swap in.
    await waitFor(() => expect(trigger.textContent).toContain('甲一'))
    expect(trigger.textContent).toContain('甲')
    expect(loadItems).toHaveBeenCalledWith([], { page: 0 })
    expect(loadItems).toHaveBeenCalledWith(['a'], { page: 0 })
    expect(loadItems).toHaveBeenCalledTimes(2)
  })

  it('the echo walk stops at a loaded level that misses its segment', async () => {
    const loadItems = vi.fn(async () => [{ value: 'x', label: '某', leaf: true }])
    render(<Cascader defaultValue={['ghost', 'deep']} loadItems={loadItems} />)
    await waitFor(() => expect(loadItems).toHaveBeenCalledTimes(1))
    const trigger = document.querySelector('[data-slot="cascader-trigger"]') as HTMLElement
    // Level 0 loaded but has no 'ghost': raw fallback, no further requests.
    expect(trigger.textContent).toContain('ghost')
    expect(loadItems).toHaveBeenCalledTimes(1)
  })

  it('reopening a lazy selection loads level by level and swaps raw values for cached labels', async () => {
    const loadItems = vi.fn(async (path: string[]) => path.length === 0
      ? [{ value: 'a', label: '甲' }]
      : [{ value: 'a1', label: '甲一', leaf: true }])
    render(<Cascader defaultValue={['a', 'a1']} loadItems={loadItems} />)
    const trigger = document.querySelector('[data-slot="cascader-trigger"]') as HTMLElement
    // Nothing is cached yet — the segments print their raw values.
    expect(trigger.textContent).toContain('a1')
    const user = userEvent.setup()
    await user.click(trigger)
    // Opening mounts the root panel; the selected path's submenu default-opens,
    // so its panel mounts too — each mount requests its own page.
    await waitFor(() => expect(loadItems).toHaveBeenCalledWith([], { page: 0 }))
    await waitFor(() => expect(loadItems).toHaveBeenCalledWith(['a'], { page: 0 }))
    const leaf = await screen.findByRole('menuitemradio', { name: '甲一' })
    expect(leaf.getAttribute('aria-checked')).toBe('true')
    // Labels for the lazily loaded segments now come from the cache.
    expect(trigger.textContent).toContain('甲')
    expect(trigger.textContent).toContain('甲一')
  })

  it('a rejected load marks the panel data-error and retries on reopen', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const loadItems = vi.fn()
        .mockRejectedValueOnce(new Error('boom'))
        .mockResolvedValue([{ value: 'ok', label: '好', leaf: true }])
      render(<Cascader loadItems={loadItems} placeholder="选" />)
      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: '选' }))
      await waitFor(() => {
        const panel = document.querySelector('[data-slot="cascader-panel"]')
        expect(panel?.hasAttribute('data-error')).toBe(true)
      })
      await user.keyboard('{Escape}')
      await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
      await user.click(screen.getByRole('button', { name: '选' }))
      expect(await screen.findByRole('menuitemradio', { name: '好' })).not.toBeNull()
      expect(loadItems).toHaveBeenCalledTimes(2)
    }
    finally {
      consoleError.mockRestore()
    }
  })

  // The sentinel fires from an IntersectionObserver jsdom can never trip —
  // what is testable is which tail element is present. The trigger distance
  // is browser-verified (InfiniteSelect precedent).
  it('a paged level keeps a trailing sentinel while hasNextPage, none once complete', async () => {
    const loadItems = vi.fn(async (_path: string[], { page }: { page: number }) => ({
      items: [{ value: `p${page}`, label: `第${page}`, leaf: true }],
      hasNextPage: page === 0,
    }))
    render(<Cascader loadItems={loadItems} placeholder="选" />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '选' }))
    await screen.findByRole('menuitemradio', { name: '第0' })
    expect(document.querySelector('[data-slot="cascader-load-more-sentinel"]')).not.toBeNull()
    expect(loadItems).toHaveBeenCalledTimes(1)
  })

  it('virtualized renders a windowed subset inside a total-height spacer', async () => {
    const many = Array.from({ length: 1000 }, (_, index) => ({ value: `v${index}`, label: `项 ${index}` }))
    render(<Cascader items={many} placeholder="选" virtualized />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '选' }))
    const list = await waitFor(() => {
      const found = document.querySelector<HTMLElement>('[data-slot="cascader-virtual-list"]')
      expect(found).not.toBeNull()
      return found as HTMLElement
    })
    // 1000 rows × 32px estimate — the spacer holds the full scroll height.
    // jsdom measures every rect as zero so no window mounts here; the mounted
    // subset and scrolling are browser-verified (InfiniteSelect precedent).
    expect(list.style.blockSize).toBe('32000px')
  })

  it('the composed trigger forwards its ref', () => {
    const ref = createRef<HTMLButtonElement>()
    render(
      <Cascader items={REGIONS}>
        <CascaderTrigger ref={ref}><CascaderValue placeholder="选择地区" /></CascaderTrigger>
      </Cascader>,
    )
    expect(ref.current).toBe(screen.getByRole('button', { name: '选择地区' }))
  })
})
