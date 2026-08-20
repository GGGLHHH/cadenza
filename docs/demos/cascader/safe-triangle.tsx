import type { CascaderNode } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import { Cascader } from '@gedatou/cadenza-ui'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// Visualizes the submenu hover-intent judgement (the "safe triangle"
// made famous by Amazon's navigation): inside the triangle formed by the
// cursor and the two near-edge corners of the opened subpanel, sweeping
// diagonally across sibling items does not switch the submenu away. The
// real implementation is Base UI's built-in Floating UI safePolygon (a
// dynamic polygon); what is drawn here is a teaching approximation.
const REGIONS: CascaderNode[] = [
  {
    value: 'united-states',
    label: 'United States',
    items: [
      {
        value: 'california',
        label: 'California',
        items: [
          { value: 'san-francisco', label: 'San Francisco' },
          { value: 'los-angeles', label: 'Los Angeles' },
          { value: 'san-diego', label: 'San Diego' },
        ],
      },
      {
        value: 'texas',
        label: 'Texas',
        items: [
          { value: 'houston', label: 'Houston' },
          { value: 'austin', label: 'Austin' },
        ],
      },
      {
        value: 'new-york',
        label: 'New York',
        items: [
          { value: 'new-york-city', label: 'New York City' },
          { value: 'buffalo', label: 'Buffalo' },
        ],
      },
      {
        value: 'washington',
        label: 'Washington',
        items: [
          { value: 'seattle', label: 'Seattle' },
          { value: 'tacoma', label: 'Tacoma' },
        ],
      },
      {
        value: 'florida',
        label: 'Florida',
        items: [
          { value: 'miami', label: 'Miami' },
          { value: 'orlando', label: 'Orlando' },
        ],
      },
    ],
  },
  {
    value: 'canada',
    label: 'Canada',
    items: [
      {
        value: 'ontario',
        label: 'Ontario',
        items: [
          { value: 'toronto', label: 'Toronto' },
          { value: 'ottawa', label: 'Ottawa' },
        ],
      },
      {
        value: 'quebec',
        label: 'Quebec',
        items: [
          { value: 'montreal', label: 'Montreal' },
          { value: 'quebec-city', label: 'Quebec City' },
        ],
      },
      {
        value: 'british-columbia',
        label: 'British Columbia',
        items: [
          { value: 'vancouver', label: 'Vancouver' },
          { value: 'victoria', label: 'Victoria' },
        ],
      },
      {
        value: 'alberta',
        label: 'Alberta',
        items: [
          { value: 'calgary', label: 'Calgary' },
          { value: 'edmonton', label: 'Edmonton' },
        ],
      },
    ],
  },
  {
    value: 'australia',
    label: 'Australia',
    items: [
      {
        value: 'new-south-wales',
        label: 'New South Wales',
        items: [
          { value: 'sydney', label: 'Sydney' },
          { value: 'newcastle', label: 'Newcastle' },
        ],
      },
      {
        value: 'victoria-au',
        label: 'Victoria',
        items: [
          { value: 'melbourne', label: 'Melbourne' },
          { value: 'geelong', label: 'Geelong' },
        ],
      },
      {
        value: 'queensland',
        label: 'Queensland',
        items: [
          { value: 'brisbane', label: 'Brisbane' },
          { value: 'cairns', label: 'Cairns' },
        ],
      },
    ],
  },
  {
    value: 'germany',
    label: 'Germany',
    items: [
      {
        value: 'bavaria',
        label: 'Bavaria',
        items: [
          { value: 'munich', label: 'Munich' },
          { value: 'nuremberg', label: 'Nuremberg' },
        ],
      },
      {
        value: 'hesse',
        label: 'Hesse',
        items: [
          { value: 'frankfurt', label: 'Frankfurt' },
          { value: 'wiesbaden', label: 'Wiesbaden' },
        ],
      },
    ],
  },
]

// The two endpoints of the subpanel edge nearest the cursor (cascading
// panels open sideways, so the left/right edges are the usual hit).
function nearEdge(x: number, y: number, rect: DOMRect): [string, string] {
  if (x <= rect.left)
    return [`${rect.left},${rect.top}`, `${rect.left},${rect.bottom}`]
  if (x >= rect.right)
    return [`${rect.right},${rect.top}`, `${rect.right},${rect.bottom}`]
  if (y <= rect.top)
    return [`${rect.left},${rect.top}`, `${rect.right},${rect.top}`]
  return [`${rect.left},${rect.bottom}`, `${rect.right},${rect.bottom}`]
}

// Slack (px) for the panel containment check: sibling panels may sit a
// few pixels apart, and the diagonal must not break while crossing the
// gap.
const containsPad = 8

export default function SafeTriangleDemo(): ReactElement {
  const [points, setPoints] = useState<string | null>(null)
  const anchorRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let lastX = 0
    let lastY = 0
    let seen = false
    let frame = 0

    function contains(rect: DOMRect, pad: number): boolean {
      return lastX >= rect.left - pad && lastX <= rect.right + pad
        && lastY >= rect.top - pad && lastY <= rect.bottom + pad
    }

    function update(): void {
      if (!seen)
        return
      // DOM order is the open chain: root → child → grandchild. The
      // diagonal only exists in one posture -- "cursor inside panel i,
      // heading for panel i+1"; a cursor inside none of the chain's
      // panels (it left the menu entirely) or already in the deepest one
      // has no target to protect. Only popups with data-open count:
      // during the exit animation the old popup is still in the DOM and
      // must no longer be a target. Popups portal to body, so a global
      // query also catches popups of other Cascader demos on the page --
      // kinship goes through aria-labelledby: the root popup points back
      // at this instance's trigger, a child popup points at the branch
      // item in its parent panel, and anything off the chain is skipped.
      const trigger = anchorRef.current?.querySelector('[data-slot="cascader-trigger"]')
      const chain: Element[] = []
      for (const popup of document.querySelectorAll(
        '[data-slot="cascader-popup"][data-open], [data-slot="cascader-submenu-popup"][data-open]',
      )) {
        const labelId = popup.getAttribute('aria-labelledby')
        const label = labelId === null ? null : document.getElementById(labelId)
        if (label === null)
          continue
        if (chain.length === 0 ? label === trigger : chain[chain.length - 1].contains(label))
          chain.push(popup)
      }
      const rects = chain.map(popup => popup.getBoundingClientRect())
      // The deepest panel the cursor actually sits in: drilling moves
      // forward, so where panel bounds overlap the deeper one wins --
      // taking the shallowest would judge a cursor that just crossed
      // into the subpanel as still in the parent, making the panel
      // underfoot the target.
      let index = rects.findLastIndex(rect => contains(rect, 0))
      // Not truly inside any panel = possibly crossing the few-pixel gap
      // between panels: the lenient check takes the shallowest hit and
      // treats the cursor as still in the departure panel, so the target
      // stays put and the diagonal does not flicker off mid-gap.
      if (index === -1)
        index = rects.findIndex(rect => contains(rect, containsPad))
      const target = index === -1 ? undefined : rects[index + 1]
      // Cursor already inside the target = it has arrived; there is no
      // diagonal left to protect. This guard also seals nearEdge's
      // degenerate fallback for interior points (a bottom-edge triangle
      // draped over the whole panel).
      if (target !== undefined && !contains(target, 0)) {
        const [a, b] = nearEdge(lastX, lastY, target)
        setPoints(`${lastX},${lastY} ${a} ${b}`)
        // Follow every frame while visible: after the popup mounts,
        // Floating UI may still adjust position/size -- that is only a
        // style change, so neither the pointer nor childList reports it.
        // With points unchanged, setState bails out on the same value
        // and no re-render happens; with no target the loop stops on its
        // own.
        frame = requestAnimationFrame(update)
        return
      }
      setPoints(null)
    }

    // Defer all measurement to the next frame: right at popup mount,
    // Floating UI's positioning has not landed yet, and a rect measured
    // at that instant sits at the viewport's (0,0) -- recomputing
    // synchronously would draw a triangle pointing at the top-left
    // corner. rAF runs after positioning settles and before paint, and
    // along the way coalesces consecutive pointermove events into one
    // pass per frame.
    function schedule(): void {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
    }

    function handleMove(event: PointerEvent): void {
      lastX = event.clientX
      lastY = event.clientY
      seen = true
      schedule()
    }

    // A subpanel closing itself on timeout or on selection sends no
    // pointer event, so leftovers are cleared by a DOM signal: a closing
    // popup unmounts from body, and that childList change is the cue to
    // recompute.
    const observer = new MutationObserver(schedule)
    observer.observe(document.body, { childList: true, subtree: true })
    window.addEventListener('pointermove', handleMove, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('pointermove', handleMove)
    }
  }, [])

  return (
    <>
      {/* The display:contents anchor exists only to find this instance's trigger; it takes no part in layout */}
      <span className="contents" ref={anchorRef}>
        <Cascader aria-label="Region" defaultOpen items={REGIONS} placeholder="Hover a branch, move diagonally into the subpanel" />
      </span>
      {points !== null && createPortal(
        <svg
          aria-hidden
          className="
            pointer-events-none fixed inset-0 z-50 block-full inline-full
          "
        >
          <polygon
            className="fill-primary/10 stroke-primary/50"
            points={points}
            strokeDasharray="4 4"
            strokeWidth={1.5}
          />
        </svg>,
        document.body,
      )}
    </>
  )
}
