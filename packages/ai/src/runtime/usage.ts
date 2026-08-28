'use client'
// `TokenUsage` lives on the `@tanstack/ai` root only (type-only import, no server code pulled in).
import type { TokenUsage } from '@tanstack/ai'
import type { UIMessage } from '@tanstack/ai-client'
import type { StreamChunk } from '@tanstack/ai/client'
import { EventType, fromSpecTokenUsage } from '@tanstack/ai/client'
import { useCallback, useMemo, useRef, useState } from 'react'

function add(a: number | undefined, b: number | undefined): number | undefined {
  return a === undefined && b === undefined ? undefined : (a ?? 0) + (b ?? 0)
}

/** Field-wise sum, including the nested cache / reasoning details. */
export function addTokenUsage(a: TokenUsage | undefined, b: TokenUsage): TokenUsage {
  if (!a)
    return b
  const promptTokensDetails = a.promptTokensDetails || b.promptTokensDetails
    ? {
        cachedTokens: add(a.promptTokensDetails?.cachedTokens, b.promptTokensDetails?.cachedTokens),
        cacheWriteTokens: add(a.promptTokensDetails?.cacheWriteTokens, b.promptTokensDetails?.cacheWriteTokens),
      }
    : undefined
  const completionTokensDetails = a.completionTokensDetails || b.completionTokensDetails
    ? { reasoningTokens: add(a.completionTokensDetails?.reasoningTokens, b.completionTokensDetails?.reasoningTokens) }
    : undefined
  return {
    promptTokens: a.promptTokens + b.promptTokens,
    completionTokens: a.completionTokens + b.completionTokens,
    totalTokens: a.totalTokens + b.totalTokens,
    ...(promptTokensDetails ? { promptTokensDetails } : {}),
    ...(completionTokensDetails ? { completionTokensDetails } : {}),
  }
}

export interface UsageTracker {
  /** Wire to `useChat({ onChunk })`. */
  onChunk: (chunk: StreamChunk) => void
  /** Wire to `useChat({ onFinish })`; assigns the run's usage to the finished message. */
  onFinish: (message: UIMessage) => void
  total: TokenUsage
  lastRun: TokenUsage | undefined
  byMessage: ReadonlyMap<string, TokenUsage>
  reset: () => void
}

const ZERO: TokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 }

type RunFinished = Extract<StreamChunk, { type: typeof EventType.RUN_FINISHED }>

function usageOf(chunk: RunFinished): TokenUsage | undefined {
  const usage = chunk.usage
  if (usage === undefined)
    return undefined
  if (Array.isArray(usage))
    return fromSpecTokenUsage(usage, chunk.metadata?.tanstack?.usage)
  return usage
}

/**
 * Sums every `RUN_FINISHED` of a run (tool loops finish once per iteration)
 * and books the sum against the assistant message that closes the run.
 */
export function useUsageTracker(): UsageTracker {
  const pendingRef = useRef(new Map<string, TokenUsage>())
  const [state, setState] = useState<{ total: TokenUsage, lastRun: TokenUsage | undefined, byMessage: Map<string, TokenUsage> }>(() => ({ total: ZERO, lastRun: undefined, byMessage: new Map() }))

  const onChunk = useCallback((chunk: StreamChunk): void => {
    if (chunk.type !== EventType.RUN_FINISHED)
      return
    const usage = usageOf(chunk)
    if (!usage)
      return
    pendingRef.current.set(chunk.runId, addTokenUsage(pendingRef.current.get(chunk.runId), usage))
  }, [])

  const onFinish = useCallback((message: UIMessage): void => {
    let run: TokenUsage | undefined
    for (const usage of pendingRef.current.values())
      run = addTokenUsage(run, usage)
    pendingRef.current.clear()
    if (!run)
      return
    const booked = run
    setState((s) => {
      const byMessage = new Map(s.byMessage)
      byMessage.set(message.id, booked)
      return { total: addTokenUsage(s.total, booked), lastRun: booked, byMessage }
    })
  }, [])

  const reset = useCallback((): void => {
    pendingRef.current.clear()
    setState({ total: ZERO, lastRun: undefined, byMessage: new Map() })
  }, [])

  return useMemo(() => ({ onChunk, onFinish, reset, ...state }), [onChunk, onFinish, reset, state])
}
