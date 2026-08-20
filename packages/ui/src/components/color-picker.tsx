'use client'

import type { ReactElement, ReactNode } from 'react'
import type {
  Color,
  ColorAreaProps as RACColorAreaProps,
  ColorFieldProps as RACColorFieldProps,
  ColorSliderProps as RACColorSliderProps,
  ColorSwatchProps as RACColorSwatchProps,
} from 'react-aria-components'
import type { ChangeEventDetails } from '#lib/change-event-details'
import { Popover as PopoverPrimitive } from '@base-ui/react/popover'
import { useControllableState } from '@gedatou/cadenza-utils'
import { createContext, use, useMemo } from 'react'
import {
  parseColor,
  ColorArea as RACColorArea,
  ColorField as RACColorField,
  ColorPicker as RACColorPicker,
  ColorSlider as RACColorSlider,
  ColorSwatch as RACColorSwatch,
  ColorThumb as RACColorThumb,
  Input as RACInput,
  SliderTrack as RACSliderTrack,
} from 'react-aria-components'
import { createChangeEventDetails } from '#lib/change-event-details'
import { findComposedPart } from '#lib/find-part'
import { popupClassName } from '#lib/popup'
import { cn } from '#lib/utils'

/**
 * The published ColorPicker family.
 *
 * A swatch button with a colour-editing popup: a saturation/brightness area, a
 * hue and an alpha slider, and a hex field. Base UI has no colour component,
 * so the family is a marriage of two kernels — React Aria's Color parts supply
 * colour state, maths and the drag/keyboard interactions (they sync through
 * React Aria's own context), while the trigger and popup are Base UI's Popover,
 * so opening, positioning, focus and outside-press behave exactly like every
 * other popup in this library.
 *
 * The React Aria parts (`Area`, `Slider`, `Input`, `Swatch`) support function
 * `className`s in *their* render-prop shape, which is not this library's
 * Base UI `(state) => string` contract — rather than leak a second contract,
 * those parts honestly declare `className?: string`. `ColorPickerTrigger` and
 * `ColorPickerPopup` are Base UI parts and keep the full function contract.
 *
 * Style off state through the attributes each kernel writes: Base UI's
 * `data-popup-open` on the trigger, React Aria's `data-dragging` /
 * `data-focus-visible` on the thumbs.
 */

/**
 * Why the value changed. React Aria's picker context does not say which
 * control moved (area, slider or field), so every user gesture reports the one
 * word `control-change`; `none` is the programmatic default.
 */
export type ColorPickerChangeEventReason = 'control-change' | 'none'

export type ColorPickerChangeEventDetails = ChangeEventDetails<ColorPickerChangeEventReason>

interface ColorPickerContextValue {
  'disabled': boolean
  'id'?: string
  'aria-label'?: string
}

const ColorPickerContext = createContext<ColorPickerContextValue | null>(null)
if (process.env.NODE_ENV !== 'production')
  ColorPickerContext.displayName = 'ColorPickerContext'

function useColorPickerContext(): ColorPickerContextValue {
  const context = use(ColorPickerContext)
  if (context === null)
    throw new Error('cadenza-ui: ColorPickerContext is missing. ColorPicker parts must be placed within <ColorPicker>.')
  return context
}

/** The transparency backdrop under swatches and the alpha track. */
const CHECKERBOARD = 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%)'

const THUMB_CLASSNAME = `
  box-border rounded-full border-2 border-white
  shadow-[0_0_0_1px_rgba(0,0,0,0.35)] block-4 inline-4
  data-focus-visible:block-5 data-focus-visible:inline-5
`

export interface ColorPickerProps {
  /** Controlled value. Strings are parsed with React Aria's `parseColor`. */
  'value'?: Color | string
  /** Uncontrolled initial value. Defaults to black. */
  'defaultValue'?: Color | string
  /**
   * Fires on every change with why it happened. The value is React Aria's
   * `Color` — call `.toString('hex' | 'hexa' | 'css' | …)` for a string.
   * `eventDetails.cancel()` rejects the change entirely.
   */
  'onValueChange'?: (value: Color, eventDetails: ColorPickerChangeEventDetails) => void
  /** Controlled popup state. */
  'open'?: boolean
  /** Whether the popup is initially open. */
  'defaultOpen'?: boolean
  /** Base UI's popover callback, `cancel()` and reasons included. */
  'onOpenChange'?: PopoverPrimitive.Root.Props['onOpenChange']
  /** Fires after the popup's open/close animation completes. */
  'onOpenChangeComplete'?: PopoverPrimitive.Root.Props['onOpenChangeComplete']
  /** Imperative popup actions (`unmount`, `close`), Base UI's own type. */
  'actionsRef'?: PopoverPrimitive.Root.Props['actionsRef']
  /** Base UI's modal switch, pinned to `false`: an inline control must not lock the page. */
  'modal'?: PopoverPrimitive.Root.Props['modal']
  /**
   * With a name, a hidden input serialises the value for the form —
   * `#rrggbb`, or `#rrggbbaa` while the colour is translucent.
   */
  'name'?: string
  'disabled'?: boolean
  /** Forwarded to the default composition's trigger, so a `FieldLabel htmlFor` reaches it. */
  'id'?: string
  /** Accessible name for the default composition's trigger. */
  'aria-label'?: string
  /**
   * Replaces the default composition (the swatch trigger). Compose the parts
   * yourself; the popup stays present unless a `ColorPickerPopup` is composed.
   */
  'children'?: ReactNode | ReactNode[]
}

export function ColorPicker({
  'aria-label': ariaLabel,
  actionsRef,
  children,
  defaultOpen,
  defaultValue,
  disabled = false,
  id,
  modal = false,
  name,
  onOpenChange,
  onOpenChangeComplete,
  onValueChange,
  open,
  value: valueProp,
}: ColorPickerProps): ReactElement {
  const parsedValue = useMemo(
    () => typeof valueProp === 'string' ? parseColor(valueProp) : valueProp,
    [valueProp],
  )
  const parsedDefault = useMemo(
    () => typeof defaultValue === 'string' ? parseColor(defaultValue) : defaultValue,
    [defaultValue],
  )
  const [color, setColorState] = useControllableState<Color>({
    value: parsedValue,
    defaultValue: parsedDefault,
    fallback: useMemo(() => parseColor('#000000'), []),
  })

  // React Aria is held controlled, so the cancel protocol is real: the user
  // callback runs first, a cancel skips the state write entirely.
  const setValue = (
    next: Color,
    eventDetails: ColorPickerChangeEventDetails = createChangeEventDetails('none'),
  ): void => {
    onValueChange?.(next, eventDetails)
    if (eventDetails.isCanceled)
      return
    setColorState(next)
  }

  const context = useMemo<ColorPickerContextValue>(
    () => ({ disabled, 'id': id, 'aria-label': ariaLabel }),
    [disabled, id, ariaLabel],
  )

  const resolvedChildren = children ?? <ColorPickerTrigger />
  const hasComposedPopup = findComposedPart(resolvedChildren, ColorPickerPopup) !== undefined

  return (
    <RACColorPicker
      value={color}
      onChange={next => setValue(next, createChangeEventDetails('control-change'))}
    >
      <ColorPickerContext value={context}>
        <PopoverPrimitive.Root
          actionsRef={actionsRef}
          defaultOpen={defaultOpen}
          modal={modal}
          open={open}
          onOpenChange={onOpenChange}
          onOpenChangeComplete={onOpenChangeComplete}
        >
          {resolvedChildren}
          {hasComposedPopup ? null : <ColorPickerPopup />}
        </PopoverPrimitive.Root>
        {name !== undefined && (
          // Outside the popup on purpose: the popup unmounts on close, and a
          // form key that flickers in and out of FormData is worse than ''.
          <input
            disabled={disabled}
            name={name}
            type="hidden"
            value={color.getChannelValue('alpha') < 1 ? color.toString('hexa') : color.toString('hex')}
          />
        )}
      </ColorPickerContext>
    </RACColorPicker>
  )
}

export type ColorPickerTriggerProps = PopoverPrimitive.Trigger.Props

/**
 * The swatch button that opens the popup — a Base UI Popover trigger, so the
 * popup anchors to it and `data-popup-open` styles the open state. Renders a
 * `ColorPickerSwatch` unless given children.
 */
export function ColorPickerTrigger({
  children,
  className,
  ...props
}: ColorPickerTriggerProps): ReactElement {
  const picker = useColorPickerContext()
  return (
    <PopoverPrimitive.Trigger
      // English aria-only fallback, the house pattern — but only while no
      // label element can reach the trigger: an `id` means a `FieldLabel
      // htmlFor` is expected to name it, and an aria-label would outrank the
      // label in the accessible-name computation and silence it.
      aria-label={picker['aria-label'] ?? (picker.id === undefined ? 'Open color picker' : undefined)}
      data-slot="color-picker-trigger"
      disabled={picker.disabled}
      id={picker.id}
      className={cn(`
        inline-flex items-center justify-center gap-2 rounded-md border
        border-input bg-transparent p-1 shadow-xs transition-[color,box-shadow]
        outline-none
        focus-visible:border-ring focus-visible:ring-[3px]
        focus-visible:ring-ring/50
        data-disabled:opacity-50
      `, className)}
      {...props}
    >
      {children ?? <ColorPickerSwatch />}
    </PopoverPrimitive.Trigger>
  )
}

// React Aria's function className/style take *its* render-prop shape, not this
// library's Base UI (state) contract — the seam narrows them honestly. `style`
// is the seam's own here (the checkerboard backdrop), so it is omitted too.
export type ColorPickerSwatchProps
  = Omit<RACColorSwatchProps, 'children' | 'className' | 'style'>
    & { className?: string }

/**
 * The current colour as a small tile over a checkerboard, so translucency
 * reads as translucency. Standalone it shows the picker's value; pass `color`
 * to show any other.
 */
export function ColorPickerSwatch({ className, ...props }: ColorPickerSwatchProps): ReactElement {
  return (
    <RACColorSwatch
      data-slot="color-picker-swatch"
      className={cn('rounded-sm block-5 inline-5', className)}
      style={({ color }) => {
        const css = color.toString('css')
        return {
          background: `linear-gradient(${css}, ${css}), ${CHECKERBOARD} 50% / 8px 8px`,
        }
      }}
      {...props}
    />
  )
}

export type ColorPickerPopupProps
  = Omit<PopoverPrimitive.Popup.Props, 'children'>
    & Pick<PopoverPrimitive.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset'>
    & {
      /**
       * Replaces the popup's default content (area, hue and alpha sliders,
       * hex field). Leaving parts out IS the configuration — an opaque-only
       * picker simply composes without the alpha slider.
       */
      children?: ReactNode | ReactNode[]
    }

/**
 * Portal + Positioner + Popup in one part, anchored to the trigger — the
 * house popup shell around React Aria's editing controls.
 */
export function ColorPickerPopup({
  align = 'start',
  alignOffset = 0,
  children,
  className,
  side = 'bottom',
  sideOffset = 4,
  ...props
}: ColorPickerPopupProps): ReactElement {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        className="isolate z-50 outline-none"
        side={side}
        sideOffset={sideOffset}
      >
        <PopoverPrimitive.Popup
          data-slot="color-picker-popup"
          className={cn(popupClassName, 'flex flex-col gap-3 p-3 inline-64', className)}
          {...props}
        >
          {children ?? (
            <>
              <ColorPickerArea />
              <ColorPickerSlider channel="hue" />
              <ColorPickerSlider channel="alpha" />
              <ColorPickerInput />
            </>
          )}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

export type ColorPickerAreaProps
  = Omit<RACColorAreaProps, 'children' | 'className' | 'style'>
    & { className?: string }

/**
 * The two-dimensional field — saturation across, brightness up, in HSB by
 * default. React Aria paints the gradient and drives the thumb; the picker's
 * context keeps it in sync with the other parts.
 */
export function ColorPickerArea({ className, ...props }: ColorPickerAreaProps): ReactElement {
  return (
    <RACColorArea
      colorSpace="hsb"
      xChannel="saturation"
      yChannel="brightness"
      data-slot="color-picker-area"
      className={cn('shrink-0 rounded-md block-40 inline-full', className)}
      {...props}
    >
      <RACColorThumb className={THUMB_CLASSNAME} />
    </RACColorArea>
  )
}

export type ColorPickerSliderProps
  = Omit<RACColorSliderProps, 'children' | 'className' | 'style'>
    & { className?: string }

/**
 * A single-channel slider. `channel="hue"` and `channel="alpha"` are the
 * default composition's pair; any channel of the given `colorSpace` works.
 */
export function ColorPickerSlider({
  channel,
  className,
  ...props
}: ColorPickerSliderProps): ReactElement {
  return (
    <RACColorSlider
      channel={channel}
      colorSpace="hsb"
      // English aria-only fallback; React Aria localises nothing here because
      // the channel name is the accessible name a caller most likely replaces.
      aria-label={String(channel)}
      data-slot="color-picker-slider"
      className={cn('inline-full', className)}
      {...props}
    >
      <RACSliderTrack
        className="rounded-full block-4"
        style={({ defaultStyle }) => ({
          background: `${defaultStyle.background}, ${CHECKERBOARD} 50% / 14px 14px`,
        })}
      >
        <RACColorThumb className={cn(THUMB_CLASSNAME, 'inset-bs-1/2')} />
      </RACSliderTrack>
    </RACColorSlider>
  )
}

export type ColorPickerInputProps
  = Omit<RACColorFieldProps, 'children' | 'className' | 'style'>
    & { className?: string }

/**
 * The text field — hex by default, one channel with `channel`. `className`
 * lands on the inner `<input>`; the React Aria wrapper div is unstyled.
 */
export function ColorPickerInput({ className, ...props }: ColorPickerInputProps): ReactElement {
  return (
    <RACColorField
      aria-label="Hex color"
      data-slot="color-picker-input"
      {...props}
    >
      <RACInput
        className={cn(`
          rounded-md border border-input bg-transparent px-2 font-mono text-xs
          outline-none block-7 inline-full
          focus-visible:border-ring focus-visible:ring-[3px]
          focus-visible:ring-ring/50
          data-disabled:opacity-50
        `, className)}
      />
    </RACColorField>
  )
}

export { parseColor }
export type { Color }
