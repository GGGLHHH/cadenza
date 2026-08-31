import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DEFAULT_PART_LABELS, definePartRenderers, PartRenderersProvider, usePartRenderers } from '../src/runtime/renderers'

function Probe(): ReactElement {
  const { renderers, labels } = usePartRenderers()
  const renderer = renderers.toolCall?.get_weather ?? renderers.toolCall?.default
  const hit = renderer ? renderer({ part: { type: 'tool-call', id: 'c', name: 'get_weather', arguments: '{"ci', state: 'input-streaming' } as never, result: undefined, interrupt: undefined, streaming: true }) : 'none'
  return <div data-hit={String(hit)}>{labels.approve}</div>
}

describe('part renderers', () => {
  it('falls back to defaults without a provider', () => {
    const { container } = render(<Probe />)
    expect(container.textContent).toBe(DEFAULT_PART_LABELS.approve)
    expect(container.firstElementChild?.getAttribute('data-hit')).toBe('none')
  })

  it('resolves by tool name, then default, and overrides labels', () => {
    const renderers = definePartRenderers({ toolCall: { default: () => 'D', get_weather: () => 'W' } })
    const { container, rerender } = render(<PartRenderersProvider renderers={renderers} labels={{ approve: 'OK' }}><Probe /></PartRenderersProvider>)
    expect(container.firstElementChild?.getAttribute('data-hit')).toBe('W')
    expect(container.textContent).toBe('OK')
    rerender(<PartRenderersProvider renderers={{ toolCall: { default: () => 'D' } }}><Probe /></PartRenderersProvider>)
    expect(container.firstElementChild?.getAttribute('data-hit')).toBe('D')
    expect(container.textContent).toBe(DEFAULT_PART_LABELS.approve)
  })

  it('a nested provider merges with the outer one instead of replacing it', () => {
    // `labels` always merged; `renderers` replaced wholesale, so a page that
    // customised one part type silently lost every renderer the app registered.
    const outer = definePartRenderers({ toolCall: { get_weather: () => 'W' } })
    const inner = definePartRenderers({ text: () => 'T' })
    const { container } = render(
      <PartRenderersProvider renderers={outer}>
        <PartRenderersProvider renderers={inner}><Probe /></PartRenderersProvider>
      </PartRenderersProvider>,
    )
    expect(container.firstElementChild?.getAttribute('data-hit')).toBe('W')
  })
})
