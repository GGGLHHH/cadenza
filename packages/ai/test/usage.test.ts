import { EventType } from '@tanstack/ai/client'
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { addTokenUsage, useUsageTracker } from '../src/runtime/usage'

describe('useUsageTracker', () => {
  it('accumulates every RUN_FINISHED of a run and assigns it to the finished message', () => {
    const { result } = renderHook(() => useUsageTracker())
    act(() => {
      // intermediate tool iteration, AG-UI spec shape
      result.current.onChunk({ type: EventType.RUN_FINISHED, threadId: 't', runId: 'r1', usage: [{ inputTokens: 10, outputTokens: 5, totalTokens: 15 }] } as never)
      // final iteration, already rebuilt into TokenUsage
      result.current.onChunk({ type: EventType.RUN_FINISHED, threadId: 't', runId: 'r1', usage: { promptTokens: 20, completionTokens: 7, totalTokens: 27 } } as never)
      result.current.onFinish({ id: 'a1', role: 'assistant', parts: [] } as never)
    })
    expect(result.current.byMessage.get('a1')).toMatchObject({ promptTokens: 30, completionTokens: 12, totalTokens: 42 })
    expect(result.current.total.totalTokens).toBe(42)
    expect(result.current.lastRun?.totalTokens).toBe(42)
    act(() => result.current.reset())
    expect(result.current.total.totalTokens).toBe(0)
    expect(result.current.byMessage.size).toBe(0)
  })

  it('books only the run that finished, leaving a sibling run pending for its own message', () => {
    const { result } = renderHook(() => useUsageTracker())
    act(() => {
      result.current.onChunk({ type: EventType.RUN_FINISHED, threadId: 't', runId: 'r1', usage: { promptTokens: 10, completionTokens: 1, totalTokens: 11 } } as never)
      result.current.onChunk({ type: EventType.RUN_FINISHED, threadId: 't', runId: 'r2', usage: { promptTokens: 100, completionTokens: 2, totalTokens: 102 } } as never)
      result.current.onFinish({ id: 'b1', role: 'assistant', parts: [] } as never)
    })
    // r1 finished first, so it belongs to the message that closes first.
    expect(result.current.byMessage.get('b1')?.totalTokens).toBe(11)
    act(() => result.current.onFinish({ id: 'a1', role: 'assistant', parts: [] } as never))
    expect(result.current.byMessage.get('a1')?.totalTokens).toBe(102)
    expect(result.current.total.totalTokens).toBe(113)
  })

  it('keeps every detail key through a sum, not just the three it used to name', () => {
    // The modality breakdown was present on one run and gone the moment a
    // second landed, because the sum rebuilt the details object from a
    // hand-written key list.
    const sum = addTokenUsage(
      { promptTokens: 10, completionTokens: 2, totalTokens: 12, cost: 0.5, promptTokensDetails: { cachedTokens: 4, imageTokens: 6, textTokens: 4 }, completionTokensDetails: { audioTokens: 1 } },
      { promptTokens: 20, completionTokens: 3, totalTokens: 23, cost: 0.25, promptTokensDetails: { cachedTokens: 5, imageTokens: 1 }, completionTokensDetails: { reasoningTokens: 2 } },
    )
    expect(sum.promptTokensDetails).toEqual({ cachedTokens: 9, imageTokens: 7, textTokens: 4 })
    expect(sum.completionTokensDetails).toEqual({ audioTokens: 1, reasoningTokens: 2 })
    // The provider's own figure is additive across runs too.
    expect(sum.cost).toBeCloseTo(0.75, 10)
  })

  it('adds nested details', () => {
    const sum = addTokenUsage(
      { promptTokens: 1, completionTokens: 1, totalTokens: 2, promptTokensDetails: { cachedTokens: 1 } },
      { promptTokens: 1, completionTokens: 1, totalTokens: 2, promptTokensDetails: { cachedTokens: 2 }, completionTokensDetails: { reasoningTokens: 4 } },
    )
    expect(sum.promptTokensDetails?.cachedTokens).toBe(3)
    expect(sum.completionTokensDetails?.reasoningTokens).toBe(4)
  })
})
