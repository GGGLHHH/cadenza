import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { InputGroup, InputGroupInput } from '../src/components/input-group'
import { cn } from '../src/lib/utils'

// React Aria and Base UI type className as string OR a function of state; clsx
// silently drops functions, so cn is the one place the function half of that
// contract can be kept — every wrapper funnels className through it.
describe('cn', () => {
  it('merges plain strings, last-wins on conflicting utilities', () => {
    expect(cn('p-2 text-sm', 'p-4')).toBe('text-sm p-4')
  })

  it('composes a function className instead of dropping it', () => {
    const result = cn('flex p-2', ({ isOn }: { isOn: boolean }) => isOn ? 'p-4' : 'p-1')
    expect(result).toBeTypeOf('function')
    const resolve = result as (values: unknown) => string
    expect(resolve({ isOn: true })).toBe('flex p-4')
    expect(resolve({ isOn: false })).toBe('flex p-1')
  })

  it('keeps the base classes when the function resolves to nothing', () => {
    const resolve = cn('flex', () => undefined) as (values: unknown) => string
    expect(resolve({})).toBe('flex')
  })

  it('lets the resolved classes beat the base ones, same as strings do', () => {
    const resolve = cn('p-2', () => 'p-8') as (values: unknown) => string
    expect(resolve({})).toBe('p-8')
  })

  it('keeps the function alive across two vendored hops on the control', () => {
    // InputGroupInput → vendored input-group's cn → vendored Input's cn → Base
    // UI's className slot. Two compositions, one surviving function. Under the
    // old cn it died in the first hop, silently, while the props type kept
    // promising it worked — composing inside cn is what upgrades the whole
    // vendored surface at once.
    render(
      <InputGroup>
        <InputGroupInput
          aria-label="查询"
          className={({ disabled }) => disabled ? 'opacity-25' : 'opacity-75'}
          disabled
        />
      </InputGroup>,
    )
    const input = document.querySelector('input')
    expect(input?.className).toContain('opacity-25')
    expect(input?.className).not.toContain('opacity-75')
    expect(input?.className).toContain('flex-1')
  })
})
