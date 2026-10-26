import type { ComponentProps, ReactElement } from 'react'

/**
 * The check animate-ui's selection indicators draw: the shape of its animated
 * `Check` icon (`m4 12 5 5L20 6`), as a plain svg.
 *
 * Plain on purpose. Those indicators (Checkbox, and the Select, Combobox, Menu
 * and Cascader item indicators) animate their check's path themselves — the
 * stroke drawing in, a radio's check gliding to the picked row. The animated
 * `Check` icon brings Motion variants of its own for the same path, and its
 * resting `pathLength: 1` wins: every unchecked row showed a check. So the
 * indicators take the bare shape, and their own draw is the animation.
 *
 * Private: not exported from `@gedatou/cadenza-ui/icons`.
 */
export function IndicatorCheck(props: ComponentProps<'svg'>): ReactElement {
  return (
    <svg
      fill="none"
      height={24}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      width={24}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="m4 12 5 5L20 6" />
    </svg>
  )
}
