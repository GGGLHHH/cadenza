/**
 * The house popup shell, animation included — the Cascader popup's treatment,
 * shared by the date pickers. Width is deliberately absent: a calendar popup
 * sizes to its grid, not to its anchor.
 */
export const popupClassName = `
  origin-(--transform-origin) overflow-hidden rounded-lg bg-popover
  text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100
  outline-none
  data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95
  data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95
  data-[side=bottom]:slide-in-from-top-2
  data-[side=inline-end]:slide-in-from-left-2
  data-[side=inline-start]:slide-in-from-right-2
  data-[side=left]:slide-in-from-right-2
  data-[side=right]:slide-in-from-left-2
  data-[side=top]:slide-in-from-bottom-2
`

/** How date hidden inputs serialise for the form, whatever `format` displays. */
export const SERIAL_FORMAT = 'yyyy-MM-dd'
