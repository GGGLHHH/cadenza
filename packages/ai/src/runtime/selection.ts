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

/**
 * 只有模型声明了 `search` 才可能是 on——同 `clampThinkingLevel` 的道理：能力由目录
 * 说了算，不由存储说了算。`on === true` 而不是 `on`：存储里的这个字段可能根本不存在
 * （早于它的那些选择），而 `undefined && …` 求值成 `undefined`，会把这个形状一路原样
 * 写回去。返回值必须是布尔。
 */
function clampSearch(model: Model | undefined, on: boolean | undefined): boolean {
  return on === true && model?.search === true
}

/** The user's model + thinking choice, persisted, always valid for the chosen model. */
export function useModelSelection(options: UseModelSelectionOptions = {}): UseModelSelectionReturn {
  const catalog = options.catalog ?? defaultCatalog
  const [selection, setSelection] = useStoredState<ModelSelection>(options.key ?? 'cadenza-ai:selection', options.initial ?? firstSelection(catalog))
  const model = catalog.getModel(modelRef({ provider: selection.provider, id: selection.model }))
  const provider = catalog.getProvider(selection.provider)
  // 读的时候也 clamp，而且 clamp 后的那一份就是对外的全部——`selection`、
  // `forwardedProps` 和三个 setter 的基底都是它。存储里可能是早于这个字段的选择
  // （`search: undefined`），也可能是换模型之外的途径留下的、与当前模型能力不符的
  // `true`。`selection` 是控件读的那一份，漏给它一个 undefined 会出事：
  // `useControllableState` 在首帧按 `value !== undefined` 锁死受控性，于是
  // `SearchToggle` 整场会话都改吃自己的内部状态，第一次按下还会触发受控性告警。
  const search = clampSearch(model, selection.search)
  const current = useMemo(
    () => ({ provider: selection.provider, model: selection.model, thinking: selection.thinking, search }),
    [selection.provider, selection.model, selection.thinking, search],
  )
  const setModel = useCallback((ref: string): void => {
    const { provider: nextProvider, id } = parseModelRef(ref)
    const next = catalog.getModel(ref)
    setSelection({ provider: nextProvider, model: id, thinking: clampThinkingLevel(next, current.thinking), search: clampSearch(next, current.search) })
  }, [catalog, current.thinking, current.search, setSelection])
  const setThinking = useCallback((level: ThinkingLevel): void => {
    setSelection({ ...current, thinking: clampThinkingLevel(model, level) })
  }, [current, model, setSelection])
  const setSearch = useCallback((on: boolean): void => {
    setSelection({ ...current, search: clampSearch(model, on) })
  }, [current, model, setSelection])
  return { selection: current, model, provider, setModel, setThinking, setSearch, forwardedProps: current }
}
