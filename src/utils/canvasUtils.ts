import type { Viewport, CanvasElement } from '../types/canvas'

// ============================================================
// Coordinate transforms
// ============================================================

/** Convert screen (pixel) coordinates to canvas world coordinates */
export function screenToCanvas(
  sx: number,
  sy: number,
  viewport: Viewport
): { x: number; y: number } {
  return {
    x: (sx - viewport.x) / viewport.zoom,
    y: (sy - viewport.y) / viewport.zoom,
  }
}

/** Convert canvas world coordinates to screen (pixel) coordinates */
export function canvasToScreen(
  cx: number,
  cy: number,
  viewport: Viewport
): { x: number; y: number } {
  return {
    x: cx * viewport.zoom + viewport.x,
    y: cy * viewport.zoom + viewport.y,
  }
}

// ============================================================
// ID generation
// ============================================================
let _counter = 0
export function generateId(prefix = 'el'): string {
  _counter++
  return `${prefix}_${Date.now()}_${_counter}`
}

// ============================================================
// SVG path from points (Catmull-Rom spline)
// ============================================================

/**
 * Convert an array of [x, y] points into a smooth SVG path string
 * using Catmull-Rom spline interpolation.
 */
export function getSvgPathFromPoints(points: number[][]): string {
  if (points.length === 0) return ''
  if (points.length === 1) {
    const [x, y] = points[0]
    return `M ${x} ${y}`
  }
  if (points.length === 2) {
    const [x0, y0] = points[0]
    const [x1, y1] = points[1]
    return `M ${x0} ${y0} L ${x1} ${y1}`
  }

  // Catmull-Rom to cubic bezier conversion
  const path: string[] = []
  const tension = 0.5

  path.push(`M ${points[0][0]} ${points[0][1]}`)

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]

    const cp1x = p1[0] + ((p2[0] - p0[0]) * tension) / 3
    const cp1y = p1[1] + ((p2[1] - p0[1]) * tension) / 3
    const cp2x = p2[0] - ((p3[0] - p1[0]) * tension) / 3
    const cp2y = p2[1] - ((p3[1] - p1[1]) * tension) / 3

    path.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2[0]} ${p2[1]}`)
  }

  return path.join(' ')
}

// ============================================================
// Snapping utilities
// ============================================================

/** Snap a value to a grid of given size */
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize
}

/** Snap a point to a grid */
export function snapPointToGrid(
  x: number,
  y: number,
  gridSize: number
): { x: number; y: number } {
  return {
    x: snapToGrid(x, gridSize),
    y: snapToGrid(y, gridSize),
  }
}

/** Snap an angle to 15° increments (like Shift-rotate) */
export function snapAngle(angleDeg: number): number {
  return Math.round(angleDeg / 15) * 15
}

// ============================================================
// Bounding box utilities
// ============================================================

export type BBox = { x: number; y: number; width: number; height: number }

/** Get the bounding box of a canvas element */
export function getElementBBox(el: CanvasElement): BBox {
  switch (el.type) {
    case 'pen': {
      if (el.points.length === 0) return { x: el.x, y: el.y, width: 0, height: 0 }
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      for (const [px, py] of el.points) {
        if (px < minX) minX = px
        if (py < minY) minY = py
        if (px > maxX) maxX = px
        if (py > maxY) maxY = py
      }
      const pad = el.strokeWidth / 2
      return { x: minX - pad, y: minY - pad, width: maxX - minX + pad * 2, height: maxY - minY + pad * 2 }
    }
    case 'line':
    case 'arrow':
    case 'vector': {
      const minX = Math.min(el.x, el.x2)
      const minY = Math.min(el.y, el.y2)
      const maxX = Math.max(el.x, el.x2)
      const maxY = Math.max(el.y, el.y2)
      const pad = ('strokeWidth' in el ? el.strokeWidth : 2) / 2
      return { x: minX - pad, y: minY - pad, width: maxX - minX + pad * 2, height: maxY - minY + pad * 2 }
    }
    case 'rect': {
      const x = el.width >= 0 ? el.x : el.x + el.width
      const y = el.height >= 0 ? el.y : el.y + el.height
      return { x, y, width: Math.abs(el.width), height: Math.abs(el.height) }
    }
    case 'circle':
      return {
        x: el.x - el.rx,
        y: el.y - el.ry,
        width: el.rx * 2,
        height: el.ry * 2,
      }
    case 'text':
    case 'formula': {
      const fontSize = 'fontSize' in el ? el.fontSize : 16
      return { x: el.x, y: el.y - fontSize, width: 200, height: fontSize * 1.4 }
    }
    case 'lab-instrument':
      return { x: el.x, y: el.y, width: el.width, height: el.height }
    case 'node':
    case 'packet':
      return { x: el.x, y: el.y, width: el.width, height: el.height }
    case 'sticky-note':
    case 'flashcard':
      return { x: el.x, y: el.y, width: el.width, height: (el as { height: number }).height }
    case 'qcm': {
      const q = el as { x: number; y: number; width: number; question: string; options: unknown[] }
      return { x: q.x, y: q.y, width: q.width, height: 96 + q.options.length * 38 + 60 }
    }
    case 'short-answer':
      return { x: el.x, y: el.y, width: (el as { width: number }).width, height: 150 }
    case 'fill-blank':
      return { x: el.x, y: el.y, width: (el as { width: number }).width, height: 140 }
    case 'image': {
      const im = el as { x: number; y: number; width: number; height: number; caption?: string }
      return { x: im.x, y: im.y, width: im.width, height: im.height + (im.caption ? 22 : 0) }
    }
    case 'course-card': {
      // height isn't stored; estimate from body length & width
      const cc = el as { x: number; y: number; width: number; body: string }
      const cpl = Math.max(14, Math.floor((cc.width - 36) / 7))
      const lines = cc.body.split('\n').reduce((a, l) => a + Math.max(1, Math.ceil(l.length / cpl)), 0)
      return { x: cc.x, y: cc.y, width: cc.width, height: 46 + lines * 20 + 16 }
    }
    case 'rich-text': {
      const rt = el as { x: number; y: number; width: number; body: string; heading?: string; fontSize: number }
      const cpl = Math.max(12, Math.floor(rt.width / (rt.fontSize * 0.55)))
      const lines = rt.body.split('\n').reduce((a, l) => a + Math.max(1, Math.ceil(l.length / cpl)), 0)
      const h = (rt.heading ? rt.fontSize + 14 : 0) + lines * (rt.fontSize * 1.5) + 20
      return { x: rt.x, y: rt.y, width: rt.width, height: h }
    }
    case 'edge': {
      const minX = Math.min(el.x, el.x2)
      const minY = Math.min(el.y, el.y2)
      return { x: minX, y: minY, width: Math.abs(el.x2 - el.x), height: Math.abs(el.y2 - el.y) }
    }
    case 'code-block': {
      const lines = el.code.split('\n').length
      return { x: el.x, y: el.y, width: el.width, height: 30 + lines * el.fontSize * 1.5 + 20 }
    }
    case 'table': {
      const w = el.colWidths.reduce((a, b) => a + b, 0)
      return { x: el.x, y: el.y, width: w, height: el.rows.length * el.rowHeight }
    }
    case 'callout': {
      const lines = el.body.split('\n').length + 1
      return { x: el.x, y: el.y, width: el.width, height: 40 + lines * 19 + 14 }
    }
    case 'timeline':
      return el.orientation === 'horizontal'
        ? { x: el.x - 10, y: el.y - 20, width: el.length + 40, height: 90 }
        : { x: el.x - 16, y: el.y - 10, width: 220, height: el.steps.length * 60 + 20 }
    case 'tree':
      return { x: el.x, y: el.y, width: 240, height: 120 }
    default:
      return { x: el.x, y: el.y, width: 100, height: 100 }
  }
}

/** Get the combined bounding box of multiple elements */
export function getCombinedBBox(elements: CanvasElement[]): BBox | null {
  if (elements.length === 0) return null
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const el of elements) {
    const bb = getElementBBox(el)
    if (bb.x < minX) minX = bb.x
    if (bb.y < minY) minY = bb.y
    if (bb.x + bb.width > maxX) maxX = bb.x + bb.width
    if (bb.y + bb.height > maxY) maxY = bb.y + bb.height
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

// ============================================================
// Geometry helpers
// ============================================================

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
}

export function angleDeg(x1: number, y1: number, x2: number, y2: number): number {
  return (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI
}

/** Get SVG arrowhead path (marker replacement for inline arrows) */
export function getArrowheadPath(
  x1: number, y1: number,
  x2: number, y2: number,
  size = 12
): string {
  const angle = Math.atan2(y2 - y1, x2 - x1)
  const spread = Math.PI / 6 // 30°
  const ax = x2 - size * Math.cos(angle - spread)
  const ay = y2 - size * Math.sin(angle - spread)
  const bx = x2 - size * Math.cos(angle + spread)
  const by = y2 - size * Math.sin(angle + spread)
  return `M ${ax} ${ay} L ${x2} ${y2} L ${bx} ${by}`
}

/** Fit viewport to show all elements with padding */
export function fitViewportToElements(
  elements: CanvasElement[],
  screenWidth: number,
  screenHeight: number,
  padding = 80
): { x: number; y: number; zoom: number } {
  if (elements.length === 0) {
    return { x: screenWidth / 2, y: screenHeight / 2, zoom: 1 }
  }
  const bbox = getCombinedBBox(elements)
  if (!bbox) return { x: screenWidth / 2, y: screenHeight / 2, zoom: 1 }

  const zoomX = (screenWidth - padding * 2) / (bbox.width || 1)
  const zoomY = (screenHeight - padding * 2) / (bbox.height || 1)
  const zoom = Math.min(Math.max(Math.min(zoomX, zoomY), 0.05), 20)

  const x = screenWidth / 2 - (bbox.x + bbox.width / 2) * zoom
  const y = screenHeight / 2 - (bbox.y + bbox.height / 2) * zoom

  return { x, y, zoom }
}
