'use client'
import type { ReactElement, ReactNode } from 'react'
import type { Model, TokenUsage } from '../catalog/types'
import { cn, Progress, Tooltip, TooltipPopup, TooltipTrigger } from '@gedatou/cadenza-ui'
import { useId, useMemo } from 'react'
import { estimateCost } from '../catalog/cost'
import { usageMetrics } from '../catalog/usage-metrics'

/** The row labels of the detail tooltip. Override through `labels` (the `ByokKeyDialog` route: this part has no renderer registry to read from). */
export interface ContextUsageLabels {
  prompt: string
  completion: string
  cached: string
  total: string
  cost: string
  cacheHit: string
  outputRatio: string
  reasoningShare: string
  cacheSaved: string
}

export const DEFAULT_CONTEXT_USAGE_LABELS: ContextUsageLabels = {
  prompt: 'Prompt',
  completion: 'Completion',
  cached: 'Cached',
  total: 'Total',
  cost: 'Cost',
  cacheHit: 'Cache hit',
  outputRatio: 'Out per in',
  reasoningShare: 'Reasoning',
  cacheSaved: 'Saved by cache',
}

export interface ContextUsageProps {
  /** Supplies `contextWindow` (the bar) and `cost` (the price row); without it only the numbers show. */
  model?: Model
  usage: TokenUsage
  labels?: Partial<ContextUsageLabels>
  /** After the prompt-token count ("tokens") — the part ships no unit. */
  children?: ReactNode
  /** Lands on the trigger. */
  className?: string
}

export interface ContextUsageState {
  /** `usage.promptTokens / model.contextWindow`; `undefined` when the model has no window. */
  ratio: number | undefined
}

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 4 })
const PERCENT = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 })

/**
 * How full the context is (spec O1): a bar for `promptTokens / contextWindow`
 * beside the number, with the token breakdown and `estimateCost` in a tooltip.
 * The whole thing is the tooltip's trigger; `data-ratio` (two decimals) is
 * the bar's value for styling from outside.
 */
export function ContextUsage({ model, usage, labels: labelsProp, children, className }: ContextUsageProps): ReactElement {
  const labels = useMemo(() => ({ ...DEFAULT_CONTEXT_USAGE_LABELS, ...labelsProp }), [labelsProp])
  const id = useId()
  const window = model?.contextWindow
  const ratio = window !== undefined && window > 0 ? usage.promptTokens / window : undefined
  const cached = usage.promptTokensDetails?.cachedTokens
  const cost = model && estimateCost(model, usage)
  const metrics = useMemo(() => usageMetrics(usage, model), [usage, model])
  return (
    <Tooltip>
      <TooltipTrigger
        data-slot="context-usage"
        data-ratio={ratio?.toFixed(2)}
        className={cn(`
          inline-flex items-center gap-2 text-xs text-muted-foreground
          tabular-nums
        `, className)}
      >
        {ratio !== undefined && (
          <Progress
            value={Math.min(ratio, 1) * 100}
            aria-labelledby={id}
            className="inline-16"
          />
        )}
        <span id={id}>
          <span data-slot="context-usage-tokens">{usage.promptTokens}</span>
          {children !== undefined && ' '}
          {children}
        </span>
      </TooltipTrigger>
      <TooltipPopup>
        <dl
          data-slot="context-usage-details"
          className="grid grid-cols-[auto_auto] gap-x-3 tabular-nums"
        >
          <dt>{labels.prompt}</dt>
          <dd className="text-end">{usage.promptTokens}</dd>
          <dt>{labels.completion}</dt>
          <dd className="text-end">{usage.completionTokens}</dd>
          {cached !== undefined && (
            <>
              <dt>{labels.cached}</dt>
              <dd className="text-end">{cached}</dd>
            </>
          )}
          <dt>{labels.total}</dt>
          <dd className="text-end">{usage.totalTokens}</dd>
          {/*
            The ratios the same four numbers already imply. Each is skipped when
            its denominator is unknown — a rate with nothing under it is not 0%,
            and a provider that reports no cache detail should show one row
            fewer rather than a row that reads zero.
          */}
          {metrics.cacheHitRate !== undefined && (
            <>
              <dt>{labels.cacheHit}</dt>
              <dd className="text-end">{PERCENT.format(metrics.cacheHitRate)}</dd>
            </>
          )}
          {metrics.outputRatio !== undefined && (
            <>
              <dt>{labels.outputRatio}</dt>
              <dd className="text-end">{`${metrics.outputRatio.toFixed(2)}×`}</dd>
            </>
          )}
          {metrics.reasoningShare !== undefined && (
            <>
              <dt>{labels.reasoningShare}</dt>
              <dd className="text-end">{PERCENT.format(metrics.reasoningShare)}</dd>
            </>
          )}
          {cost !== undefined && (
            <>
              <dt>{labels.cost}</dt>
              <dd className="text-end">{USD.format(cost)}</dd>
            </>
          )}
          {metrics.cacheSavings !== undefined && (
            <>
              <dt>{labels.cacheSaved}</dt>
              <dd className="text-end">{USD.format(metrics.cacheSavings)}</dd>
            </>
          )}
        </dl>
      </TooltipPopup>
    </Tooltip>
  )
}
