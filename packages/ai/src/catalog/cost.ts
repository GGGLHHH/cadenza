import type { Model, TokenUsage } from './types'

/** USD；`cost` 缺失返回 undefined。cached 部分按 `cacheRead`（缺省同 `input`）计价。 */
export function estimateCost(model: Model, usage: TokenUsage): number | undefined {
  const cost = model.cost
  if (!cost)
    return undefined
  const cached = usage.promptTokensDetails?.cachedTokens ?? 0
  const fresh = Math.max(usage.promptTokens - cached, 0)
  const cacheRead = cost.cacheRead ?? cost.input
  return (fresh * cost.input + cached * cacheRead + usage.completionTokens * cost.output) / 1_000_000
}
