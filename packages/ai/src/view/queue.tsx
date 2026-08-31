'use client'
import type { GenericEventDetails } from '@gedatou/cadenza-ui'
import type { QueuedMessage } from '@tanstack/ai-client'
import type { ReactElement, ReactNode } from 'react'
import { Button, createGenericEventDetails, Item, ItemActions, ItemContent, ItemGroup, ItemTitle } from '@gedatou/cadenza-ui'
import { IconX } from '@tabler/icons-react'

export interface QueueListProps {
  queue: readonly QueuedMessage[]
  onCancel: (id: string, details: GenericEventDetails<'none'>) => void
  /** Rendered after the rows — a heading or a hint the caller writes. */
  children?: ReactNode
  className?: string
}

function queuedText(message: QueuedMessage): string {
  if (typeof message.content === 'string')
    return message.content
  const { content } = message.content
  if (typeof content === 'string')
    return content
  return content.map(part => (part.type === 'text' ? part.content : `[${part.type}]`)).join(' ')
}

/** Messages waiting behind the current turn, each with a cancel. */
export function QueueList({ children, className, onCancel, queue }: QueueListProps): ReactElement {
  return (
    <ItemGroup className={className} data-slot="queue-list">
      {queue.map(message => (
        <Item key={message.id} data-slot="queue-list-item" size="xs">
          <ItemContent>
            <ItemTitle>{queuedText(message)}</ItemTitle>
          </ItemContent>
          <ItemActions>
            <Button
              aria-label="Cancel"
              size="icon-xs"
              variant="ghost"
              onClick={event => onCancel(message.id, createGenericEventDetails('none', event.nativeEvent))}
            >
              <IconX />
            </Button>
          </ItemActions>
        </Item>
      ))}
      {children}
    </ItemGroup>
  )
}
