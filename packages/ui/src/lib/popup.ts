/**
 * The house popup shell — the Cascader popup's treatment, shared by the date
 * pickers. Width is deliberately absent: a calendar popup sizes to its grid,
 * not to its anchor. No animation classes: these popups are animate-ui
 * popovers, which drive enter/exit (and the transform origin) with Motion.
 */
export const popupClassName = `
  overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-md
  ring-1 ring-foreground/10 outline-none
`

/** How date hidden inputs serialise for the form, whatever `format` displays. */
export const SERIAL_FORMAT = 'yyyy-MM-dd'
