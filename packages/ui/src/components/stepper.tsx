'use client'

import type { ComponentProps, ReactElement } from 'react'
import type { ChangeEventDetails } from '#lib/change-event-details'
import { useControllableState } from '@gedatou/cadenza-utils'
import { IconCheck } from '@tabler/icons-react'
import { createContext, use, useCallback, useMemo } from 'react'
import { createChangeEventDetails } from '#lib/change-event-details'
import { cn, dataAttr } from '#lib/utils'
import { Spinner } from './spinner'

/**
 * The published Stepper family.
 *
 * A step sequence with clickable triggers: numbered indicators, a checkmark
 * once a step is behind the active one, a spinner on the active step while an
 * async advance is in flight (Origin UI's stepper shape, its Radix-flavoured
 * `data-state="active|completed"` translated into this library's presence
 * pairs). Base UI has no stepper and neither do the vendored primitives, so
 * the whole family is the seam's own, in the SearchField mould.
 *
 * The root owns one number — the active step, 1-based — behind the standard
 * controlled triple `value` / `defaultValue` / `onValueChange`. Every part
 * renders plain DOM, so `className` is honestly a string everywhere; style
 * off the state the items externalise as data attributes (`data-active`,
 * `data-completed`, `data-disabled`, `data-loading`) through the
 * `group/stepper` and `group/stepper-item` channels.
 */

/** Why the active step changed. */
export type StepperChangeEventReason = 'trigger-press' | 'none'

export type StepperChangeEventDetails = ChangeEventDetails<StepperChangeEventReason>

interface StepperContextValue {
  activeStep: number
  setValue: (step: number, eventDetails: StepperChangeEventDetails) => void
}

const StepperContext = createContext<StepperContextValue | null>(null)
if (process.env.NODE_ENV !== 'production')
  StepperContext.displayName = 'StepperContext'

function useStepperContext(): StepperContextValue {
  const context = use(StepperContext)
  if (context === null)
    throw new Error('cadenza-ui: StepperContext is missing. Stepper parts must be placed within <Stepper>.')
  return context
}

interface StepperItemContextValue {
  step: number
  active: boolean
  completed: boolean
  disabled: boolean
  loading: boolean
}

const StepperItemContext = createContext<StepperItemContextValue | null>(null)
if (process.env.NODE_ENV !== 'production')
  StepperItemContext.displayName = 'StepperItemContext'

function useStepperItemContext(): StepperItemContextValue {
  const context = use(StepperItemContext)
  if (context === null)
    throw new Error('cadenza-ui: StepperItemContext is missing. StepperItem parts must be placed within <StepperItem>.')
  return context
}

// `defaultValue` is the div's own (legacy React attribute) — ours is a number.
export type StepperProps = Omit<ComponentProps<'div'>, 'defaultValue'> & {
  /** Controlled active step, 1-based. */
  value?: number
  /** Uncontrolled initial step. */
  defaultValue?: number
  /**
   * Fires on every step change with why it happened.
   * `eventDetails.cancel()` rejects the change entirely.
   */
  onValueChange?: (value: number, eventDetails: StepperChangeEventDetails) => void
  orientation?: 'horizontal' | 'vertical'
  /**
   * The default composition: with no `children`, renders this many steps as
   * numbered indicators joined by separators. Compose your own items for
   * titles, descriptions or custom indicator content.
   */
  steps?: number
  /** Marks the default composition's active step as loading (`steps` mode only). */
  loading?: boolean
}

export type StepperItemProps = ComponentProps<'div'> & {
  /** This item's position in the sequence, 1-based — pairs it with the root's `value`. */
  step: number
  /** Force the completed state; steps behind the active one complete on their own. */
  completed?: boolean
  disabled?: boolean
  /** Shows the indicator's spinner — only while this step is the active one. */
  loading?: boolean
}

export type StepperTriggerProps = ComponentProps<'button'>
export type StepperIndicatorProps = ComponentProps<'span'>
export type StepperSeparatorProps = ComponentProps<'div'>
export type StepperTitleProps = ComponentProps<'h3'>
export type StepperDescriptionProps = ComponentProps<'p'>

/**
 * The root. Holds the active step and hands it to the items through context
 * (three states for the composition: no children → the `steps` default
 * composition; children → entirely yours).
 */
export function Stepper({
  children,
  className,
  defaultValue,
  loading,
  onValueChange,
  orientation = 'horizontal',
  steps,
  value,
  ...props
}: StepperProps): ReactElement {
  const [activeStep, setActiveStep] = useControllableState({ value, defaultValue, fallback: 1 })

  const setValue = useCallback(
    (next: number, eventDetails: StepperChangeEventDetails) => {
      onValueChange?.(next, eventDetails)
      if (!eventDetails.isCanceled)
        setActiveStep(next)
    },
    [onValueChange, setActiveStep],
  )

  const context = useMemo(() => ({ activeStep, setValue }), [activeStep, setValue])

  const defaultChildren = steps === undefined
    ? null
    : Array.from({ length: steps }, (_, index) => {
        const step = index + 1
        return (
          <StepperItem className="not-last:flex-1" key={step} loading={loading} step={step}>
            <StepperTrigger>
              <StepperIndicator />
            </StepperTrigger>
            {step < steps && <StepperSeparator />}
          </StepperItem>
        )
      })

  return (
    <StepperContext value={context}>
      <div
        className={cn(`
          group/stepper inline-flex
          data-horizontal:inline-full
          data-vertical:flex-col
        `, className)}
        data-orientation={orientation}
        data-slot="stepper"
        {...props}
      >
        {children ?? defaultChildren}
      </div>
    </StepperContext>
  )
}

/**
 * One step. Derives its state from the root — active is an exact match,
 * completed is anything behind the active step (or the `completed` prop),
 * loading only bites while the step is the active one — and externalises all
 * of it as data attributes for the parts inside to style off.
 */
export function StepperItem({
  className,
  completed = false,
  disabled = false,
  loading = false,
  step,
  ...props
}: StepperItemProps): ReactElement {
  const { activeStep } = useStepperContext()
  const active = activeStep === step
  const context = useMemo<StepperItemContextValue>(() => ({
    step,
    active,
    completed: completed || activeStep > step,
    disabled,
    loading: loading && active,
  }), [active, activeStep, completed, disabled, loading, step])

  return (
    <StepperItemContext value={context}>
      <div
        className={cn(`
          group/stepper-item flex items-center
          group-data-vertical/stepper:flex-col
        `, className)}
        data-active={dataAttr(context.active)}
        data-completed={dataAttr(context.completed)}
        data-disabled={dataAttr(disabled)}
        data-loading={dataAttr(context.loading)}
        data-slot="stepper-item"
        {...props}
      />
    </StepperItemContext>
  )
}

/**
 * The step's button: pressing it makes its step the active one
 * (`reason: 'trigger-press'`), and it carries `aria-current="step"` while
 * active. A real `<button type="button">`, disabled with its item.
 */
export function StepperTrigger({ className, onClick, ...props }: StepperTriggerProps): ReactElement {
  const { setValue } = useStepperContext()
  const item = useStepperItemContext()
  return (
    <button
      aria-current={item.active ? 'step' : undefined}
      className={cn(`
        inline-flex items-center gap-3 rounded-full outline-none
        focus-visible:z-10 focus-visible:ring-[3px] focus-visible:ring-ring/50
        data-disabled:opacity-50
      `, className)}
      data-disabled={dataAttr(item.disabled)}
      data-slot="stepper-trigger"
      disabled={item.disabled}
      type="button"
      {...props}
      // Chained after the spread: a caller listening for clicks must not
      // silently take the step change away; preventDefault opts out.
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented)
          setValue(item.step, createChangeEventDetails('trigger-press', event.nativeEvent))
      }}
    />
  )
}

/**
 * The step's badge, with the default visuals of the family (no language, so
 * they can default): the step number, swapped for a checkmark once completed
 * and a spinner while loading. `children` replaces the number slot; the
 * checkmark and spinner are the part's own semantic and stay.
 */
export function StepperIndicator({ children, className, ...props }: StepperIndicatorProps): ReactElement {
  const item = useStepperItemContext()
  return (
    <span
      className={cn(`
        relative flex shrink-0 items-center justify-center rounded-full bg-muted
        text-xs font-medium text-muted-foreground transition-colors block-6
        inline-6
        group-data-completed/stepper-item:bg-primary
        group-data-completed/stepper-item:text-primary-foreground
        group-data-active/stepper-item:bg-primary
        group-data-active/stepper-item:text-primary-foreground
      `, className)}
      data-slot="stepper-indicator"
      {...props}
    >
      <span
        className={`
          transition-transform
          group-data-completed/stepper-item:scale-0
          group-data-loading/stepper-item:scale-0
        `}
      >
        {children ?? item.step}
      </span>
      <IconCheck
        aria-hidden
        className={`
          absolute scale-0 transition-transform block-4 inline-4
          group-data-completed/stepper-item:scale-100
        `}
      />
      {/* aria-hidden: the loading announcement is the caller's (spinner.tsx JSDoc). */}
      {item.loading && <Spinner aria-hidden className="absolute" />}
    </span>
  )
}

/**
 * The line between steps. Decorative (`aria-hidden`); follows its item's
 * `data-completed` for colour, and the root's orientation for direction.
 */
export function StepperSeparator({ className, ...props }: StepperSeparatorProps): ReactElement {
  return (
    <div
      aria-hidden
      className={cn(`
        m-0.5 bg-muted transition-colors
        group-data-completed/stepper-item:bg-primary
        group-data-horizontal/stepper:flex-1
        group-data-horizontal/stepper:block-0.5
        group-data-vertical/stepper:block-12
        group-data-vertical/stepper:inline-0.5
      `, className)}
      data-slot="stepper-separator"
      {...props}
    />
  )
}

/** The step's name. */
export function StepperTitle({ className, ...props }: StepperTitleProps): ReactElement {
  return <h3 className={cn('text-sm font-medium', className)} data-slot="stepper-title" {...props} />
}

/** The step's supporting line. */
export function StepperDescription({ className, ...props }: StepperDescriptionProps): ReactElement {
  return <p className={cn('text-sm text-muted-foreground', className)} data-slot="stepper-description" {...props} />
}
