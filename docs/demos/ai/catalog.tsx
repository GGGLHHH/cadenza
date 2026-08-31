import type { Modality, Provider } from '@gedatou/cadenza-ai'
import type { Icon } from '@tabler/icons-react'
import type { ReactElement } from 'react'
import { defaultCatalog, modelRef, parseModelRef, supportedThinkingLevels } from '@gedatou/cadenza-ai'
import { Badge } from '@gedatou/cadenza-ui'
import { IconBrain, IconFileText, IconMicrophone, IconPhoto, IconTypography, IconVideo } from '@tabler/icons-react'
import { ResettableDemo } from '../lib/resettable'

// Proves the catalog is plain data: every provider and model of
// `defaultCatalog`, plus a custom local provider added with `withProvider`,
// rendered straight into a table — input modalities as icons, the thinking
// levels each model accepts as badges. `parseModelRef` splits on the first
// slash only, so OpenRouter-style `vendor/model` ids survive.
const local: Provider = {
  id: 'local',
  label: 'Local (custom)',
  byok: null,
  keyRequired: false,
  runtime: 'local',
  models: [{ id: 'llama3.3', name: 'Llama 3.3', provider: 'local', input: ['text'], reasoning: false }],
}
const catalog = defaultCatalog.withProvider(local)

const MODALITY: Record<Modality, [Icon, string]> = {
  text: [IconTypography, 'Text'],
  image: [IconPhoto, 'Image'],
  audio: [IconMicrophone, 'Audio'],
  video: [IconVideo, 'Video'],
  document: [IconFileText, 'Document'],
}

const SAMPLE_REF = 'openrouter/anthropic/claude-sonnet-4.5'
const parsed = parseModelRef(SAMPLE_REF)

function CatalogTable(): ReactElement {
  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-auto rounded-xl border max-block-120">
        <table className="text-sm inline-full">
          <thead className="
            sticky inset-bs-0 bg-background text-xs text-muted-foreground
          "
          >
            <tr>
              <th className="p-2 text-start font-medium">Model</th>
              <th className="p-2 text-start font-medium">Input</th>
              <th className="p-2 text-start font-medium">Thinking</th>
            </tr>
          </thead>
          <tbody>
            {catalog.providers.map(provider => (
              <ProviderRows key={provider.id} provider={provider} />
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        <code>{`parseModelRef('${SAMPLE_REF}')`}</code>
        {' → provider '}
        <code>{parsed.provider}</code>
        {', id '}
        <code>{parsed.id}</code>
        {' — only the first slash splits.'}
      </p>
    </div>
  )
}

function ProviderRows({ provider }: { provider: Provider }): ReactElement {
  return (
    <>
      <tr className="border-bs bg-muted/40">
        <th className="p-2 text-start font-medium" colSpan={3}>
          <span className="flex flex-wrap items-center gap-2">
            {provider.label}
            <Badge variant="outline">{provider.keyRequired ? 'key required' : 'no key'}</Badge>
            <Badge variant="outline">{provider.runtime}</Badge>
          </span>
        </th>
      </tr>
      {provider.models.map(model => (
        <tr key={model.id} className="border-bs">
          <td className="p-2">
            <span className="flex items-center gap-1.5">
              {model.name}
              {model.reasoning && (
                <IconBrain
                  aria-label="Reasoning"
                  className="text-muted-foreground block-4 inline-4"
                />
              )}
            </span>
            <span className="text-xs text-muted-foreground">{modelRef(model)}</span>
          </td>
          <td className="p-2">
            <span className="flex items-center gap-1 text-muted-foreground">
              {model.input.map((modality) => {
                const [ModalityIcon, label] = MODALITY[modality]
                return (
                  <ModalityIcon
                    key={modality}
                    aria-label={label}
                    className="block-4 inline-4"
                  />
                )
              })}
            </span>
          </td>
          <td className="p-2">
            <span className="flex flex-wrap gap-1">
              {supportedThinkingLevels(model).map(level => (
                <Badge key={level} variant={level === 'off' ? 'outline' : 'secondary'}>{level}</Badge>
              ))}
            </span>
          </td>
        </tr>
      ))}
    </>
  )
}

export default function CatalogDemo(): ReactElement {
  return (
    <ResettableDemo className="max-inline-none">
      <CatalogTable />
    </ResettableDemo>
  )
}
