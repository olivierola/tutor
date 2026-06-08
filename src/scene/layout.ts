/* ============================================================
   Anti-overlap layout — keeps AI-inserted elements from landing
   on top of each other or on existing content. Each new element
   that collides is nudged downward (then re-checked) until it
   finds clear space. Only AI batches use this; the user places
   freely.

   Grouped elements (same `group`) are treated as a rigid block so
   a figure's parts don't get torn apart.
   ============================================================ */
import type { CanvasElement } from '../types/canvas'
import { getElementBBox, getCombinedBBox, type BBox } from '../utils/canvasUtils'

const GAP = 16          // breathing room between blocks
const STEP = 24         // how far to nudge per iteration
const MAX_ITER = 200

function overlaps(a: BBox, b: BBox): boolean {
  return !(
    a.x + a.width + GAP <= b.x ||
    b.x + b.width + GAP <= a.x ||
    a.y + a.height + GAP <= b.y ||
    b.y + b.height + GAP <= a.y
  )
}

function shift(el: CanvasElement, dy: number): void {
  el.y += dy
  if ('y2' in el) (el as { y2: number }).y2 += dy
  if (el.type === 'pen' || el.type === 'light-ray') {
    const pts = (el as { points: number[][] }).points
    ;(el as { points: number[][] }).points = pts.map(([px, py]) => [px, py + dy])
  }
}

/** Combined bbox of a set of elements. */
function groupBox(els: CanvasElement[]): BBox {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const el of els) {
    const b = getElementBBox(el)
    minX = Math.min(minX, b.x); minY = Math.min(minY, b.y)
    maxX = Math.max(maxX, b.x + b.width); maxY = Math.max(maxY, b.y + b.height)
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

/**
 * Translate every element so the bounding box of the whole batch is
 * centred on `origin` (the centre of the user's view). The model's
 * absolute coordinates are treated as relative layout only — this
 * guarantees AI content always lands where the user is looking,
 * grouped together rather than scattered far away.
 */
export function centerOn(
  elements: CanvasElement[],
  origin: { x: number; y: number },
): CanvasElement[] {
  if (elements.length === 0) return elements
  const box = getCombinedBBox(elements)
  if (!box) return elements
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  const dx = Math.round(origin.x - cx)
  const dy = Math.round(origin.y - cy)
  if (dx === 0 && dy === 0) return elements
  for (const el of elements) {
    el.x += dx; el.y += dy
    if ('x2' in el) { (el as { x2: number }).x2 += dx; (el as { y2: number }).y2 += dy }
    if (el.type === 'pen' || el.type === 'light-ray') {
      const pts = (el as { points: number[][] }).points
      ;(el as { points: number[][] }).points = pts.map(([px, py]) => [px + dx, py + dy])
    }
  }
  return elements
}

/**
 * Mutates `incoming` so none of its (group-)blocks overlap each
 * other or any `existing` element. Returns the same array.
 */
export function resolveOverlaps(
  incoming: CanvasElement[],
  existing: CanvasElement[],
): CanvasElement[] {
  if (incoming.length === 0) return incoming

  // Occupied boxes start with everything already on the canvas.
  const occupied: BBox[] = existing.map(getElementBBox)

  // Group incoming elements into rigid blocks (by `group`, else singletons).
  const blocks: CanvasElement[][] = []
  const byGroup = new Map<string, CanvasElement[]>()
  for (const el of incoming) {
    if (el.group) {
      const arr = byGroup.get(el.group) ?? []
      arr.push(el); byGroup.set(el.group, arr)
    } else {
      blocks.push([el])
    }
  }
  for (const arr of byGroup.values()) blocks.push(arr)

  // Place blocks top-to-bottom by their initial y, nudging down on collision.
  blocks.sort((a, b) => groupBox(a).y - groupBox(b).y)

  for (const block of blocks) {
    let iter = 0
    while (iter++ < MAX_ITER) {
      const box = groupBox(block)
      const hit = occupied.find((o) => overlaps(box, o))
      if (!hit) { occupied.push(box); break }
      // push the whole block just below the thing it hit
      const dy = (hit.y + hit.height + GAP) - box.y
      for (const el of block) shift(el, Math.max(STEP, dy))
    }
  }

  return incoming
}
