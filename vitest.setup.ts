import { MotionGlobalConfig } from 'motion/react'

// Motion's own test switch: every animation completes at once. Without it the
// popups' exit animations (AnimatePresence holds the unmount until they end)
// run at real duration in jsdom, and a "closed popup is gone" assertion races
// them under load. Same motion instance as animate-ui's (one version, one
// motion-utils), so the flag reaches its components.
MotionGlobalConfig.skipAnimations = true

// jsdom implements neither matchMedia nor the Web Animations API, and
// animate-ui uses both: matchMedia for prefers-reduced-motion, Element.animate
// / getAnimations for its WAAPI legs (backdrop fade, list stagger). The stubs
// finish every animation at once, so tests see the settled state
// deterministically. SVGGeometryElement only feeds an `instanceof` that picks
// the check indicator's stroke draw; absent, the fade branch runs.
// Node-environment tests (vendored-sources) run this file too, without a window.
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}

if (typeof Element !== 'undefined' && typeof Element.prototype.animate !== 'function') {
  Object.defineProperty(Element.prototype, 'animate', {
    writable: true,
    configurable: true,
    value: () => {
      const animation = {
        finished: Promise.resolve(),
        playState: 'finished',
        currentTime: 0,
        onfinish: null as (() => void) | null,
        oncancel: null,
        cancel: () => {},
        finish: () => {},
        play: () => {},
        pause: () => {},
        reverse: () => {},
        commitStyles: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
      }
      queueMicrotask(() => animation.onfinish?.())
      return animation
    },
  })
}

// Base UI waits for running animations before unmounting whenever an element
// has getAnimations — which the stub below now provides. Its own test switch
// keeps that wait off, so Base UI behaves as it did on bare jsdom.
Object.assign(globalThis, { BASE_UI_ANIMATIONS_DISABLED: true })

if (typeof Element !== 'undefined' && typeof Element.prototype.getAnimations !== 'function') {
  Object.defineProperty(Element.prototype, 'getAnimations', { value: () => [], writable: true, configurable: true })
}

if (typeof window !== 'undefined' && !('SVGGeometryElement' in window)) {
  Object.defineProperty(window, 'SVGGeometryElement', { value: class extends SVGElement {}, writable: true, configurable: true })
}

// ahooks pulls in the intersection-observer polyfill, which installs itself
// when the global is missing. Under jsdom every rect is zero, so it reads a
// flush edge as an intersection, and it rechecks on every DOM mutation —
// which Motion now makes each frame — firing load-more sentinels at random.
// The tests' premise is an observer jsdom never trips. The polyfill stands
// down only when the observer AND an entry class with `intersectionRatio` on
// its prototype are both present, so both are provided.
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'IntersectionObserverEntry', {
    writable: true,
    configurable: true,
    // Getters, not fields: the polyfill checks the prototype.
    value: class {
      get intersectionRatio(): number { return 0 }
      get isIntersecting(): boolean { return false }
    },
  })
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: class {
      readonly root = null
      readonly rootMargin = '0px'
      readonly thresholds = []
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
      takeRecords(): [] { return [] }
    },
  })
}
