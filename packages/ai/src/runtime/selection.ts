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
  /** `provider/model`; the thinking level is clamped to what the new model supports. */
  setModel: (ref: string) => void
  setThinking: (level: ThinkingLevel) => void
  /** Stable object for `useChat({ forwardedProps })`. */
  forwardedProps: ModelSelection
}

function firstSelection(catalog: Catalog): ModelSelection {
  const model = catalog.models[0]
  return { provider: model?.provider ?? '', model: model?.id ?? '', thinking: 'off' }
}

/** The user's model + thinking choice, persisted, always valid for the chosen model. */
export function useModelSelection(options: UseModelSelectionOptions = {}): UseModelSelectionReturn {
  const catalog = options.catalog ?? defaultCatalog
  const [selection, setSelection] = useStoredState<ModelSelection>(options.key ?? 'cadenza-ai:selection', options.initial ?? firstSelection(catalog))
  const model = catalog.getModel(modelRef({ provider: selection.provider, id: selection.model }))
  const provider = catalog.getProvider(selection.provider)
  const setModel = useCallback((ref: string): void => {
    const { provider: nextProvider, id } = parseModelRef(ref)
    setSelection({ provider: nextProvider, model: id, thinking: clampThinkingLevel(catalog.getModel(ref), selection.thinking) })
  }, [catalog, selection.thinking, setSelection])
  const setThinking = useCallback((level: ThinkingLevel): void => {
    setSelection({ ...selection, thinking: clampThinkingLevel(model, level) })
  }, [model, selection, setSelection])
  const forwardedProps = useMemo(
    () => ({ provider: selection.provider, model: selection.model, thinking: selection.thinking }),
    [selection.provider, selection.model, selection.thinking],
  )
  return { selection, model, provider, setModel, setThinking, forwardedProps }
}
