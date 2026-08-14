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
