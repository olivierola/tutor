/* ============================================================
   Auto-layout — gives AI-generated content a clean, harmonious
   structure instead of trusting the model's scattered x/y. The
   model decides WHAT and the ORDER; we decide WHERE.

   Strategy: a two-column flow.
     • "wide" blocks (text, cards, tables, graphs, exercises) go
       in the LEFT column, stacked top-to-bottom.
     • "side" blocks (images, sticky notes, small figures) go in
       the RIGHT column, stacked alongside.
   Grouped elements (same `group`, e.g. a molecule or circuit)
   are laid out as a single rigid block via their bounding box.
   Everything is then centred on the view origin.
   ============================================================ */
import type { CanvasElement } from '../types/canvas'
import { getElementBBox, getCombinedBBox } from '../utils/canvasUtils'

const GAP_Y = 28          // vertical gap between stacked blocks
const GAP_X = 40          // gap between the two columns
const LEFT_W = 520        // nominal left column width

/** Types that belong on the right (visual aside) column. */
const SIDE_TYPES = new Set(['image', 'sticky-note'])

type Block = { els: CanvasElement[]; side: boolean }

function blockBox(els: CanvasElement[]) {
  return getCombinedBBox(els) ?? { x: 0, y: 0, width: 0, height: 0 }
}

/** Move a whole block so its top-left sits at (tx, ty). */
function placeBlock(els: CanvasElement[], tx: number, ty: number) {
  const box = blockBox(els)
  const dx = Math.round(tx - box.x)
  const dy = Math.round(ty - box.y)
  for (const el of els) {
    el.x += dx; el.y += dy
    if ('x2' in el) { (el as { x2: number }).x2 += dx; (el as { y2: number }).y2 += dy }
    if (el.type === 'pen' || el.type === 'light-ray') {
      const e = el as { points: number[][] }
      e.points = e.points.map(([px, py]) => [px + dx, py + dy])
    }
  }
}

/**
 * Re-position `elements` into a tidy two-column layout centred on
 * `origin`. Mutates and returns the same array.
 */
export function autoLayout(
  elements: CanvasElement[],
  origin: { x: number; y: number },
): CanvasElement[] {
  if (elements.length === 0) return elements

  // 1. Group into rigid blocks (by `group`, else singletons), preserving order.
  const blocks: Block[] = []
  const byGroup = new Map<string, CanvasElement[]>()
  const order: (string | CanvasElement)[] = []
  for (const el of elements) {
    if (el.group) {
      if (!byGroup.has(el.group)) { byGroup.set(el.group, []); order.push(el.group) }
      byGroup.get(el.group)!.push(el)
    } else {
      order.push(el)
    }
  }
  for (const o of order) {
    if (typeof o === 'string') {
      const els = byGroup.get(o)!
      // a group is "side" only if all its parts are side types
      const side = els.every((e) => SIDE_TYPES.has(e.type))
      blocks.push({ els, side })
    } else {
      blocks.push({ els: [o], side: SIDE_TYPES.has(o.type) })
    }
  }

  // 2. Flow each column independently, stacking downward.
  let leftY = 0, rightY = 0
  const leftX = 0
  const rightX = LEFT_W + GAP_X

  for (const b of blocks) {
    const box = blockBox(b.els)
    if (b.side) {
      placeBlock(b.els, rightX, rightY)
      rightY += box.height + GAP_Y
    } else {
      placeBlock(b.els, leftX, leftY)
      leftY += box.height + GAP_Y
    }
  }

  // 3. Centre the whole composition on the origin.
  const full = getCombinedBBox(elements)
  if (full) {
    const cx = full.x + full.width / 2
    const cy = full.y + full.height / 2
    const dx = Math.round(origin.x - cx)
    const dy = Math.round(origin.y - cy)
    for (const el of elements) {
      el.x += dx; el.y += dy
      if ('x2' in el) { (el as { x2: number }).x2 += dx; (el as { y2: number }).y2 += dy }
      if (el.type === 'pen' || el.type === 'light-ray') {
        const e = el as { points: number[][] }
        e.points = e.points.map(([px, py]) => [px + dx, py + dy])
      }
    }
  }

  return elements
}

// re-export so callers can keep importing from one place if needed
export { getElementBBox }
