import type { ThinkingLevel } from '@gedatou/cadenza-ai'
import type { ReactElement } from 'react'
import { clampThinkingLevel, defaultCatalog, modelRef, supportedThinkingLevels, THINKING_LEVELS } from '@gedatou/cadenza-ai'
import {
  Select,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectPopup,
  SelectTrigger,
  SelectValue,
  ToggleGroup,
  ToggleGroupItem,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { ResettableDemo } from '../lib/resettable'

// Feeds SelectValue only: what the trigger prints for the chosen ref.
const ITEMS = defaultCatalog.models.map(model => ({ value: modelRef(model), label: model.name }))

// Proves the seven-level scale against the catalog: each model enables its own
// subset, and a level the model cannot take is clamped — down to the nearest
// supported one, or up to the floor of a model that cannot switch thinking
// off (Claude Fable 5). The requested level is kept so the clamp stays visible.
function Body(): ReactElement {
  const [ref, setRef] = useState(() => ITEMS[0]?.value ?? '')
  const [requested, setRequested] = useState<ThinkingLevel>('high')
  const model = defaultCatalog.getModel(ref)
  const supported = supportedThinkingLevels(model)
  const effective = clampThinkingLevel(model, requested)
  return (
    <div className="flex flex-col gap-3">
      <Select
        clearable={false}
        items={ITEMS}
        value={ref}
        onValueChange={(next) => {
          if (next !== null)
            setRef(next)
        }}
      >
        <SelectTrigger aria-label="Model" className="inline-72">
          <SelectValue />
        </SelectTrigger>
        <SelectPopup>
          {defaultCatalog.providers.map(provider => (
            <SelectGroup key={provider.id}>
              <SelectLabel>{provider.label}</SelectLabel>
              {provider.models.map(item => (
                <SelectItem key={item.id} value={modelRef(item)}>{item.name}</SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectPopup>
      </Select>
      <ToggleGroup<ThinkingLevel>
        aria-label="Thinking level"
        size="sm"
        spacing={0}
        value={[effective]}
        variant="outline"
        onValueChange={([next]) => {
          if (next !== undefined)
            setRequested(next)
        }}
      >
        {THINKING_LEVELS.map(level => (
          <ToggleGroupItem key={level} disabled={!supported.includes(level)} value={level}>{level}</ToggleGroupItem>
        ))}
      </ToggleGroup>
      <p className="text-sm text-muted-foreground">
        Requested
        {' '}
        <code>{requested}</code>
        {' '}
        → sent
        {' '}
        <code>{effective}</code>
        {effective !== requested && ' (clamped)'}
      </p>
    </div>
  )
}

export default function ThinkingLevelsDemo(): ReactElement {
  return (
    <ResettableDemo>
      <Body />
    </ResettableDemo>
  )
}
