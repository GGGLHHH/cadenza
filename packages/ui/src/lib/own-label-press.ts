/**
 * The reasons a press on the label reaches a popup root as a close. Base UI
 * fires `outside-press` on the pointer going down outside the popup, then
 * `cancel-open` for the same gesture when it also comes up outside — one press
 * on the label produces both, and both have to be let through.
 */
export const LABEL_PRESS_REASONS = new Set<string>(['outside-press', 'cancel-open'])

/**
 * Is this press on a `<label>` that points at our own trigger?
 *
 * Such a press is not "outside" the control in any sense the user would
 * recognise: a label IS its control. Base UI cannot know that — it dismisses on
 * `pointerdown` anywhere outside the popup — while the browser goes on to
 * forward the label's `click` to the trigger, which toggles. Left alone the two
 * add up to a close followed by an open, which reads as a flicker. Popup-hosting
 * form controls (Select, Cascader) cancel the close when this returns true.
 */
export function isOwnLabelPress(event: Event, trigger: HTMLElement | null): boolean {
  if (trigger === null || !(event.target instanceof Element))
    return false
  const label = event.target.closest('label')
  return label !== null && label.control === trigger
}
