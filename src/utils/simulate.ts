/* ============================================================
   Lightweight, didactic circuit simulation.

   This is deliberately NOT a full nodal solver. Real-time SPICE
   is overkill for a tutoring canvas. Instead we work at the
   "figure group" level: every circuit component that shares the
   same `group` id is treated as one series loop. The rule a
   student intuitively expects:

     • a loop with a power source (battery) and NO open switch
       is "closed" → bulbs light, components are energized;
     • any open switch in the loop breaks it → everything off.

   It makes the canonical demo work — click the switch, the lamp
   lights — and stays readable. A graph/edge-aware solver can
   replace `simulateCircuits` later without touching callers.
   ============================================================ */
import type { CanvasElement, CircuitComponentElement } from '../types/canvas'

const isCircuit = (el: CanvasElement): el is CircuitComponentElement =>
  el.type === 'circuit-component'

/**
 * Returns a new elements array with every circuit component's
 * `energized` flag recomputed per group. Pure — never mutates.
 */
export function simulateCircuits(elements: CanvasElement[]): CanvasElement[] {
  // Bucket circuit components by group ('' = ungrouped, each its own).
  const groups = new Map<string, CircuitComponentElement[]>()
  for (const el of elements) {
    if (!isCircuit(el)) continue
    const key = el.group ?? `__solo_${el.id}`
    const arr = groups.get(key) ?? []
    arr.push(el)
    groups.set(key, arr)
  }

  // Decide energized state per group.
  const energizedById = new Map<string, boolean>()
  for (const comps of groups.values()) {
    const hasSource = comps.some(c => c.component === 'battery')
    const hasOpenSwitch = comps.some(c => c.component === 'switch-open')
    const closed = hasSource && !hasOpenSwitch
    for (const c of comps) energizedById.set(c.id, closed)
  }

  // Apply, returning new objects only where the flag changes.
  let changed = false
  const next = elements.map(el => {
    if (!isCircuit(el)) return el
    const e = energizedById.get(el.id) ?? false
    if (el.energized === e) return el
    changed = true
    return { ...el, energized: e }
  })
  return changed ? next : elements
}

/** Components the student can directly act on by clicking. */
export function isInteractive(el: CanvasElement): boolean {
  return el.type === 'circuit-component' &&
    (el.component === 'switch-open' || el.component === 'switch-closed')
}

/**
 * Produce the patch that results from clicking an interactive
 * element (e.g. flip a switch). Returns null if not interactive.
 */
export function toggleInteractive(el: CanvasElement): Partial<CanvasElement> | null {
  if (el.type === 'circuit-component') {
    if (el.component === 'switch-open') return { component: 'switch-closed' } as Partial<CanvasElement>
    if (el.component === 'switch-closed') return { component: 'switch-open' } as Partial<CanvasElement>
  }
  return null
}
