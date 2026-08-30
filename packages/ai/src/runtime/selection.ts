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
  /** Stable object for `useChat({ forwardedProps })`. */
  forwardedProps: ModelSelection
}

function firstSelection(catalog: Catalog): ModelSelection {
  const model = catalog.models[0]
  return { provider: model?.provider ?? '', model: model?.id ?? '', thinking: 'off', search: false }
}

/** 只有模型声明了 `search` 才可能是 on——同 `clampThinkingLevel` 的道理：能力由目录说了算，不由存储说了算。 */
function clampSearch(model: Model | undefined, on: boolean): boolean {
  return on && model?.search === true
}

/** The user's model + thinking choice, persisted, always valid for the chosen model. */
export function useModelSelection(options: UseModelSelectionOptions = {}): UseModelSelectionReturn {
  const catalog = options.catalog ?? defaultCatalog
  const [selection, setSelection] = useStoredState<ModelSelection>(options.key ?? 'cadenza-ai:selection', options.initial ?? firstSelection(catalog))
  const model = catalog.getModel(modelRef({ provider: selection.provider, id: selection.model }))
  const provider = catalog.getProvider(selection.provider)
  const setModel = useCallback((ref: string): void => {
    const { provider: nextProvider, id } = parseModelRef(ref)
    const next = catalog.getModel(ref)
    setSelection({ provider: nextProvider, model: id, thinking: clampThinkingLevel(next, selection.thinking), search: clampSearch(next, selection.search) })
  }, [catalog, selection.thinking, selection.search, setSelection])
  const setThinking = useCallback((level: ThinkingLevel): void => {
    setSelection({ ...selection, thinking: clampThinkingLevel(model, level) })
  }, [model, selection, setSelection])
  const setSearch = useCallback((on: boolean): void => {
    setSelection({ ...selection, search: clampSearch(model, on) })
  }, [model, selection, setSelection])
  // 读的时候也 clamp：存储里可能是早于这个字段的选择（undefined），也可能是
  // 换模型之外的途径留下的、与当前模型能力不符的 true。
  const search = clampSearch(model, selection.search === true)
  const forwardedProps = useMemo(
    () => ({ provider: selection.provider, model: selection.model, thinking: selection.thinking, search }),
    [selection.provider, selection.model, selection.thinking, search],
  )
  return { selection, model, provider, setModel, setThinking, setSearch, forwardedProps }
}
