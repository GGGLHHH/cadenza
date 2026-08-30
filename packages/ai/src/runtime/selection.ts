'use client'
import type { Catalog, Model, Provider, ThinkingLevel } from '../catalog/types'
import { useCallback, useMemo } from 'react'
import { modelRef, parseModelRef } from '../catalog/catalog'
import { defaultCatalog } from '../catalog/index'
import { clampThinkingLevel } from '../catalog/thinking'
import { useStoredState } from './stored-state'

export interface ModelSelection {
  provider: string
  model: string
  thinking: ThinkingLevel
  /** 厂商侧联网搜索开关；模型没有这个能力时恒为 false。 */
  search: boolean
}

/**
 * 存储里那一份。`useStoredState` 是 `JSON.parse(raw) as T`——不校验，所以任何字段都
 * 可能缺（早于 `search` 的那些选择就没有它）。用 `Partial` 说实话，编译器才会逼着
 * `normalize` 补每一个缺口，而不是让下一个新字段原样重演同一个 bug。
 */
type StoredSelection = Partial<ModelSelection>

export interface UseModelSelectionOptions {
  catalog?: Catalog
  /** `localStorage` key. Default `cadenza-ai:selection`. */
  key?: string
  /** Default: the catalog's first model with thinking off. */
  initial?: ModelSelection
}

export interface UseModelSelectionReturn {
  selection: ModelSelection
  model: Model | undefined
  provider: Provider | undefined
  /** `provider/model`; the thinking level is clamped to what the new model supports, and search drops if it has none. */
  setModel: (ref: string) => void
  setThinking: (level: ThinkingLevel) => void
  setSearch: (on: boolean) => void
  /** 就是上面那个 `selection`，按 `useChat({ forwardedProps })` 的用法起的名字；渲染间稳定。 */
  forwardedProps: ModelSelection
}

function firstSelection(catalog: Catalog): ModelSelection {
  const model = catalog.models[0]
  return { provider: model?.provider ?? '', model: model?.id ?? '', thinking: 'off', search: false }
}

/** 只有模型声明了 `search` 才可能是 on——同 `clampThinkingLevel` 的道理：能力由目录说了算，不由存储说了算。 */
function clampSearch(model: Model | undefined, on: boolean | undefined): boolean {
  return on === true && model?.search === true
}

/**
 * 存储里那份，修成控件能用的形状。两条规矩，来源不同：
 *
 * 1. **字段必须存在、类型必须对。** 控件把 `undefined` 当受控值会出事——
 *    `useControllableState` 在首帧按 `value !== undefined` 锁死受控性且不再改判，
 *    于是 `SearchToggle` / `ThinkingToggle` 整场会话都改吃自己的内部状态，第一次
 *    按下还会触发受控性告警。这一条无条件执行。
 * 2. **按能力裁剪，只在目录认识这个模型时做。** 「目录里没这条」和「这个模型没这个
 *    能力」是两回事：目录改名或删掉一个条目，就会让所有 `getModel` 落空，把它当成
 *    「什么都不支持」会静默擦掉用户的选择。
 *
 * 裁剪只作用于读出来的这一份。写回存储的永远是原值展开——目录暂时不认识某个模型，
 * 不该成为把它的档位和搜索开关抹平的理由，存储里那些我们不认识的键也一并留着。
 */
function normalize(model: Model | undefined, stored: StoredSelection): ModelSelection {
  const base: ModelSelection = {
    provider: stored.provider ?? '',
    model: stored.model ?? '',
    thinking: stored.thinking ?? 'off',
    search: stored.search === true,
  }
  if (model === undefined)
    return base
  return { ...base, thinking: clampThinkingLevel(model, base.thinking), search: clampSearch(model, base.search) }
}

/** The user's model + thinking choice, persisted, always valid for the chosen model. */
export function useModelSelection(options: UseModelSelectionOptions = {}): UseModelSelectionReturn {
  const catalog = options.catalog ?? defaultCatalog
  const [stored, setStored] = useStoredState<StoredSelection>(options.key ?? 'cadenza-ai:selection', options.initial ?? firstSelection(catalog))
  const model = catalog.getModel(modelRef({ provider: stored.provider ?? '', id: stored.model ?? '' }))
  const provider = catalog.getProvider(stored.provider ?? '')
  const selection = useMemo(() => normalize(model, stored), [model, stored])
  const setModel = useCallback((ref: string): void => {
    const { provider: nextProvider, id } = parseModelRef(ref)
    const next = catalog.getModel(ref)
    setStored({ ...stored, provider: nextProvider, model: id, thinking: clampThinkingLevel(next, stored.thinking ?? 'off'), search: clampSearch(next, stored.search) })
  }, [catalog, stored, setStored])
  const setThinking = useCallback((level: ThinkingLevel): void => {
    setStored({ ...stored, thinking: clampThinkingLevel(model, level) })
  }, [model, stored, setStored])
  const setSearch = useCallback((on: boolean): void => {
    setStored({ ...stored, search: clampSearch(model, on) })
  }, [model, stored, setStored])
  return { selection, model, provider, setModel, setThinking, setSearch, forwardedProps: selection }
}
