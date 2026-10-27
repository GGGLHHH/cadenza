import type { ReactElement, ReactNode } from 'react'
import { ArrowRightIcon, BotIcon, HeartIcon } from '@gedatou/cadenza-icons'

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
        <Cell label="default"><BotIcon animateOnHover /></Cell>
        <Cell label="blink"><BotIcon animateOnHover animation="blink" /></Cell>
        <Cell label="wink"><BotIcon animateOnHover animation="wink" /></Cell>
      </div>
      <div className="flex flex-wrap gap-8">
        <Cell label="default"><ArrowRightIcon animateOnHover /></Cell>
        <Cell label="pointing"><ArrowRightIcon animateOnHover animation="pointing" /></Cell>
        <Cell label="out"><ArrowRightIcon animateOnHover animation="out" /></Cell>
      </div>
      <div className="flex flex-wrap gap-8">
        <Cell label="path"><HeartIcon animateOnHover animation="path" /></Cell>
        <Cell label="path-loop"><HeartIcon animate animation="path-loop" loop /></Cell>
      </div>
    </div>
  )
}
