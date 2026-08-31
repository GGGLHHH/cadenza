import type { Model, ThinkingLevel } from './types'

export const THINKING_LEVELS: readonly ThinkingLevel[] = ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max']

export function supportedThinkingLevels(model: Model | undefined): readonly ThinkingLevel[] {
  if (!model || !model.reasoning)
    return ['off']
  return model.thinkingLevels ?? THINKING_LEVELS
}

/**
 * 向下取最近支持档；目标低于模型下限（Fable 5 这类不可关的模型）时取下限。
 */
export function clampThinkingLevel(model: Model | undefined, level: ThinkingLevel): ThinkingLevel {
  const supported = supportedThinkingLevels(model)
  if (supported.includes(level))
    return level
  const rank = (l: ThinkingLevel): number => THINKING_LEVELS.indexOf(l)
  const below = supported.filter(l => rank(l) < rank(level))
  return below.length > 0 ? below[below.length - 1] : supported[0]
}
