'use client'
import type { ButtonProps, ChangeEventDetails, GenericEventDetails, InputGroupAddonProps, InputGroupButtonProps, InputGroupTextareaProps } from '@gedatou/cadenza-ui'
import type { ChatClientState } from '@tanstack/ai-client'
import type { AudioPart } from '@tanstack/ai/client'
import type { ComponentProps, ReactElement, ReactNode } from 'react'
import type { DraftAttachment } from '../runtime/attachments'
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  Button,
  cn,
  createChangeEventDetails,
  createGenericEventDetails,
  dataAttr,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '@gedatou/cadenza-ui'
import { useControllableState } from '@gedatou/cadenza-utils'
import { IconArrowUp, IconMicrophone, IconPaperclip, IconPlayerStop, IconX } from '@tabler/icons-react'
import { useAudioRecorder } from '@tanstack/ai-react'
import { createContext, use, useMemo, useRef, useState, useSyncExternalStore } from 'react'

export type ComposerSubmitReason = 'keyboard' | 'none'
export type ComposerChangeEventDetails = ChangeEventDetails<'input-change' | 'none'>

/** Mirrored as name-type `data-*` attributes on the root `<form>`; `ready` is the absence of the first three. */
export interface ComposerState {
  submitted: boolean
  streaming: boolean
  error: boolean
  dragging: boolean
  editing: boolean
}

// `onSubmit` / `onChange` are the form's native handlers; the composer's own
// commit and change callbacks carry `(value, details)` instead, so the native
// names are omitted rather than intersected. `value` / `defaultValue` are
// re-declared as the draft text.
export interface ComposerProps extends Omit<ComponentProps<'form'>, 'onSubmit' | 'onChange' | 'defaultValue' | 'value'> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string, details: ComposerChangeEventDetails) => void
  /** Enter, or the form's submit. The draft is cleared afterwards. */
  onValueCommitted: (value: string, details: GenericEventDetails<ComposerSubmitReason>) => void
  status: ChatClientState
  /** Escape while `submitted` / `streaming`, or `ComposerSubmit` pressed in that state. */
  onStop?: (details: GenericEventDetails<'escape-key' | 'none'>) => void
  editing?: boolean
  /** Escape while `editing` — takes precedence over `onStop`. */
  onEditCancel?: (details: GenericEventDetails<'escape-key'>) => void
  disabled?: boolean
  /** Commit an empty draft too — for a composer whose attachments strip carries the content. Default false. */
  allowEmpty?: boolean
  /** Files dropped on the form or pasted into it. */
  onFiles?: (files: File[], details: GenericEventDetails<'drag' | 'input-paste'>) => void
  children: ReactNode
}

interface ComposerContextValue {
  value: string
  setValue: (value: string, details?: ComposerChangeEventDetails) => void
  status: ChatClientState
  editing: boolean
  disabled: boolean
  /** The draft can be committed: non-empty, or `allowEmpty`. */
  committable: boolean
  submit: (details: GenericEventDetails<ComposerSubmitReason>) => void
  /** Forwards to the root's `onStop`; a no-op unless `submitted` / `streaming`. */
  stop: (details: GenericEventDetails<'escape-key' | 'none'>) => void
  /** Forwards to the root's `onEditCancel`. */
  cancelEdit: (details: GenericEventDetails<'escape-key'>) => void
}

const ComposerContext = createContext<ComposerContextValue | null>(null)
if (process.env.NODE_ENV !== 'production')
  ComposerContext.displayName = 'ComposerContext'

export function useComposer(): ComposerContextValue {
  const context = use(ComposerContext)
  if (context === null)
    throw new Error('cadenza-ai: ComposerContext is missing. Composer parts must be placed within <Composer>.')
  return context
}

function isBusy(status: ChatClientState): boolean {
  return status === 'submitted' || status === 'streaming'
}

/**
 * The input area: a `<form>` around an `InputGroup`, so `ComposerTextarea` and
 * `ComposerToolbar` stay direct children of the group (its auto-height and
 * block-end addon rules key off `>` combinators).
 */
export function Composer({
  allowEmpty = false,
  children,
  className,
  defaultValue,
  disabled = false,
  editing = false,
  onDragLeave,
  onDragOver,
  onDrop,
  onEditCancel,
  onFiles,
  onPaste,
  onStop,
  onValueChange,
  onValueCommitted,
  status,
  value: valueProp,
  ...props
}: ComposerProps): ReactElement {
  const [value, setValueState] = useControllableState({ value: valueProp, defaultValue, fallback: '' })
  const [dragging, setDragging] = useState(false)

  // Read through refs so the memoised context never chases handler identity.
  const latestRef = useRef({ value, disabled, editing, status, allowEmpty, onValueChange, onValueCommitted, onStop, onEditCancel })
  latestRef.current = { value, disabled, editing, status, allowEmpty, onValueChange, onValueCommitted, onStop, onEditCancel }
  const committable = allowEmpty || value.trim() !== ''

  const context = useMemo<ComposerContextValue>(() => {
    const setValue = (next: string, details: ComposerChangeEventDetails = createChangeEventDetails('none')): void => {
      latestRef.current.onValueChange?.(next, details)
      if (details.isCanceled)
        return
      setValueState(next)
    }
    return {
      value,
      setValue,
      status,
      editing,
      disabled,
      committable,
      submit: (details) => {
        const text = latestRef.current.value
        if (latestRef.current.disabled || (!latestRef.current.allowEmpty && text.trim() === ''))
          return
        latestRef.current.onValueCommitted(text, details)
        setValue('')
      },
      stop: (details) => {
        if (isBusy(latestRef.current.status))
          latestRef.current.onStop?.(details)
      },
      cancelEdit: details => latestRef.current.onEditCancel?.(details),
    }
  }, [value, status, editing, disabled, committable, setValueState])

  return (
    <ComposerContext value={context}>
      <form
        className={cn('flex flex-col gap-2', className)}
        data-slot="composer"
        data-submitted={dataAttr(status === 'submitted')}
        data-streaming={dataAttr(status === 'streaming')}
        data-error={dataAttr(status === 'error')}
        data-dragging={dataAttr(dragging)}
        data-editing={dataAttr(editing)}
        {...props}
        onSubmit={(event) => {
          event.preventDefault()
          context.submit(createGenericEventDetails('none', event.nativeEvent))
        }}
        onDragOver={(event) => {
          onDragOver?.(event)
          if (event.defaultPrevented || !onFiles)
            return
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={(event) => {
          onDragLeave?.(event)
          setDragging(false)
        }}
        onDrop={(event) => {
          onDrop?.(event)
          setDragging(false)
          if (event.defaultPrevented || !onFiles)
            return
          const files = Array.from(event.dataTransfer.files)
          if (files.length === 0)
            return
          event.preventDefault()
          onFiles(files, createGenericEventDetails('drag', event.nativeEvent))
        }}
        onPaste={(event) => {
          onPaste?.(event)
          if (event.defaultPrevented || !onFiles)
            return
          const files = Array.from(event.clipboardData.files)
          if (files.length === 0)
            return
          event.preventDefault()
          onFiles(files, createGenericEventDetails('input-paste', event.nativeEvent))
        }}
      >
        <InputGroup>{children}</InputGroup>
      </form>
    </ComposerContext>
  )
}

export type ComposerTextareaProps = InputGroupTextareaProps

/** The draft text. Enter commits, Shift+Enter breaks a line, IME composition is left alone, Escape cancels or stops. */
export function ComposerTextarea({ className, onChange, onKeyDown, ...props }: ComposerTextareaProps): ReactElement {
  const { value, setValue, editing, disabled, submit, stop, cancelEdit } = useComposer()
  return (
    <InputGroupTextarea
      className={cn('field-sizing-content max-block-48', className)}
      data-slot="composer-textarea"
      disabled={disabled}
      rows={1}
      {...props}
      value={value}
      onChange={(event) => {
        onChange?.(event)
        if (!event.defaultPrevented)
          setValue(event.target.value, createChangeEventDetails('input-change', event.nativeEvent))
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.defaultPrevented || event.nativeEvent.isComposing || event.key === 'Process')
          return
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault()
          submit(createGenericEventDetails('keyboard', event.nativeEvent))
        }
        else if (event.key === 'Escape') {
          if (editing)
            cancelEdit(createGenericEventDetails('escape-key', event.nativeEvent))
          else
            stop(createGenericEventDetails('escape-key', event.nativeEvent))
        }
      }}
    />
  )
}

export type ComposerToolbarProps = InputGroupAddonProps

/** The row under the textarea: attach, dictate, pickers, submit. */
export function ComposerToolbar(props: ComposerToolbarProps): ReactElement {
  return <InputGroupAddon align="block-end" data-slot="composer-toolbar" {...props} />
}

export type ComposerSubmitProps = ButtonProps

/** Send while idle, stop while busy. Disabled on an empty draft. */
export function ComposerSubmit({ children, ...props }: ComposerSubmitProps): ReactElement {
  const { committable, status, disabled, stop } = useComposer()
  const busy = isBusy(status)
  if (busy) {
    return (
      <Button
        aria-label="Stop"
        data-slot="composer-submit"
        size="icon-sm"
        type="button"
        {...props}
        onClick={(event) => {
          props.onClick?.(event)
          if (!event.defaultPrevented)
            stop(createGenericEventDetails('none', event.nativeEvent))
        }}
      >
        {children ?? <IconPlayerStop />}
      </Button>
    )
  }
  return (
    <Button
      aria-label="Send"
      data-slot="composer-submit"
      disabled={disabled || !committable}
      size="icon-sm"
      type="submit"
      {...props}
    >
      {children ?? <IconArrowUp />}
    </Button>
  )
}

export interface ComposerAttachmentsProps {
  items: readonly DraftAttachment[]
  onRemove: (id: string, details: GenericEventDetails<'none'>) => void
  className?: string
}

/** The pending-attachments strip; `state` maps straight onto `Attachment`'s. Renders nothing while empty. */
export function ComposerAttachments({ items, onRemove, className }: ComposerAttachmentsProps): ReactElement | null {
  if (items.length === 0)
    return null
  return (
    <AttachmentGroup className={className} data-slot="composer-attachments">
      {items.map(item => (
        <Attachment key={item.id} size="sm" state={item.state}>
          <AttachmentMedia variant={item.previewUrl === undefined ? 'icon' : 'image'}>
            {item.previewUrl === undefined ? <IconPaperclip /> : <img alt="" src={item.previewUrl} />}
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>{item.name}</AttachmentTitle>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction aria-label="Remove" onClick={event => onRemove(item.id, createGenericEventDetails('none', event.nativeEvent))}>
              <IconX />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
      ))}
    </AttachmentGroup>
  )
}

export type ComposerAttachProps = InputGroupButtonProps & {
  accept?: string
  multiple?: boolean
  onFiles: (files: File[], details: GenericEventDetails<'input-change'>) => void
}

/** Opens the file picker; the chosen files go to `onFiles`. */
export function ComposerAttach({ accept, children, multiple = true, onClick, onFiles, ...props }: ComposerAttachProps): ReactElement {
  const inputRef = useRef<HTMLInputElement>(null)
  const { disabled } = useComposer()
  return (
    <>
      <input
        accept={accept}
        hidden
        multiple={multiple}
        ref={inputRef}
        tabIndex={-1}
        type="file"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? [])
          event.target.value = ''
          if (files.length > 0)
            onFiles(files, createGenericEventDetails('input-change', event.nativeEvent))
        }}
      />
      <InputGroupButton
        aria-label="Attach"
        data-slot="composer-attach"
        disabled={disabled}
        size="icon-xs"
        {...props}
        onClick={(event) => {
          onClick?.(event)
          if (!event.defaultPrevented)
            inputRef.current?.click()
        }}
      >
        {children ?? <IconPaperclip />}
      </InputGroupButton>
    </>
  )
}

export type ComposerDictateProps = InputGroupButtonProps & {
  onRecording: (part: AudioPart, details: GenericEventDetails<'imperative-action'>) => void
}

const noSubscribe = (): (() => void) => () => {}

/** Press to record, press again to stop; the finished recording's audio part goes to `onRecording`. */
export function ComposerDictate({ children, onClick, onRecording, ...props }: ComposerDictateProps): ReactElement {
  const { disabled } = useComposer()
  const recorder = useAudioRecorder()
  // Recording support is a browser fact the server cannot know: render the
  // button disabled on the server and during hydration, then let the client's
  // answer through — the way useSyncExternalStore keeps both trees identical.
  const supported = useSyncExternalStore(noSubscribe, () => recorder.isSupported, () => false)
  return (
    <InputGroupButton
      aria-label="Dictate"
      aria-pressed={recorder.isRecording}
      data-recording={dataAttr(recorder.isRecording)}
      data-slot="composer-dictate"
      disabled={disabled || !supported}
      size="icon-xs"
      {...props}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented)
          return
        if (recorder.isRecording) {
          void recorder.stop().then(recording => onRecording(recording.part, createGenericEventDetails('imperative-action', event.nativeEvent)))
        }
        else {
          void recorder.start()
        }
      }}
    >
      {children ?? <IconMicrophone />}
    </InputGroupButton>
  )
}
