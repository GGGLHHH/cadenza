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

  it('adds nested details', () => {
    const sum = addTokenUsage(
      { promptTokens: 1, completionTokens: 1, totalTokens: 2, promptTokensDetails: { cachedTokens: 1 } },
      { promptTokens: 1, completionTokens: 1, totalTokens: 2, promptTokensDetails: { cachedTokens: 2 }, completionTokensDetails: { reasoningTokens: 4 } },
    )
    expect(sum.promptTokensDetails?.cachedTokens).toBe(3)
    expect(sum.completionTokensDetails?.reasoningTokens).toBe(4)
  })
})
