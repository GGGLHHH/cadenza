import type { AnyTextAdapter } from '@tanstack/ai'
import type { Model, Provider, ThinkingLevel } from '../catalog/types'

/**
 * 服务端 provider 预设：目录里的纯数据 `Provider` 加上三件只在服务端存在的事——
 * 建 adapter、把归一后的 thinking 档位翻成 provider 私有的 `modelOptions` 片段、
 * （可选）用 key 在线发现模型。
 */
export interface ProviderPreset extends Provider {
  /** 用 BYOK / env 解析出的 key 建 adapter；`keyRequired: false` 的 provider 会收到 `null`。 */
  create: (model: string, key: string | null) => AnyTextAdapter
  /** 纯函数：clamp 后的档位 → provider 的 `modelOptions` 片段（真源见 spec 附录 A）。 */
  thinking: (level: ThinkingLevel, model: Model) => Record<string, unknown>
  discoverModels?: (key: string | null) => Promise<Model[]>
}

/** 恒等 + 校验 byok slug 与 preset id 一致（客户端头名 `x-byok-<id>` 由 id 生成）。 */
export function definePreset(preset: ProviderPreset): ProviderPreset {
  if (preset.byok && preset.byok.id !== preset.id)
    throw new Error(`cadenza-ai: preset "${preset.id}" declares a BYOK provider with a different id "${preset.byok.id}".`)
  return preset
}
