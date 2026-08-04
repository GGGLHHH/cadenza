/**
 * The event-details protocol for change callbacks, isomorphic to Base UI's
 * (`internals/createBaseUIEventDetails.mjs`): every `onXxxChange` receives
 * `(value, eventDetails)`, the second argument always present — programmatic
 * changes construct one with reason `'none'`. There is no path where it is
 * sometimes `undefined`.
 *
 * `cancel()` is a real protocol, not decoration: the component calls the
 * user's callback first, then checks `isCanceled` and skips its internal
 * state update when set. A component that cannot honour that must not expose
 * a details object at all.
 *
 * Reasons reuse Base UI's vocabulary (`internals/reason-parts.mjs`, 35
 * kebab-case words: `trigger-press`, `outside-press`, `item-press`,
 * `clear-press`, `input-change`, `escape-key`, `focus-out`, `none`, …).
 * Check that table before coining a new word. Each component exports its own
 * subset union (`SearchFieldChangeEventReason` style), mirroring how Base UI
 * scopes `SelectRoot.ChangeEventReason`.
 *
 * The shape is a structural subset of Base UI's details, so a wrapper can
 * pass Base UI's own details object straight through to its caller —
 * `allowPropagation`/`isPropagationAllowed` are carried for that
 * compatibility; seam-built components do not stop propagation themselves,
 * so on details they construct the pair is inert.
 */
export interface ChangeEventDetails<Reason extends string = string> {
  /** Why the change happened, from the reason vocabulary. */
  reason: Reason
  /** The native event behind the change; a synthetic `Event('cadenza-ui')` for programmatic changes. */
  event: Event
  /** Reject the change: the component skips its internal state update. */
  cancel: () => void
  /** Let the event propagate where the source component would stop it. */
  allowPropagation: () => void
  readonly isCanceled: boolean
  readonly isPropagationAllowed: boolean
}

/**
 * Details of a *notification*, not a change: commit-style callbacks
 * (`onValueCommitted`, `onSortChange` — anything with no internal state write
 * to skip) carry this shape instead. Deliberately no `cancel()`: exposing one
 * that skips nothing would be a lie, and Base UI draws the same line
 * (`BaseUIGenericEventDetails`).
 */
export interface GenericEventDetails<Reason extends string = string> {
  reason: Reason
  event: Event
}

export function createGenericEventDetails<Reason extends string>(
  reason: Reason,
  event: Event = new Event('cadenza-ui'),
): GenericEventDetails<Reason> {
  return { reason, event }
}

export function createChangeEventDetails<Reason extends string>(
  reason: Reason,
  event: Event = new Event('cadenza-ui'),
): ChangeEventDetails<Reason> {
  let canceled = false
  let propagationAllowed = false
  return {
    reason,
    event,
    cancel() {
      canceled = true
    },
    allowPropagation() {
      propagationAllowed = true
    },
    get isCanceled() {
      return canceled
    },
    get isPropagationAllowed() {
      return propagationAllowed
    },
  }
}
