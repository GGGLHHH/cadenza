import type { ReactElement, ReactNode } from 'react'
import { ArrowRight, Bot, Heart } from '@gedatou/cadenza-ui/icons'

function Cell({ children, label }: { children: ReactNode, label: string }): ReactElement {
  return (
    <div className="flex flex-col items-center gap-2">
      {children}
      <code className="text-xs text-muted-foreground">{label}</code>
    </div>
  )
}

// One icon, several named animations: `animation` picks which one a trigger
// plays. `path` and `path-loop` (drawing the strokes in) work on every icon.
export default function AnimationsDemo(): ReactElement {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap gap-8">
        <Cell label="default"><Bot animateOnHover /></Cell>
        <Cell label="blink"><Bot animateOnHover animation="blink" /></Cell>
        <Cell label="wink"><Bot animateOnHover animation="wink" /></Cell>
      </div>
      <div className="flex flex-wrap gap-8">
        <Cell label="default"><ArrowRight animateOnHover /></Cell>
        <Cell label="pointing"><ArrowRight animateOnHover animation="pointing" /></Cell>
        <Cell label="out"><ArrowRight animateOnHover animation="out" /></Cell>
      </div>
      <div className="flex flex-wrap gap-8">
        <Cell label="path"><Heart animateOnHover animation="path" /></Cell>
        <Cell label="path-loop"><Heart animate animation="path-loop" loop /></Cell>
      </div>
    </div>
  )
}
