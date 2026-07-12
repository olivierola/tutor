import { describe, it, expect } from 'vitest'
import { simulateCircuits, isInteractive, toggleInteractive } from './simulate'
import type { CanvasElement, CircuitComponentElement } from '../types/canvas'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function circuitEl(
  overrides: Partial<CircuitComponentElement> & { id: string; component: CircuitComponentElement['component'] },
): CircuitComponentElement {
  return {
    type: 'circuit-component',
    x: 0,
    y: 0,
    rotation: 0,
    selected: false,
    locked: false,
    createdBy: 'user',
    energized: false,
    label: '',
    ...overrides,
  }
}

function nonCircuit(id: string): CanvasElement {
  return {
    id,
    type: 'rect',
    x: 0,
    y: 0,
    rotation: 0,
    selected: false,
    locked: false,
    createdBy: 'user',
    width: 100,
    height: 100,
    fill: '#fff',
    strokeColor: '#000',
    strokeWidth: 2,
  }
}

// ---------------------------------------------------------------------------
// simulateCircuits
// ---------------------------------------------------------------------------

describe('simulateCircuits', () => {
  it('returns the same array if no circuit components', () => {
    const els = [nonCircuit('a'), nonCircuit('b')]
    const result = simulateCircuits(els)
    expect(result).toBe(els) // same reference when unchanged
  })

  it('energizes a group with a battery and no open switch', () => {
    const battery = circuitEl({ id: 'b1', component: 'battery', group: 'g1' })
    const bulb = circuitEl({ id: 'l1', component: 'bulb', group: 'g1' })
    const result = simulateCircuits([battery, bulb])
    expect(result.find(e => e.id === 'b1')?.energized).toBe(true)
    expect(result.find(e => e.id === 'l1')?.energized).toBe(true)
  })

  it('does NOT energize a group without a battery', () => {
    const bulb = circuitEl({ id: 'l1', component: 'bulb', group: 'g1' })
    const resistor = circuitEl({ id: 'r1', component: 'resistor', group: 'g1' })
    const result = simulateCircuits([bulb, resistor])
    expect(result.find(e => e.id === 'l1')?.energized).toBe(false)
    expect(result.find(e => e.id === 'r1')?.energized).toBe(false)
  })

  it('does NOT energize a group with an open switch', () => {
    const battery = circuitEl({ id: 'b1', component: 'battery', group: 'g1' })
    const sw = circuitEl({ id: 's1', component: 'switch-open', group: 'g1' })
    const bulb = circuitEl({ id: 'l1', component: 'bulb', group: 'g1' })
    const result = simulateCircuits([battery, sw, bulb])
    expect(result.find(e => e.id === 'l1')?.energized).toBe(false)
  })

  it('energizes when switch is closed', () => {
    const battery = circuitEl({ id: 'b1', component: 'battery', group: 'g1' })
    const sw = circuitEl({ id: 's1', component: 'switch-closed', group: 'g1' })
    const bulb = circuitEl({ id: 'l1', component: 'bulb', group: 'g1' })
    const result = simulateCircuits([battery, sw, bulb])
    expect(result.find(e => e.id === 'l1')?.energized).toBe(true)
  })

  it('treats ungrouped components as solo groups', () => {
    const battery = circuitEl({ id: 'b1', component: 'battery' }) // no group
    const bulb = circuitEl({ id: 'l1', component: 'bulb' })       // no group
    const result = simulateCircuits([battery, bulb])
    // Each is its own group; battery has no switch so it's energized,
    // bulb has no battery so it's not.
    expect(result.find(e => e.id === 'b1')?.energized).toBe(true)
    expect(result.find(e => e.id === 'l1')?.energized).toBe(false)
  })

  it('does not mutate the original array when unchanged', () => {
    const els = [nonCircuit('a')]
    const result = simulateCircuits(els)
    expect(result).toBe(els)
  })

  it('returns new array only when flags change', () => {
    const battery = circuitEl({ id: 'b1', component: 'battery', group: 'g1', energized: false })
    const result = simulateCircuits([battery])
    expect(result).not.toBe([battery])
    expect(result[0].energized).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// isInteractive
// ---------------------------------------------------------------------------

describe('isInteractive', () => {
  it('returns true for switch-open', () => {
    const el = circuitEl({ id: 's1', component: 'switch-open' })
    expect(isInteractive(el)).toBe(true)
  })

  it('returns true for switch-closed', () => {
    const el = circuitEl({ id: 's1', component: 'switch-closed' })
    expect(isInteractive(el)).toBe(true)
  })

  it('returns false for battery', () => {
    const el = circuitEl({ id: 'b1', component: 'battery' })
    expect(isInteractive(el)).toBe(false)
  })

  it('returns false for non-circuit element', () => {
    expect(isInteractive(nonCircuit('x'))).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// toggleInteractive
// ---------------------------------------------------------------------------

describe('toggleInteractive', () => {
  it('flips switch-open to switch-closed', () => {
    const el = circuitEl({ id: 's1', component: 'switch-open' })
    expect(toggleInteractive(el)).toEqual({ component: 'switch-closed' })
  })

  it('flips switch-closed to switch-open', () => {
    const el = circuitEl({ id: 's1', component: 'switch-closed' })
    expect(toggleInteractive(el)).toEqual({ component: 'switch-open' })
  })

  it('returns null for non-interactive element', () => {
    const el = circuitEl({ id: 'b1', component: 'battery' })
    expect(toggleInteractive(el)).toBeNull()
  })

  it('returns null for non-circuit element', () => {
    expect(toggleInteractive(nonCircuit('x'))).toBeNull()
  })
})
