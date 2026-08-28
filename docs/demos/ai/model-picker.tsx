import type { ReactElement } from 'react'
import { defaultCatalog, ModelPicker, modelRef, ThinkingLevelPicker, useChat, useModelSelection } from '@gedatou/cadenza-ai'
import { echo, scripted } from '@gedatou/cadenza-ai/mock'
import { useState } from 'react'
import { ResettableDemo } from '../lib/resettable'
import { ChatShell } from './chat-shell'

const KEY = 'docs-model-picker'

// Proves the selection reaches the request: the echo names `data.model`, so
// switching models and sending straight away shows the new one. The thinking
// picker disappears for a model without levels (GPT-4.1) and the stored level
// is clamped to what the new model supports.
function Body(): ReactElement {
  const [fetcher] = useState(() => scripted(echo()))
  const sel = useModelSelection({ key: KEY })
  const chat = useChat({ fetcher, forwardedProps: sel.forwardedProps })
  return (
    <ChatShell
      chat={chat}
      empty="Pick a model, then send; the reply names it."
      toolbar={(
        <>
          <ModelPicker
            catalog={defaultCatalog}
            value={modelRef({ provider: sel.selection.provider, id: sel.selection.model })}
            onValueChange={ref => sel.setModel(ref)}
          />
          <ThinkingLevelPicker model={sel.model} value={sel.selection.thinking} onValueChange={level => sel.setThinking(level)} />
        </>
      )}
    />
  )
}

export default function ModelPickerDemo(): ReactElement {
  return (
    <ResettableDemo className="max-inline-2xl" onReset={() => localStorage.removeItem(KEY)}>
      <Body />
    </ResettableDemo>
  )
}
