'use client'
import type { ReactElement, ReactNode } from 'react'
import type { Model, TokenUsage } from '../catalog/types'
import type { ModalitySlice } from '../catalog/usage-metrics'
import { cn, Progress } from '@gedatou/cadenza-ui'
import { useId, useMemo } from 'react'
import { usageMetrics } from '../catalog/usage-metrics'

/**
 * The tile captions. A `labels` prop rather than children because this part has
 * no composition surface to write them into — the same call `ContextUsage` and
 * `ByokKeyDialog` make, and the reason is the same: the copy names a computed
 * quantity, it is not content the caller authored.
 */
export interface UsageStatsLabels {
  cacheHit: string
  cacheWrite: string
  outputRatio: string
  reasoningShare: string
  contextUsed: string
  cacheSaved: string
  promptModalities: string
  completionModalities: string
  /** Reads the modality kinds; the keys are `ModalitySlice['kind']`. */
  modality: Record<ModalitySlice['kind'], string>
}

export const DEFAULT_USAGE_STATS_LABELS: UsageStatsLabels = {
  cacheHit: 'Cache hit',
  cacheWrite: 'Cache write',
  outputRatio: 'Out per in',
  reasoningShare: 'Reasoning',
  contextUsed: 'Context used',
  cacheSaved: 'Saved by cache',
  promptModalities: 'Prompt by modality',
  completionModalities: 'Completion by modality',
  modality: { text: 'Text', image: 'Image', audio: 'Audio', video: 'Video', document: 'Document' },
}

export interface UsageStatsProps {
  usage: TokenUsage
  /** Supplies `contextWindow` (context used) and `cost` (saved by cache); without it those two tiles stay away. */
  model?: Model
  labels?: Partial<UsageStatsLabels>
  /** Lands on the grid. */
  className?: string
}

const PERCENT = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 })
const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 4 })

function Tile({ label, value, bar, children }: { label: string, value: string, bar?: number, children?: ReactNode }): ReactElement {
  const id = useId()
  return (
    <div
      data-slot="usage-stat"
      className="flex flex-col gap-1 rounded-md border p-3"
    >
      <dt id={id} className="text-xs text-muted-foreground">{label}</dt>
      <dd className="flex flex-col gap-1.5">
        <span className="text-lg tabular-nums">{value}</span>
        {bar !== undefined && <Progress value={Math.min(bar, 1) * 100} aria-labelledby={id} />}
        {children}
      </dd>
    </div>
  )
}

function Breakdown({ slices, labels }: { slices: readonly ModalitySlice[], labels: UsageStatsLabels }): ReactElement {
  return (
    <span className="flex flex-col gap-0.5 text-xs text-muted-foreground">
      {slices.map(slice => (
        <span
          key={slice.kind}
          className="flex justify-between gap-2 tabular-nums"
        >
          <span>{labels.modality[slice.kind]}</span>
          <span>{PERCENT.format(slice.share)}</span>
        </span>
      ))}
    </span>
  )
}

/**
 * The ratios inside a `TokenUsage`, one tile each: how much of the prompt came
 * from cache, how much answer a prompt bought, how much of the answer was
 * thinking, how full the context is, and what the cache saved.
 *
 * Every tile is skipped when its number is unknown — a rate with no denominator
 * is not zero — so a provider that reports no cache detail simply shows fewer
 * tiles rather than a row of 0%.
 *
 * It renders one `usage`. Which one is the caller's to decide: `useUsageTracker`
 * hands over `total`, `lastRun` and `byMessage`, and a switch between them is a
 * few lines the caller writes anyway, keeping that wording and those variants
 * where they belong.
 */
export function UsageStats({ usage, model, labels: labelsProp, className }: UsageStatsProps): ReactElement {
  const labels = useMemo(() => ({ ...DEFAULT_USAGE_STATS_LABELS, ...labelsProp }), [labelsProp])
  const m = useMemo(() => usageMetrics(usage, model), [usage, model])
  return (
    <dl
      data-slot="usage-stats"
      className={cn('grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-2', className)}
    >
      {m.cacheHitRate !== undefined && <Tile label={labels.cacheHit} value={PERCENT.format(m.cacheHitRate)} bar={m.cacheHitRate} />}
      {m.cacheWriteRate !== undefined && <Tile label={labels.cacheWrite} value={PERCENT.format(m.cacheWriteRate)} bar={m.cacheWriteRate} />}
      {m.outputRatio !== undefined && <Tile label={labels.outputRatio} value={`${m.outputRatio.toFixed(2)}×`} />}
      {m.reasoningShare !== undefined && <Tile label={labels.reasoningShare} value={PERCENT.format(m.reasoningShare)} bar={m.reasoningShare} />}
      {m.contextRatio !== undefined && <Tile label={labels.contextUsed} value={PERCENT.format(m.contextRatio)} bar={m.contextRatio} />}
      {m.cacheSavings !== undefined && <Tile label={labels.cacheSaved} value={USD.format(m.cacheSavings)} />}
      {m.promptModalities.length > 1 && (
        <Tile label={labels.promptModalities} value={String(usage.promptTokens)}>
          <Breakdown slices={m.promptModalities} labels={labels} />
        </Tile>
      )}
      {m.completionModalities.length > 1 && (
        <Tile label={labels.completionModalities} value={String(usage.completionTokens)}>
          <Breakdown slices={m.completionModalities} labels={labels} />
        </Tile>
      )}
    </dl>
  )
}
