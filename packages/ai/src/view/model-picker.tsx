'use client'
import type { ComboboxChangeEventDetails, SelectChangeEventDetails } from '@gedatou/cadenza-ui'
import type { ByokSnapshot } from '@tanstack/ai-client/byok'
import type { ReactElement } from 'react'
import type { Catalog, Model, ThinkingLevel } from '../catalog/types'
import {
  Button,
  Combobox,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxTrigger,
  ComboboxValue,
  dataAttr,
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@gedatou/cadenza-ui'
import { IconBrain, IconKey, IconPhoto } from '@tabler/icons-react'
import { useMemo } from 'react'
import { modelRef } from '../catalog/catalog'
import { supportedThinkingLevels } from '../catalog/thinking'

/** The Combobox's own details, passed straight through — `item-press` in practice, `none` for programmatic changes. */
export type ModelPickerChangeEventDetails = ComboboxChangeEventDetails

export interface ModelPickerProps {
  catalog: Catalog
  /** A `provider/model` ref. */
  value?: string
  defaultValue?: string
  onValueChange: (ref: string, details: ModelPickerChangeEventDetails) => void
  /** With a snapshot, providers whose key is required but `empty` get `data-key-missing` on their heading. */
  byok?: ByokSnapshot
  disabledProviders?: readonly string[]
  /** Lands on the trigger button. */
  className?: string
}

interface ProviderGroup {
  value: string
  items: readonly string[]
}

function formatContext(tokens: number): string {
  return tokens >= 1_000_000 ? `${Math.round(tokens / 100_000) / 10}M` : `${Math.round(tokens / 1000)}k`
}

/** A searchable, provider-grouped model list; the value is the model ref. */
export function ModelPicker({ byok, catalog, className, defaultValue, disabledProviders, onValueChange, value }: ModelPickerProps): ReactElement {
  const groups = useMemo<ProviderGroup[]>(
    () => catalog.providers.map(provider => ({ value: provider.id, items: provider.models.map(modelRef) })),
    [catalog],
  )
  // Search matches id, name and provider; the haystack is precomputed per ref.
  const haystack = useMemo(() => new Map(catalog.models.map((model) => {
    const provider = catalog.getProvider(model.provider)
    return [modelRef(model), `${model.name} ${model.id} ${provider?.label ?? ''} ${model.provider}`.toLowerCase()]
  })), [catalog])
  return (
    <Combobox<string>
      defaultValue={defaultValue}
      filter={(ref, query) => haystack.get(ref)?.includes(query.trim().toLowerCase()) === true}
      items={groups}
      value={value}
      onValueChange={(ref, details) => {
        // Single-select with the input inside the popup never clears; `null`
        // is only in the type.
        if (ref !== null)
          onValueChange(ref, details)
      }}
    >
      <ComboboxTrigger className={className} data-slot="model-picker" render={<Button size="sm" variant="outline" />}>
        <ComboboxValue>{(ref: string | null) => (ref === null ? null : catalog.getModel(ref)?.name ?? ref)}</ComboboxValue>
      </ComboboxTrigger>
      <ComboboxPopup>
        <ComboboxInput aria-label="Search models" clearable={false} trigger={false} />
        <ComboboxEmpty />
        <ComboboxList>
          {(group: ProviderGroup) => {
            const provider = catalog.getProvider(group.value)
            const keyMissing = provider?.keyRequired === true && byok?.status[group.value]?.state === 'empty'
            return (
              <ComboboxGroup key={group.value} items={group.items}>
                <ComboboxGroupLabel className="flex items-center gap-1" data-key-missing={dataAttr(keyMissing)}>
                  {provider?.label ?? group.value}
                  {keyMissing && (
                    <IconKey
                      aria-label="Key missing"
                      className="block-3.5 inline-3.5"
                    />
                  )}
                </ComboboxGroupLabel>
                <ComboboxCollection>
                  {(ref: string) => {
                    const model = catalog.getModel(ref)
                    return (
                      <ComboboxItem key={ref} disabled={disabledProviders?.includes(group.value)} value={ref}>
                        <span className="flex-1 truncate">{model?.name ?? ref}</span>
                        {model?.reasoning === true && (
                          <IconBrain
                            aria-label="Reasoning"
                            className="text-muted-foreground"
                          />
                        )}
                        {model?.input.includes('image') === true && (
                          <IconPhoto
                            aria-label="Vision"
                            className="text-muted-foreground"
                          />
                        )}
                        {model?.contextWindow !== undefined && (
                          <span className="
                            text-xs text-muted-foreground tabular-nums
                          "
                          >
                            {formatContext(model.contextWindow)}
                          </span>
                        )}
                      </ComboboxItem>
                    )
                  }}
                </ComboboxCollection>
              </ComboboxGroup>
            )
          }}
        </ComboboxList>
      </ComboboxPopup>
    </Combobox>
  )
}

/** The Select's own details, passed straight through. */
export type ThinkingLevelPickerChangeEventDetails = SelectChangeEventDetails

export interface ThinkingLevelPickerProps {
  model?: Model
  value?: ThinkingLevel
  defaultValue?: ThinkingLevel
  onValueChange: (level: ThinkingLevel, details: ThinkingLevelPickerChangeEventDetails) => void
  /** Lands on the trigger button. */
  className?: string
}

/** The model's supported thinking levels; renders nothing when there is no choice to make. */
export function ThinkingLevelPicker({ className, defaultValue, model, onValueChange, value }: ThinkingLevelPickerProps): ReactElement | null {
  const levels = supportedThinkingLevels(model)
  if (levels.length <= 1)
    return null
  return (
    <Select<ThinkingLevel>
      clearable={false}
      defaultValue={defaultValue}
      value={value}
      onValueChange={(level, details) => {
        if (level !== null)
          onValueChange(level, details)
      }}
    >
      <SelectTrigger aria-label="Thinking level" className={className} data-slot="thinking-level-picker" size="sm">
        <SelectValue />
      </SelectTrigger>
      <SelectPopup>
        {levels.map(level => <SelectItem key={level} value={level}>{level}</SelectItem>)}
      </SelectPopup>
    </Select>
  )
}
