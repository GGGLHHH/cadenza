import type { Model, TokenUsage } from './types'

/** One modality's slice of a prompt or a completion. */
export interface ModalitySlice {
  kind: 'text' | 'image' | 'audio' | 'video' | 'document'
  tokens: number
  /** Of the side it belongs to (prompt or completion). */
  share: number
}

/**
 * 派生指标。每一项在**分母未知或为零**时是 `undefined` 而不是 0——「没有提示 token
 * 时的缓存命中率」不是零，是无从谈起，两者在界面上该有不同的下场（不显示，而不是
 * 显示一个 0%）。
 */
export interface UsageMetrics {
  /** `completionTokens / promptTokens`：一份提示换回多少回答。 */
  outputRatio: number | undefined
  /** `cachedTokens / promptTokens`：这次提示有多少是从缓存里读的。 */
  cacheHitRate: number | undefined
  /** `cacheWriteTokens / promptTokens`：有多少被写进了缓存（下次才省钱）。 */
  cacheWriteRate: number | undefined
  /** `reasoningTokens / completionTokens`：回答里有多少花在思考上。 */
  reasoningShare: number | undefined
  /** `promptTokens / model.contextWindow`：上下文占用，同 `ContextUsage` 那根条。 */
  contextRatio: number | undefined
  /**
   * 缓存读比照原价省下的美元。要模型同时给出 `input` 与 `cacheRead` 才算得出——
   * 没有 `cacheRead` 意味着缓存不打折，而不是省了 0。
   */
  cacheSavings: number | undefined
  /** 提示里各模态的占比，只列非零项，从大到小。 */
  promptModalities: readonly ModalitySlice[]
  /** 回答里各模态的占比，同上。 */
  completionModalities: readonly ModalitySlice[]
}

const MODALITIES = ['text', 'image', 'audio', 'video', 'document'] as const

/** 分母为零或缺失时返回 undefined，不返回 0。 */
function ratio(part: number | undefined, whole: number | undefined): number | undefined {
  if (part === undefined || whole === undefined || whole <= 0)
    return undefined
  return part / whole
}

function slices(details: object | undefined, whole: number): readonly ModalitySlice[] {
  if (!details || whole <= 0)
    return []
  // The detail interfaces are all-optional numbers but declare no index
  // signature, so reading them by a computed key needs the wider view.
  const by = details as Record<string, number | undefined>
  return MODALITIES
    .map((kind): ModalitySlice => ({ kind, tokens: by[`${kind}Tokens`] ?? 0, share: (by[`${kind}Tokens`] ?? 0) / whole }))
    .filter(s => s.tokens > 0)
    .sort((a, b) => b.tokens - a.tokens)
}

/**
 * `TokenUsage` 里读得出来的比例，一次算齐。
 *
 * 纯函数，和 `estimateCost` 并排住在目录层：这些数字两端都用得上，且与 React 无关。
 * 输入可以是 `useUsageTracker` 的任意一个粒度——`total` / `lastRun` / `byMessage` 的某一条。
 *
 * `model` 只有两项指标需要（`contextRatio` 要 `contextWindow`，`cacheSavings` 要价格），
 * 不给就是那两项为 `undefined`，其余照算。
 */
export function usageMetrics(usage: TokenUsage, model?: Model): UsageMetrics {
  const prompt = usage.promptTokensDetails
  const completion = usage.completionTokensDetails
  const cached = prompt?.cachedTokens
  const cost = model?.cost
  // `cacheRead ?? input` 的写法在这里是错的：缺 cacheRead 时省下的不是 0，是未知。
  const savings = cached !== undefined && cost?.cacheRead !== undefined
    ? (cached * (cost.input - cost.cacheRead)) / 1_000_000
    : undefined
  return {
    outputRatio: ratio(usage.completionTokens, usage.promptTokens),
    cacheHitRate: ratio(cached, usage.promptTokens),
    cacheWriteRate: ratio(prompt?.cacheWriteTokens, usage.promptTokens),
    reasoningShare: ratio(completion?.reasoningTokens, usage.completionTokens),
    contextRatio: ratio(usage.promptTokens, model?.contextWindow),
    cacheSavings: savings,
    promptModalities: slices(prompt, usage.promptTokens),
    completionModalities: slices(completion, usage.completionTokens),
  }
}
