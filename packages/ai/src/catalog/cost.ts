import type { Model, TokenUsage } from './types'

/**
 * USD；`cost` 缺失返回 undefined。
 *
 * 提示 token 分三档计价：命中缓存的按 `cacheRead`，写入缓存的按 `cacheWrite`
 * （Anthropic 是 input 的 1.25×），其余按 `input`；两个缓存价缺省都回落到 `input`。
 * 两个明细都当作含在 `promptTokens` 里扣除——`usage.ts` 的 `addTokenUsage` 正是这样
 * 累加它们的，而 `Math.max(…, 0)` 兜住厂商把它们单列在外的情形。
 */
export function estimateCost(model: Model, usage: TokenUsage): number | undefined {
  const cost = model.cost
  if (!cost)
    return undefined
  const cached = usage.promptTokensDetails?.cachedTokens ?? 0
  const written = usage.promptTokensDetails?.cacheWriteTokens ?? 0
  const fresh = Math.max(usage.promptTokens - cached - written, 0)
  const cacheRead = cost.cacheRead ?? cost.input
  const cacheWrite = cost.cacheWrite ?? cost.input
  return (fresh * cost.input + cached * cacheRead + written * cacheWrite + usage.completionTokens * cost.output) / 1_000_000
}
