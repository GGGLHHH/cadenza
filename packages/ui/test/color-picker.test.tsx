import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerPopup,
  ColorPickerSlider,
  ColorPickerSwatch,
  ColorPickerTrigger,
  parseColor,
} from '../src/components/color-picker'
import { Field, FieldLabel } from '../src/components/field'

describe('colorPicker', () => {
  it('renders the default composition: a swatch trigger with an English aria fallback', () => {
    render(<ColorPicker defaultValue="#ff0000" />)
    const trigger = screen.getByRole('button', { name: 'Open color picker' })
    expect(trigger.querySelector('[data-slot=color-picker-swatch]')).not.toBeNull()
  })

  it('opens the popup with area, sliders and hex field', async () => {
    const user = userEvent.setup()
    render(<ColorPicker defaultValue="#ff0000" />)
    await user.click(screen.getByRole('button', { name: 'Open color picker' }))
    await waitFor(() => {
      expect(document.querySelector('[data-slot=color-picker-popup]')).not.toBeNull()
    })
    expect(document.querySelector('[data-slot=color-picker-area]')).not.toBeNull()
    expect(document.querySelectorAll('[data-slot=color-picker-slider]')).toHaveLength(2)
    expect(screen.getByRole('textbox', { name: 'Hex color' })).not.toBeNull()
  })

  it('commits a typed hex through onValueChange with reason control-change', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<ColorPicker defaultOpen defaultValue="#ff0000" onValueChange={onValueChange} />)
    const hex = await screen.findByRole('textbox', { name: 'Hex color' })
    await user.clear(hex)
    await user.type(hex, '00ff00')
    await user.tab()
    await waitFor(() => expect(onValueChange).toHaveBeenCalled())
    const [value, details] = onValueChange.mock.calls.at(-1) as [
      ReturnType<typeof parseColor>,
      { reason: string },
    ]
    expect(value.toString('hex').toLowerCase()).toBe('#00ff00')
    expect(details.reason).toBe('control-change')
  })

  it('cancel() rejects the change and the value stays put', async () => {
    const user = userEvent.setup()
    render(
      <ColorPicker
        defaultOpen
        defaultValue="#ff0000"
        onValueChange={(_, details) => details.cancel()}
      />,
    )
    const hex = await screen.findByRole('textbox', { name: 'Hex color' })
    await user.clear(hex)
    await user.type(hex, '0000ff')
    await user.tab()
    // The rejected write never lands, so the field snaps back to the old value.
    await waitFor(() => {
      expect((hex as HTMLInputElement).value.toLowerCase()).toBe('#ff0000')
    })
  })

  it('serialises for the form only when given a name, hexa while translucent', () => {
    const translucent = render(<ColorPicker defaultValue="#11223344" name="tone" />)
    expect(translucent.container.querySelector<HTMLInputElement>('input[type=hidden][name=tone]')?.value.toLowerCase())
      .toBe('#11223344')
    translucent.unmount()
    const opaque = render(<ColorPicker defaultValue="#112233" name="tone" />)
    expect(opaque.container.querySelector<HTMLInputElement>('input[name=tone]')?.value.toLowerCase())
      .toBe('#112233')
    opaque.unmount()
    const bare = render(<ColorPicker defaultValue="#112233" />)
    expect(bare.container.querySelector('input[type=hidden]')).toBeNull()
  })

  it('is controllable: the prop drives the swatch and internal writes defer to it', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<ColorPicker open value="#123456" name="tone" onValueChange={onValueChange} />)
    const hex = await screen.findByRole('textbox', { name: 'Hex color' })
    await user.clear(hex)
    await user.type(hex, 'abcdef')
    await user.tab()
    await waitFor(() => expect(onValueChange).toHaveBeenCalled())
    // Controlled and un-updated: the serialised value must not move.
    expect(document.querySelector<HTMLInputElement>('input[name=tone]')?.value.toLowerCase())
      .toBe('#123456')
  })

  it('disabled reaches the trigger', () => {
    render(<ColorPicker disabled />)
    const trigger = screen.getByRole<HTMLButtonElement>('button', { name: 'Open color picker' })
    expect(trigger.disabled).toBe(true)
  })

  it('a FieldLabel reaches the trigger through id', () => {
    render(
      <Field>
        <FieldLabel htmlFor="brand">品牌色</FieldLabel>
        <ColorPicker id="brand" defaultValue="#ff0000" />
      </Field>,
    )
    expect(screen.getByRole('button', { name: '品牌色' })).not.toBeNull()
  })

  it('a composed popup replaces the default one instead of doubling it', async () => {
    const user = userEvent.setup()
    render(
      <ColorPicker defaultValue="#ff0000">
        <ColorPickerTrigger>
          <ColorPickerSwatch />
        </ColorPickerTrigger>
        <ColorPickerPopup>
          <ColorPickerArea />
          <ColorPickerSlider channel="hue" />
        </ColorPickerPopup>
      </ColorPicker>,
    )
    await user.click(screen.getByRole('button', { name: 'Open color picker' }))
    await waitFor(() => {
      expect(document.querySelectorAll('[data-slot=color-picker-popup]')).toHaveLength(1)
    })
    // The composed popup has no alpha slider and no hex field.
    expect(document.querySelectorAll('[data-slot=color-picker-slider]')).toHaveLength(1)
    expect(document.querySelector('[data-slot=color-picker-input]')).toBeNull()
  })

  it('exposes parseColor so callers can build Color values', () => {
    expect(parseColor('#336699').toString('hex').toLowerCase()).toBe('#336699')
  })
})
