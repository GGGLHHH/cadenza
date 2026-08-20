'use client'

import type { ReactElement } from 'react'
import type { ChangeEventDetails } from '#lib/change-event-details'
import { useControllableState } from '@gedatou/cadenza-utils'
import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconPalette,
  IconX,
} from '@tabler/icons-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createChangeEventDetails } from '#lib/change-event-details'
import { cn, dataAttr } from '#lib/utils'
import { Button } from './button'
import { ColorPicker } from './color-picker'
import { ScrollArea } from './scroll-area'
import { Slider } from './slider'

/**
 * The published ThemeEditor.
 *
 * A floating palette button that opens a non-modal panel for editing this
 * library's design tokens live: colour rows (a `ColorPicker` swatch plus a
 * free-form text field per token), a `--radius` slider, undo/redo with a
 * bounded history, import/export as shadcn-convention CSS, and localStorage
 * persistence. Edits are injected document-wide through a `<style>` element,
 * so portalled popups follow along; defaults are read live from the loaded
 * stylesheets (the `:root` and `.dark, [data-theme='dark']` blocks), so the
 * editor needs no copy of the theme.
 *
 * Which mode is being edited follows the html element's own dark markers
 * (`.dark` / `data-theme="dark"`, the same pair styles.css honours) through a
 * MutationObserver — no theming-library dependency.
 *
 * An integrated tool rather than a composable family, so its visible wording
 * comes through flat `*Label` string props with English defaults (the
 * `DataPagination` treatment) — strings, not ReactNode: content that needs
 * markup is beyond what a label slot should carry. The root is a plain
 * `<div>`, so `className` is honestly a string; reposition the floating stack
 * by overriding its inset utilities.
 */

/** One collapsible-free group of token rows in the panel. */
export interface ThemeEditorGroup {
  /** The group's visible heading. */
  label: string
  /** Custom-property names, `--` included. */
  tokens: string[]
}

/** Why the panel opened or closed. */
export type ThemeEditorOpenChangeEventReason
  = 'trigger-press' | 'close-press' | 'escape-key'

export type ThemeEditorOpenChangeEventDetails
  = ChangeEventDetails<ThemeEditorOpenChangeEventReason>

/** The library's own semantic colour tokens, grouped the way styles.css groups them. */
const DEFAULT_GROUPS: ThemeEditorGroup[] = [
  { label: 'Base', tokens: ['--background', '--foreground'] },
  { label: 'Primary', tokens: ['--primary', '--primary-foreground'] },
  { label: 'Secondary', tokens: ['--secondary', '--secondary-foreground'] },
  { label: 'Muted', tokens: ['--muted', '--muted-foreground'] },
  { label: 'Accent', tokens: ['--accent', '--accent-foreground'] },
  { label: 'Destructive', tokens: ['--destructive'] },
  { label: 'Card', tokens: ['--card', '--card-foreground'] },
  { label: 'Popover', tokens: ['--popover', '--popover-foreground'] },
  { label: 'Border & focus', tokens: ['--border', '--input', '--ring'] },
]

type Mode = 'light' | 'dark'
type TokenMap = Record<string, string>

interface ThemeDefaults {
  light: TokenMap
  dark: TokenMap
  radius: string
}

interface ThemeOverrides {
  light: TokenMap
  dark: TokenMap
  radius: string | null
}

const HISTORY_LIMIT = 20

interface ThemeHistory {
  past: ThemeOverrides[]
  present: ThemeOverrides
  future: ThemeOverrides[]
  /**
   * The last step's origin: consecutive same-origin changes (one slider drag,
   * one typed run) merge into a single step; `null` never merges.
   */
  lastOrigin: string | null
}

// localStorage content is outside input: shape-check every key, drop the lot
// on anything broken, and return null for an empty result (no point in a
// restore render for nothing).
function readStoredOverrides(storageKey: string, tokens: Set<string>): ThemeOverrides | null {
  try {
    const raw = localStorage.getItem(storageKey)
    if (raw === null)
      return null
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null)
      return null
    const record = parsed as Record<string, unknown>
    const readMap = (value: unknown): TokenMap => {
      if (typeof value !== 'object' || value === null)
        return {}
      return Object.fromEntries(
        Object.entries(value).filter(([token, v]) =>
          tokens.has(token) && typeof v === 'string'),
      )
    }
    const stored: ThemeOverrides = {
      light: readMap(record.light),
      dark: readMap(record.dark),
      radius: typeof record.radius === 'string' ? record.radius : null,
    }
    const empty = stored.radius === null
      && Object.keys(stored.light).length === 0
      && Object.keys(stored.dark).length === 0
    return empty ? null : stored
  }
  catch {
    return null
  }
}

// Defaults come straight off the loaded stylesheets (CSSOM): `:root` is the
// light set, `.dark, [data-theme='dark']` the dark one. No hardcoded copy to
// drift out of date.
function readStylesheetDefaults(tokens: string[]): ThemeDefaults {
  const light: TokenMap = {}
  const dark: TokenMap = {}
  let radius = ''

  function walk(rules: CSSRuleList): void {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule) {
        const isDark = rule.selectorText.includes('.dark')
        const isRoot = !isDark && rule.selectorText.includes(':root')

        if (!isDark && !isRoot)
          continue

        const target = isDark ? dark : light
        for (const token of tokens) {
          const value = rule.style.getPropertyValue(token).trim()
          if (value !== '')
            target[token] = value
        }

        if (isRoot) {
          const value = rule.style.getPropertyValue('--radius').trim()
          if (value !== '')
            radius = value
        }
      }
      else if ('cssRules' in rule) {
        walk((rule as CSSGroupingRule).cssRules)
      }
    }
  }

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      walk(sheet.cssRules)
    }
    catch {
      // Cross-origin stylesheets refuse cssRules; skip them.
    }
  }

  return { light, dark, radius }
}

// The swatch wants sRGB and the stylesheet may speak lab()/oklch() (Lightning
// CSS compiles oklch down to lab): fill one pixel and read it back — pixel
// bytes are always sRGB, unlike fillStyle's serialisation, which modern
// Chrome keeps in the original notation.
let sharedCtx: CanvasRenderingContext2D | null = null

interface ParsedColor {
  hex: string
  /** 0–255; translucent tokens (dark `--border`/`--input`) keep alpha through here. */
  alpha: number
}

function parseToSrgb(value: string): ParsedColor | null {
  if (typeof CSS === 'undefined' || !CSS.supports('color', value))
    return null

  sharedCtx ??= document
    .createElement('canvas')
    .getContext('2d', { willReadFrequently: true })
  if (sharedCtx === null)
    return null

  sharedCtx.clearRect(0, 0, 1, 1)
  sharedCtx.fillStyle = value
  sharedCtx.fillRect(0, 0, 1, 1)
  const [r, g, b, alpha] = sharedCtx.getImageData(0, 0, 1, 1).data

  return {
    hex: `#${[r, g, b]
      .map(channel => channel.toString(16).padStart(2, '0'))
      .join('')}`,
    alpha,
  }
}

// Values land inside a <style> element and the exported text: one with CSS
// structure characters (`red}`, `red/*`) breaks the whole block silently, so
// generation skips the row while the text field keeps what was typed.
function declarations(map: TokenMap): string {
  return Object.entries(map)
    .filter(([, value]) => value.trim() !== '' && !/[{};]|\/\*/.test(value))
    .map(([token, value]) => `  ${token}: ${value};`)
    .join('\n')
}

// Parses pasted theme CSS (this editor's export, or any shadcn-convention
// block): `:root` feeds the light set, `.dark` / `[data-theme]` the dark one,
// `--radius` only counts from a light block.
function parseThemeCss(text: string, tokens: Set<string>): ThemeOverrides {
  const light: TokenMap = {}
  const dark: TokenMap = {}
  let radius: string | null = null

  for (const [, selector, body] of text.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    // Strip :not(...) first or this editor's own guarded light arm would
    // read as dark.
    const bare = selector.replace(/:not\([^)]*\)/g, '')
    const isDark = bare.includes('.dark') || bare.includes('data-theme')

    for (const [, token, value] of body.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+)/g)) {
      const trimmed = value.trim()

      if (token === '--radius') {
        if (!isDark)
          radius = trimmed
        continue
      }

      if (!tokens.has(token))
        continue

      const target = isDark ? dark : light
      target[token] = trimmed
    }
  }

  return { light, dark, radius }
}

// Which mode is being edited follows the html element's own dark markers —
// the same `.dark` / `data-theme="dark"` pair styles.css keys its tokens off.
function useDarkMode(): boolean {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const root = document.documentElement
    const read = (): void => {
      // Synchronous on mount by design: SSR cannot know the html element's
      // dark markers, so the first client render corrects it here.
      // eslint-disable-next-line react/set-state-in-effect
      setDark(root.classList.contains('dark') || root.dataset.theme === 'dark')
    }
    read()
    const observer = new MutationObserver(read)
    observer.observe(root, { attributes: true, attributeFilter: ['class', 'data-theme'] })
    return () => observer.disconnect()
  }, [])
  return dark
}

function TokenRow({
  token,
  value,
  onChange,
}: {
  token: string
  value: string
  onChange: (next: string) => void
}): ReactElement {
  // A mid-typing value is not a colour yet; the swatch keeps the last valid
  // one instead of flashing black. Conversion goes through the pixel reader —
  // stylesheet values arrive as lab(), which parseColor does not accept.
  const lastValidRef = useRef<ParsedColor | null>(null)
  const parsed = parseToSrgb(value.trim())
  if (parsed !== null)
    lastValidRef.current = parsed
  const swatch = parsed ?? lastValidRef.current
  const pickerValue = swatch === null
    ? '#000000'
    : swatch.alpha < 255
      ? swatch.hex + swatch.alpha.toString(16).padStart(2, '0')
      : swatch.hex

  return (
    <div className="flex items-center gap-2">
      <ColorPicker
        aria-label={token}
        value={pickerValue}
        onValueChange={(color) => {
          // Keep translucency: alpha tokens store back as 8-digit hex.
          onChange(color.getChannelValue('alpha') < 1 ? color.toString('hexa') : color.toString('hex'))
        }}
      />
      <span className="shrink-0 truncate font-mono text-xs inline-26" title={token}>
        {token.slice(2)}
      </span>
      <input
        type="text"
        aria-label={`${token} value`}
        value={value}
        onChange={event => onChange(event.target.value)}
        className="
          flex-1 rounded-md border border-input bg-transparent px-2 font-mono
          text-xs block-7 min-inline-0
          focus-visible:ring-2 focus-visible:ring-ring
          focus-visible:outline-none
        "
      />
    </div>
  )
}

export interface ThemeEditorProps {
  /** Token rows by group. Defaults to the library's own semantic colour tokens. */
  'groups'?: ThemeEditorGroup[]
  /**
   * localStorage key the edits persist under, `null` to not persist at all.
   * Persisted edits are restored on mount, and clearing every edit clears the
   * entry.
   */
  'storageKey'?: string | null
  /** Controlled panel state. */
  'open'?: boolean
  /** Whether the panel is initially open. */
  'defaultOpen'?: boolean
  /** Fires when the panel opens or closes. `cancel()` keeps it where it is. */
  'onOpenChange'?: (open: boolean, eventDetails: ThemeEditorOpenChangeEventDetails) => void
  /**
   * Root of the floating stack — a plain `<div>`, so this is honestly a
   * string. It carries the `fixed` positioning; override the inset utilities
   * to move the editor, or `static` to lay it inline.
   */
  'className'?: string
  /** Accessible name for the floating button. */
  'aria-label'?: string
  /** The panel's visible title. */
  'titleLabel'?: string
  /** Mode badge while the light set is being edited. */
  'editingLightLabel'?: string
  /** Mode badge while the dark set is being edited. */
  'editingDarkLabel'?: string
  'undoLabel'?: string
  'redoLabel'?: string
  'resetLabel'?: string
  'importLabel'?: string
  /** The import view's confirm button. */
  'applyLabel'?: string
  'cancelLabel'?: string
  /** The export button — downloads both full token sets as a CSS file. */
  'exportLabel'?: string
  /** File name the export downloads under. */
  'exportFileName'?: string
  /** Accessible name for the panel's close button. */
  'closeLabel'?: string
  /** Shown when pasted CSS yields no editable token. */
  'importErrorLabel'?: string
}

export function ThemeEditor({
  'aria-label': ariaLabel = 'Theme editor',
  applyLabel = 'Apply',
  cancelLabel = 'Cancel',
  className,
  closeLabel = 'Close',
  defaultOpen,
  exportFileName = 'theme.css',
  exportLabel = 'Export CSS',
  editingDarkLabel = 'Editing dark',
  editingLightLabel = 'Editing light',
  groups = DEFAULT_GROUPS,
  importErrorLabel = 'No editable token found — paste `:root` / `.dark` CSS',
  importLabel = 'Import',
  onOpenChange,
  open: openProp,
  redoLabel = 'Redo',
  resetLabel = 'Reset',
  storageKey = 'cadenza-theme-editor',
  titleLabel = 'Theme editor',
  undoLabel = 'Undo',
}: ThemeEditorProps): ReactElement {
  const dark = useDarkMode()
  const mode: Mode = dark ? 'dark' : 'light'
  const managedTokens = useMemo(() => groups.flatMap(group => group.tokens), [groups])
  const tokenSet = useMemo(() => new Set(managedTokens), [managedTokens])

  const [defaults, setDefaults] = useState<ThemeDefaults | null>(null)
  const [history, setHistory] = useState<ThemeHistory>({
    past: [],
    present: { light: {}, dark: {}, radius: null },
    future: [],
    lastOrigin: null,
  })
  const overrides = history.present
  // First-run guard for the persistence effect: writing before the restore
  // render lands would wipe the stored edits with the initial empty state.
  const hydratedRef = useRef(false)
  const [open, setOpenState] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    fallback: false,
  })
  const [importing, setImporting] = useState(false)
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState(false)

  useEffect(() => {
    // CSSOM and localStorage are client-only; SSR renders the null state and
    // mount fills it in, the previous session's edits included.
    // eslint-disable-next-line react/set-state-in-effect
    setDefaults(readStylesheetDefaults(managedTokens))
    if (storageKey === null)
      return
    const stored = readStoredOverrides(storageKey, tokenSet)
    if (stored !== null) {
      // The restore is history's blank baseline, not an undoable step.
      // eslint-disable-next-line react/set-state-in-effect
      setHistory(prev => ({ ...prev, present: stored }))
    }
    // eslint-disable-next-line react/exhaustive-deps -- mount-only by design: a groups/storageKey swap mid-session is not a supported flow
  }, [])

  useEffect(() => {
    if (!hydratedRef.current) {
      hydratedRef.current = true
      return
    }
    if (storageKey === null)
      return
    const empty = overrides.radius === null
      && Object.keys(overrides.light).length === 0
      && Object.keys(overrides.dark).length === 0
    try {
      if (empty)
        localStorage.removeItem(storageKey)
      else
        localStorage.setItem(storageKey, JSON.stringify(overrides))
    }
    catch {
      // Quota, private mode — persistence failing must not break editing.
    }
  }, [overrides, storageKey])

  const hasOverrides = overrides.radius !== null
    || Object.keys(overrides.light).length > 0
    || Object.keys(overrides.dark).length > 0

  // Live injection carries only the edits. The light arm needs the :not()
  // guard: an unguarded :root written after the library's `.dark` rule would
  // win dark mode on source order and bleed light values into it.
  const injectedCss = useMemo(() => {
    const parts: string[] = []

    if (overrides.radius !== null)
      parts.push(`:root { --radius: ${overrides.radius}; }`)

    const light = declarations(overrides.light)
    if (light !== '')
      parts.push(`:root:not(.dark):not([data-theme=dark]) {\n${light}\n}`)

    const dark = declarations(overrides.dark)
    if (dark !== '')
      parts.push(`.dark,\n[data-theme=dark] {\n${dark}\n}`)

    return parts.join('\n\n')
  }, [overrides])

  // Export is both sets in full: the `.dark` block trailing the `:root` one
  // makes source order at the paste site settle dark mode, no guard needed.
  const exportCss = useMemo(() => {
    if (defaults === null)
      return ''

    const light: TokenMap = {
      '--radius': overrides.radius ?? defaults.radius,
      ...defaults.light,
      ...overrides.light,
    }
    const dark: TokenMap = { ...defaults.dark, ...overrides.dark }

    return `:root {\n${declarations(light)}\n}\n\n.dark,\n[data-theme='dark'] {\n${declarations(dark)}\n}\n`
  }, [defaults, overrides])

  const setOpen = (next: boolean, eventDetails: ThemeEditorOpenChangeEventDetails): void => {
    if (next === open)
      return
    onOpenChange?.(next, eventDetails)
    if (eventDetails.isCanceled)
      return
    setOpenState(next)
    if (!next) {
      // Closed panels reopen on the edit view, not a stale import textarea.
      setImporting(false)
      setImportError(false)
    }
  }

  // Every overrides write funnels through here into history; a null origin
  // (reset, import) is a discrete action and never merges with the last step.
  function applyChange(
    update: (prev: ThemeOverrides) => ThemeOverrides,
    origin: string | null,
  ): void {
    setHistory((prev) => {
      const present = update(prev.present)
      const merge = origin !== null && prev.lastOrigin === origin
      const past = merge
        ? prev.past
        : [...prev.past, prev.present].slice(-HISTORY_LIMIT)
      // A new step abandons the redo stack — fork-and-drop, the standard.
      return { past, present, future: [], lastOrigin: origin }
    })
  }

  function undo(): void {
    setHistory((prev) => {
      const previous = prev.past.at(-1)
      if (previous === undefined)
        return prev
      // lastOrigin breaks here: editing the same token after an undo is a new
      // step, never a merge into the step just rolled back.
      return {
        past: prev.past.slice(0, -1),
        present: previous,
        future: [prev.present, ...prev.future],
        lastOrigin: null,
      }
    })
  }

  function redo(): void {
    setHistory((prev) => {
      const next = prev.future[0]
      if (next === undefined)
        return prev
      return {
        past: [...prev.past, prev.present].slice(-HISTORY_LIMIT),
        present: next,
        future: prev.future.slice(1),
        lastOrigin: null,
      }
    })
  }

  function setToken(token: string, value: string): void {
    applyChange((prev) => {
      const next = { ...prev[mode] }

      // Emptying the field revokes the override and falls back to the
      // stylesheet default — a stored '' would inject `--token: ;`, a legal
      // empty custom property that silently blanks the colour.
      if (value.trim() === '')
        delete next[token]
      else
        next[token] = value

      return { ...prev, [mode]: next }
    }, `token:${mode}:${token}`)
  }

  function applyImport(): void {
    const parsed = parseThemeCss(importText, tokenSet)
    const count = Object.keys(parsed.light).length
      + Object.keys(parsed.dark).length
      + (parsed.radius !== null ? 1 : 0)

    if (count === 0) {
      setImportError(true)
      return
    }

    // Merge, not replace: pasting three tokens must not wipe other edits.
    applyChange(prev => ({
      light: { ...prev.light, ...parsed.light },
      dark: { ...prev.dark, ...parsed.dark },
      radius: parsed.radius ?? prev.radius,
    }), null)
    setImporting(false)
    setImportText('')
    setImportError(false)
  }

  const radiusValue = overrides.radius ?? defaults?.radius ?? '0.625rem'

  return (
    <div
      data-slot="theme-editor"
      data-open={dataAttr(open)}
      className={cn(`
        fixed inset-e-4 inset-be-4 z-40 flex flex-col items-end gap-3
      `, className)}
    >
      {injectedCss !== '' && <style>{injectedCss}</style>}

      {open && (
        <div
          role="dialog"
          aria-label={titleLabel}
          data-slot="theme-editor-panel"
          onKeyDown={(event) => {
            if (event.key === 'Escape')
              setOpen(false, createChangeEventDetails('escape-key', event.nativeEvent))
          }}
          className="
            flex flex-col rounded-xl border bg-card text-card-foreground
            shadow-xl inline-[min(23rem,calc(100vw-2rem))]
          "
        >
          {/* Padding lives on each row, not on the panel: the scroll area
              below must reach the panel's edges, so its scrollbar hugs the
              border and the fade spans the full width. */}
          <div className="flex items-center gap-2 p-4 pbe-0">
            <span className="text-sm font-medium">{titleLabel}</span>
            <span className="
              rounded-full border px-2 py-0.5 text-xs text-muted-foreground
            "
            >
              {mode === 'dark' ? editingDarkLabel : editingLightLabel}
            </span>
            <Button
              aria-label={closeLabel}
              size="icon-xs"
              variant="ghost"
              className="ms-auto"
              onClick={event =>
                setOpen(false, createChangeEventDetails('close-press', event.nativeEvent))}
            >
              <IconX />
            </Button>
          </div>

          {defaults !== null && (importing
            ? (
                <div className="flex flex-col gap-2 p-4 pbs-3">
                  <textarea
                    aria-label={importLabel}
                    value={importText}
                    onChange={(event) => {
                      setImportText(event.target.value)
                      setImportError(false)
                    }}
                    placeholder={':root {\n  --primary: oklch(0.6 0.2 260);\n}\n\n.dark {\n  --primary: …;\n}'}
                    className="
                      resize-y rounded-md border border-input bg-transparent p-2
                      font-mono text-xs min-block-40
                      focus-visible:ring-2 focus-visible:ring-ring
                      focus-visible:outline-none
                    "
                  />
                  {importError && (
                    <p className="text-xs text-destructive">{importErrorLabel}</p>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setImporting(false)
                        setImportError(false)
                      }}
                    >
                      {cancelLabel}
                    </Button>
                    <Button size="sm" onClick={applyImport}>{applyLabel}</Button>
                  </div>
                </div>
              )
            : (
                <>
                  <div className="flex items-center gap-2 px-4 pbs-3">
                    <Button
                      aria-label={undoLabel}
                      size="icon-sm"
                      variant="ghost"
                      disabled={history.past.length === 0}
                      onClick={undo}
                    >
                      <IconArrowBackUp />
                    </Button>
                    <Button
                      aria-label={redoLabel}
                      size="icon-sm"
                      variant="ghost"
                      disabled={history.future.length === 0}
                      onClick={redo}
                    >
                      <IconArrowForwardUp />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={!hasOverrides}
                      onClick={() => {
                        applyChange(() => ({ light: {}, dark: {}, radius: null }), null)
                      }}
                    >
                      {resetLabel}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="ms-auto"
                      onClick={() => setImporting(true)}
                    >
                      {importLabel}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // A file download, not a clipboard write: the browser's
                        // own download UI is the feedback, no notice state here.
                        const url = URL.createObjectURL(
                          new Blob([exportCss], { type: 'text/css' }),
                        )
                        const anchor = document.createElement('a')
                        anchor.href = url
                        anchor.download = exportFileName
                        anchor.click()
                        URL.revokeObjectURL(url)
                      }}
                    >
                      {exportLabel}
                    </Button>
                  </div>
                  <ScrollArea
                    // The height cap goes on the viewport, not the root: the
                    // viewport's `block-full` needs a definite parent height
                    // to resolve, and a max-height root is not one — capping
                    // the viewport itself is what actually clips.
                    viewportClassName="
                      scroll-fade-y max-block-[min(55svh,32rem)]
                    "
                  >
                    <div className="flex flex-col gap-4 p-4 pbs-3">
                      <div className="flex items-center gap-3">
                        {/* The seam contract: visible wording names the slider
                          through aria-labelledby, which Base UI forwards into
                          the thumb's input. */}
                        <span
                          id="theme-editor-radius-label"
                          className="shrink-0 font-mono text-xs inline-26"
                        >
                          radius
                        </span>
                        <Slider
                          aria-labelledby="theme-editor-radius-label"
                          min={0}
                          max={1.5}
                          step={0.025}
                          value={Number.parseFloat(radiusValue)}
                          onValueChange={(next) => {
                          // Drag callbacks can carry float32 noise
                          // (0.6750000119…); round before it lands anywhere.
                            const rounded = Math.round(next * 1000) / 1000
                            applyChange(prev => ({ ...prev, radius: `${rounded}rem` }), 'radius')
                          }}
                          className="flex-1"
                        />
                        <span className="
                          shrink-0 font-mono text-xs tabular-nums
                        "
                        >
                          {radiusValue}
                        </span>
                      </div>
                      {groups.map(group => (
                        <div key={group.label} className="flex flex-col gap-1.5">
                          <div className="
                            text-xs font-medium text-muted-foreground
                          "
                          >
                            {group.label}
                          </div>
                          {group.tokens.map(token => (
                            <TokenRow
                              key={token}
                              token={token}
                              value={overrides[mode][token] ?? defaults[mode][token] ?? ''}
                              onChange={next => setToken(token, next)}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </>
              ))}
        </div>
      )}

      <Button
        aria-label={ariaLabel}
        aria-expanded={open}
        data-slot="theme-editor-trigger"
        size="icon-lg"
        className="rounded-full shadow-lg"
        onClick={(event) => {
          const reason = open ? 'close-press' : 'trigger-press'
          setOpen(!open, createChangeEventDetails(reason, event.nativeEvent))
        }}
      >
        {open ? <IconX /> : <IconPalette />}
      </Button>
    </div>
  )
}
