import type { ReactElement } from 'react'
import {
  Bubble,
  BubbleContent,
  Button,
  Marker,
  MarkerContent,
  Message,
  MessageContent,
  MessageHeader,
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@gedatou/cadenza-ui'
import { Fragment, useState } from 'react'
import { ResettableDemo } from './resettable'
import { GROUP_TRANSCRIPT, JOINER_LINES, JOINERS } from './transcript'

// In a group thread a turn does not start with "the user's message" — nobody
// here is "the user". What opens a turn is someone arriving, so the anchor is
// the join marker, not a message. Drop someone in and the marker is what the
// viewport lifts to the top, with their first line below it
function GroupChatBody(): ReactElement {
  const [joined, setJoined] = useState<string[]>([])
  const next = JOINERS[joined.length]

  return (
    <div className="flex flex-col gap-3 block-96">
      <Button
        disabled={next === undefined}
        size="sm"
        variant="secondary"
        onClick={() => next !== undefined && setJoined(people => [...people, next])}
      >
        {next === undefined ? 'Everyone has joined' : `Add ${next}`}
      </Button>
      <MessageScrollerProvider autoScroll>
        <MessageScroller className="flex-1 rounded-xl border">
          <MessageScrollerViewport>
            <MessageScrollerContent className="gap-8 p-5">
              {GROUP_TRANSCRIPT.map(message => (
                <MessageScrollerItem key={message.id} messageId={message.id}>
                  <GroupBubble content={message.content} sender={message.sender} />
                </MessageScrollerItem>
              ))}
              {joined.map(person => (
                <Fragment key={person}>
                  {/* The marker is the anchor — a row with no message in it at
                      all. Anchoring is about turn boundaries, not roles */}
                  <MessageScrollerItem
                    className="
                      border-s-2 border-transparent ps-3
                      data-[scroll-anchor=true]:border-primary
                    "
                    messageId={`joined-${person}`}
                    scrollAnchor
                  >
                    <Marker variant="separator">
                      <MarkerContent>
                        {person}
                        {' '}
                        joined the chat
                      </MarkerContent>
                    </Marker>
                  </MessageScrollerItem>
                  <MessageScrollerItem messageId={`${person}-first`}>
                    <GroupBubble content={JOINER_LINES[person] ?? ''} sender={person} />
                  </MessageScrollerItem>
                </Fragment>
              ))}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>
    </div>
  )
}

// Everyone is a peer here, so every row aligns start and carries a name —
// that is what MessageHeader is for.
function GroupBubble({ content, sender }: { content: string, sender: string }): ReactElement {
  return (
    <Message align="start">
      <MessageContent>
        <MessageHeader>{sender}</MessageHeader>
        <Bubble variant="muted">
          <BubbleContent>{content}</BubbleContent>
        </Bubble>
      </MessageContent>
    </Message>
  )
}

export default function GroupChatDemo(): ReactElement {
  return (
    <ResettableDemo>
      <GroupChatBody />
    </ResettableDemo>
  )
}
