'use client'

import type { ComponentProps, CSSProperties, ReactElement } from 'react'
import type { ChangeEventDetails } from '#lib/change-event-details'
import { useControllableState } from '@gedatou/cadenza-utils'
import { IconCheck } from '@tabler/icons-react'
import { createContext, use, useCallback, useEffect, useMemo, useRef } from 'react'
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
 *
 * Advancing is choreographed, not flashed — CSS transitions in a fixed
 * 450ms window, shadcn's tempo: the checkmark lands (0–150ms), the
 * separator fill sweeps across (150–300ms), the next ring lights up
 * (300–450ms). Retreating mirrors it: ring dims, fill drains, checkmark
 * yields to the number. Multi-step jumps CASCADE inside the same window —
 * one wave leaves the step you were on and arrives segment by segment, the
 * beat dividing evenly so the total never grows. The schedule is one rule:
 * every part's `transition-delay` is its distance from the wave's
 * origin (the previously active step, which the root remembers and each
 * item turns into the `--stepper-beat` (duration) and `--stepper-ring-delay`
 * / `--stepper-line-delay` variables its parts read). Distance covers direction too — origin sits on
 * the other side on the way back — so a single base-state delay serves
 * both entering and leaving every state. `motion-reduce` drops all of it
 * to instant swaps.
 */

/** Why the active step changed. */
export type StepperChangeEventReason = 'trigger-press' | 'none'

export type StepperChangeEventDetails = ChangeEventDetails<StepperChangeEventReason>

/**
 * The choreography's total budget, shadcn's tempo: however many steps a jump
 * crosses, the whole wave fits in this window. A jump over n steps has 2n+1
 * beats (n+1 rings, n lines), so a single step keeps the familiar 3 x 150ms.
 */
const CHOREOGRAPHY_MS = 450

interface StepperContextValue {
  activeStep: number
  /** Where the current advance animation started — the previously active step. */
  previousStep: number
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

  // The cascade's origin: the step that was active before this one. Read at
  // render time, synced after commit — and because the context only recomputes
  // when activeStep changes, unrelated re-renders keep the origin (and every
  // in-flight transition-delay) stable until the next real step change.
  const previousRef = useRef(activeStep)
  const previousStep = previousRef.current
  useEffect(() => {
    previousRef.current = activeStep
  })

  const context = useMemo(
    () => ({ activeStep, previousStep, setValue }),
    // eslint-disable-next-line react/exhaustive-deps -- previousStep is derived from activeStep's history
    [activeStep, setValue],
  )

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
  style,
  ...props
}: StepperItemProps): ReactElement {
  const { activeStep, previousStep } = useStepperContext()
  const active = activeStep === step
  const context = useMemo<StepperItemContextValue>(() => ({
    step,
    active,
    completed: completed || activeStep > step,
    disabled,
    loading: loading && active,
  }), [active, activeStep, completed, disabled, loading, step])

  // The cascade schedule (see the family JSDoc): delay = distance from the
  // wave's origin. The ring counts full steps; the line counts from its entry
  // end — its start edge going forward, its far end (step + 1) coming back.
  const forward = activeStep >= previousStep
  const span = Math.max(1, Math.abs(activeStep - previousStep))
  const beat = CHOREOGRAPHY_MS / (2 * span + 1)
  const ringDelay = Math.round(Math.abs(step - previousStep) * 2 * beat)
  const lineDelay = Math.round(
    (Math.max(0, forward ? step - previousStep : previousStep - step - 1) * 2 + 1) * beat,
  )

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
        // Merged, not replaced: the variables are this part's wiring, the rest
        // of the style object stays the caller's.
        style={{
          '--stepper-beat': `${Math.round(beat)}ms`,
          '--stepper-ring-delay': `${ringDelay}ms`,
          '--stepper-line-delay': `${lineDelay}ms`,
          ...style,
        } as CSSProperties}
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
 *
 * Its beats in the advance choreography (see the family JSDoc) all read one
 * clock: `--stepper-ring-delay`, the item's distance from the wave's origin.
 * The checkmark lands the moment the wave arrives, the ring lights up with
 * it, and on the way back everything waits its mirrored turn — no per-state
 * delays, the distance already encodes the direction.
 */
export function StepperIndicator({ children, className, ...props }: StepperIndicatorProps): ReactElement {
  const item = useStepperItemContext()
  return (
    <span
      className={cn(`
        relative flex shrink-0 items-center justify-center rounded-full bg-muted
        text-xs font-medium text-muted-foreground transition-colors
        [transition-delay:var(--stepper-ring-delay)] duration-(--stepper-beat)
        block-6 inline-6
        group-data-completed/stepper-item:bg-primary
        group-data-completed/stepper-item:text-primary-foreground
        group-data-active/stepper-item:bg-primary
        group-data-active/stepper-item:text-primary-foreground
        motion-reduce:transition-none
      `, className)}
      data-slot="stepper-indicator"
      {...props}
    >
      {/* The number mirrors the checkmark's timing so the swap stays one
          gesture in both directions (the checkmark overlays it meanwhile). */}
      <span
        className={`
          transition-transform [transition-delay:var(--stepper-ring-delay)]
          duration-(--stepper-beat)
          group-data-completed/stepper-item:scale-0
          group-data-loading/stepper-item:scale-0
          motion-reduce:transition-none
        `}
      >
        {children ?? item.step}
      </span>
      <IconCheck
        aria-hidden
        className={`
          absolute scale-0 transition-transform
          [transition-delay:var(--stepper-ring-delay)] duration-(--stepper-beat)
          block-4 inline-4
          group-data-completed/stepper-item:scale-100
          motion-reduce:transition-none
        `}
      />
      {/* aria-hidden: the loading announcement is the caller's (spinner.tsx JSDoc). */}
      {item.loading && <Spinner aria-hidden className="absolute" />}
    </span>
  )
}

/**
 * The line between steps: a muted track with a primary fill that SWEEPS in
 * from the start edge on completion (and drains back on retreat) — the middle
 * beat of the advance choreography, on the item's `--stepper-line-delay`
 * clock (its distance from the wave's origin, counted from whichever end the
 * wave enters). The fill is a scale transform from the logical start (top
 * when vertical, mirrored under RTL); the 2px cross-axis growth it carries
 * along is imperceptible. Decorative (`aria-hidden`), so it takes no
 * children.
 */
export function StepperSeparator({ className, ...props }: StepperSeparatorProps): ReactElement {
  return (
    <div
      aria-hidden
      className={cn(`
        relative m-0.5 bg-muted
        group-data-horizontal/stepper:flex-1
        group-data-horizontal/stepper:block-0.5
        group-data-vertical/stepper:block-12
        group-data-vertical/stepper:inline-0.5
      `, className)}
      data-slot="stepper-separator"
      {...props}
    >
      <span
        className={`
          absolute inset-0 origin-left scale-0 bg-primary transition-transform
          [transition-delay:var(--stepper-line-delay)] duration-(--stepper-beat)
          ease-out
          group-data-completed/stepper-item:scale-100
          group-data-vertical/stepper:origin-top
          motion-reduce:transition-none
          rtl:origin-right
        `}
      />
    </div>
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
