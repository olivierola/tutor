import { describe, it, expect, beforeEach } from 'vitest'
import {
  screenToCanvas,
  canvasToScreen,
  generateId,
  getSvgPathFromPoints,
  snapToGrid,
  snapPointToGrid,
  snapAngle,
  getElementBBox,
  getCombinedBBox,
  distance,
  angleDeg,
  getArrowheadPath,
  fitViewportToElements,
} from './canvasUtils'
import type { Viewport, CanvasElement } from '../types/canvas'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultViewport: Viewport = { x: 100, y: 50, zoom: 2 }

function makeEl(overrides: Partial<CanvasElement> & { type: CanvasElement['type'] }): CanvasElement {
  return { id: 'test', x: 0, y: 0, rotation: 0, selected: false, locked: false, createdBy: 'user', ...overrides } as CanvasElement
}

// ---------------------------------------------------------------------------
// Coordinate transforms
// ---------------------------------------------------------------------------

describe('screenToCanvas / canvasToScreen', () => {
  it('converts screen coords to canvas coords', () => {
    const result = screenToCanvas(300, 150, defaultViewport)
    expect(result).toEqual({ x: 100, y: 50 })
  })

  it('converts canvas coords to screen coords', () => {
    const result = canvasToScreen(100, 50, defaultViewport)
    expect(result).toEqual({ x: 300, y: 150 })
  })

  it('round-trips correctly', () => {
    const canvas = { x: 42, y: 99 }
    const screen = canvasToScreen(canvas.x, canvas.y, defaultViewport)
    const back = screenToCanvas(screen.x, screen.y, defaultViewport)
    expect(back.x).toBeCloseTo(canvas.x)
    expect(back.y).toBeCloseTo(canvas.y)
  })

  it('handles zoom = 1 and origin = 0', () => {
    const vp: Viewport = { x: 0, y: 0, zoom: 1 }
    expect(screenToCanvas(200, 100, vp)).toEqual({ x: 200, y: 100 })
    expect(canvasToScreen(200, 100, vp)).toEqual({ x: 200, y: 100 })
  })
})

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

describe('generateId', () => {
  beforeEach(() => {
    // Reset internal counter by importing fresh (module-level counter)
  })

  it('generates a string with the given prefix', () => {
    const id = generateId('foo')
    expect(id).toMatch(/^foo_\d+_\d+$/)
  })

  it('uses default prefix "el"', () => {
    const id = generateId()
    expect(id).toMatch(/^el_\d+_\d+$/)
  })

  it('produces unique ids on successive calls', () => {
    const a = generateId('x')
    const b = generateId('x')
    expect(a).not.toBe(b)
  })
})

// ---------------------------------------------------------------------------
// SVG path
// ---------------------------------------------------------------------------

describe('getSvgPathFromPoints', () => {
  it('returns empty string for empty points', () => {
    expect(getSvgPathFromPoints([])).toBe('')
  })

  it('returns M for a single point', () => {
    expect(getSvgPathFromPoints([[10, 20]])).toBe('M 10 20')
  })

  it('returns a line for two points', () => {
    expect(getSvgPathFromPoints([[0, 0], [100, 100]])).toBe('M 0 0 L 100 100')
  })

  it('returns a Catmull-Rom spline for three or more points', () => {
    const path = getSvgPathFromPoints([[0, 0], [50, 100], [100, 0]])
    expect(path).toMatch(/^M 0 0 C /)
    expect(path).toContain('100 0')
  })
})

// ---------------------------------------------------------------------------
// Snapping
// ---------------------------------------------------------------------------

describe('snapToGrid', () => {
  it('snaps to nearest grid line', () => {
    expect(snapToGrid(17, 10)).toBe(20)
    expect(snapToGrid(13, 10)).toBe(10)
    expect(snapToGrid(25, 20)).toBe(20)
    expect(snapToGrid(30, 20)).toBe(40)
  })

  it('handles zero', () => {
    expect(snapToGrid(0, 10)).toBe(0)
  })
})

describe('snapPointToGrid', () => {
  it('snaps both coordinates', () => {
    expect(snapPointToGrid(17, 33, 10)).toEqual({ x: 20, y: 30 })
  })
})

describe('snapAngle', () => {
  it('snaps to nearest 15° increment', () => {
    expect(snapAngle(10)).toBe(15)
    expect(snapAngle(7)).toBe(0)
    expect(snapAngle(22)).toBe(15)
    expect(snapAngle(30)).toBe(30)
    expect(snapAngle(44)).toBe(45)
  })
})

// ---------------------------------------------------------------------------
// Bounding boxes
// ---------------------------------------------------------------------------

describe('getElementBBox', () => {
  it('returns bbox for a rect', () => {
    const el = makeEl({ type: 'rect', x: 50, y: 60, width: 100, height: 80, fill: '#fff', strokeColor: '#000', strokeWidth: 2 })
    const bb = getElementBBox(el)
    expect(bb.x).toBe(50)
    expect(bb.y).toBe(60)
    expect(bb.width).toBe(100)
    expect(bb.height).toBe(80)
  })

  it('handles negative width rect', () => {
    const el = makeEl({ type: 'rect', x: 150, y: 100, width: -100, height: -80, fill: '#fff', strokeColor: '#000', strokeWidth: 2 })
    const bb = getElementBBox(el)
    expect(bb.x).toBe(50)
    expect(bb.y).toBe(20)
    expect(bb.width).toBe(100)
    expect(bb.height).toBe(80)
  })

  it('returns bbox for a circle', () => {
    const el = makeEl({ type: 'circle', x: 100, y: 100, rx: 50, ry: 40, fill: '#fff', strokeColor: '#000', strokeWidth: 2 })
    const bb = getElementBBox(el)
    expect(bb.x).toBe(50)
    expect(bb.y).toBe(60)
    expect(bb.width).toBe(100)
    expect(bb.height).toBe(80)
  })

  it('returns bbox for a line', () => {
    const el = makeEl({ type: 'line', x: 0, y: 0, x2: 100, y2: 200, strokeColor: '#000', strokeWidth: 4 })
    const bb = getElementBBox(el)
    expect(bb.x).toBe(-2)
    expect(bb.y).toBe(-2)
    expect(bb.width).toBe(104)
    expect(bb.height).toBe(204)
  })

  it('returns bbox for a pen stroke', () => {
    const el = makeEl({ type: 'pen', points: [[10, 20], [30, 40], [50, 60]], strokeColor: '#000', strokeWidth: 4 })
    const bb = getElementBBox(el)
    expect(bb.x).toBe(8)
    expect(bb.y).toBe(18)
    expect(bb.width).toBe(44)
    expect(bb.height).toBe(44)
  })

  it('returns bbox for a text element', () => {
    const el = makeEl({ type: 'text', text: 'Hello', fontSize: 20, color: '#000' })
    const bb = getElementBBox(el)
    expect(bb.x).toBe(0)
    expect(bb.y).toBe(-20)
    expect(bb.width).toBe(200)
    expect(bb.height).toBe(28)
  })

  it('returns fallback bbox for unknown type', () => {
    const el = makeEl({ type: 'triangle' as CanvasElement['type'], v1: [0, 0], v2: [100, 0], v3: [50, -86], fill: '#fff', strokeColor: '#000', strokeWidth: 2, showAngles: true, showSides: false })
    const bb = getElementBBox(el)
    expect(bb.x).toBe(0)
    expect(bb.y).toBe(0)
    expect(bb.width).toBe(100)
    expect(bb.height).toBe(100)
  })
})

describe('getCombinedBBox', () => {
  it('returns null for empty array', () => {
    expect(getCombinedBBox([])).toBeNull()
  })

  it('returns the bbox of a single element', () => {
    const el = makeEl({ type: 'rect', x: 10, y: 20, width: 50, height: 30, fill: '#fff', strokeColor: '#000', strokeWidth: 2 })
    const bb = getCombinedBBox([el])
    expect(bb).toEqual({ x: 10, y: 20, width: 50, height: 30 })
  })

  it('returns the union bbox of multiple elements', () => {
    const a = makeEl({ type: 'rect', x: 0, y: 0, width: 100, height: 100, fill: '#fff', strokeColor: '#000', strokeWidth: 2 })
    const b = makeEl({ type: 'rect', x: 50, y: 50, width: 100, height: 100, fill: '#fff', strokeColor: '#000', strokeWidth: 2 })
    const bb = getCombinedBBox([a, b])
    expect(bb.x).toBe(0)
    expect(bb.y).toBe(0)
    expect(bb.width).toBe(150)
    expect(bb.height).toBe(150)
  })
})

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

describe('distance', () => {
  it('computes Euclidean distance', () => {
    expect(distance(0, 0, 3, 4)).toBe(5)
  })

  it('returns 0 for same point', () => {
    expect(distance(10, 20, 10, 20)).toBe(0)
  })
})

describe('angleDeg', () => {
  it('returns 0 for rightward direction', () => {
    expect(angleDeg(0, 0, 100, 0)).toBeCloseTo(0)
  })

  it('returns 90 for downward direction', () => {
    expect(angleDeg(0, 0, 0, 100)).toBeCloseTo(90)
  })

  it('returns 180 for leftward direction', () => {
    expect(angleDeg(0, 0, -100, 0)).toBeCloseTo(180)
  })
})

describe('getArrowheadPath', () => {
  it('returns a valid SVG path string', () => {
    const path = getArrowheadPath(0, 0, 100, 0)
    expect(path).toMatch(/^M /)
    expect(path).toContain('L 100 0 L')
  })
})

// ---------------------------------------------------------------------------
// fitViewportToElements
// ---------------------------------------------------------------------------

describe('fitViewportToElements', () => {
  it('returns default viewport when no elements', () => {
    const result = fitViewportToElements([], 800, 600)
    expect(result.x).toBe(400)
    expect(result.y).toBe(300)
    expect(result.zoom).toBe(1)
  })

  it('computes zoom to fit elements with padding', () => {
    const el = makeEl({ type: 'rect', x: 0, y: 0, width: 200, height: 100, fill: '#fff', strokeColor: '#000', strokeWidth: 2 })
    const result = fitViewportToElements([el], 800, 600)
    expect(result.zoom).toBeGreaterThan(0)
    expect(result.zoom).toBeLessThanOrEqual(20)
  })

  it('clamps zoom between 0.05 and 20', () => {
    const el = makeEl({ type: 'rect', x: 0, y: 0, width: 20000, height: 10000, fill: '#fff', strokeColor: '#000', strokeWidth: 2 })
    const result = fitViewportToElements([el], 800, 600)
    expect(result.zoom).toBeGreaterThanOrEqual(0.05)
  })
})
