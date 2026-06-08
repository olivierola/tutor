/* ============================================================
   Scene application — the public bridge between the AI layer and
   the canvas. The tutor produces a Scene (or raw JSON); these
   helpers validate it and commit the result to the canvas store
   as one undoable batch. exportScene does the reverse so the AI
   can see the current board.
   ============================================================ */
import type { Scene, SceneItem, ValidationResult, Lesson, EditOp, OpsResult } from './types'
import { SCENE_VERSION } from './types'
import { validateScene, parseAndValidate, coerce } from './validate'
import { resolveOverlaps } from './layout'
import { useCanvasStore } from '../store/canvasStore'
import { useCoursesStore } from '../store/coursesStore'
import { getTool } from '../tools/registry'
import type { CanvasElement } from '../types/canvas'

/** Validate a Scene and insert its elements (single undo step). */
export function applyScene(
  scene: Scene,
  opts?: { origin?: { x: number; y: number }; select?: boolean; animate?: boolean },
): ValidationResult {
  const result = validateScene(scene, opts?.origin)
  if (result.elements.length > 0) {
    const existing = useCanvasStore.getState().elements
    resolveOverlaps(result.elements, existing) // keep AI content from overlapping
    const stamped = result.elements.map((el) => ({ ...el, createdBy: 'ai' as const }))
    if (opts?.animate) {
      // Lazy import avoids a store cycle at module load.
      import('../agent/playbackStore').then(({ usePlaybackStore }) => {
        usePlaybackStore.getState().play(stamped)
      })
    } else {
      useCanvasStore.getState().addElements(stamped, { select: opts?.select ?? true })
    }
  }
  return result
}

/** Same, from a raw JSON string (e.g. straight from the model). */
export function applySceneJSON(
  raw: string,
  opts?: { origin?: { x: number; y: number }; select?: boolean },
): ValidationResult {
  const result = parseAndValidate(raw, opts?.origin)
  if (result.elements.length > 0) {
    useCanvasStore.getState().addElements(result.elements, {
      select: opts?.select ?? true,
      createdBy: 'ai',
    })
  }
  return result
}

/**
 * Apply a batch of targeted edit operations (add / update / remove)
 * to the live canvas, as ONE undoable step. Used when the agent
 * edits existing content instead of regenerating it.
 *
 * `update` only changes params the registry declares for the
 * element's type, coerced/clamped to their ParamSpec — so a bad
 * value never corrupts the element.
 */
export function applyOps(ops: EditOp[], origin?: { x: number; y: number }): OpsResult {
  const warnings: string[] = []
  let added = 0, updated = 0, removed = 0
  if (!Array.isArray(ops) || ops.length === 0) {
    return { ok: false, added, updated, removed, warnings: ['Aucune opération.'] }
  }

  const store = useCanvasStore.getState()
  store.pushHistory() // single undo for the whole batch

  for (const op of ops) {
    if (op.op === 'remove') {
      const exists = store.elements.some((e) => e.id === op.id)
      if (!exists) { warnings.push(`Suppression : id « ${op.id} » introuvable.`); continue }
      // delete without an extra history push (we already pushed above)
      useCanvasStore.setState((s) => ({
        elements: s.elements.filter((e) => e.id !== op.id),
        selectedIds: s.selectedIds.filter((sid) => sid !== op.id),
      }))
      removed++
    } else if (op.op === 'update') {
      const el = useCanvasStore.getState().elements.find((e) => e.id === op.id)
      if (!el) { warnings.push(`Modification : id « ${op.id} » introuvable.`); continue }
      const tool = getTool(el.type)
      const patch: Record<string, unknown> = {}
      // position is always editable
      if (typeof op.params.x === 'number') patch.x = op.params.x
      if (typeof op.params.y === 'number') patch.y = op.params.y
      for (const spec of tool?.params ?? []) {
        if (!(spec.key in op.params)) continue
        const v = coerce(spec, op.params[spec.key])
        if (v !== undefined) patch[spec.key] = v
      }
      if (Object.keys(patch).length === 0) { warnings.push(`Modification de « ${op.id} » : aucun paramètre valide.`); continue }
      store.updateElement(op.id, patch as Partial<CanvasElement>)
      updated++
    } else if (op.op === 'add') {
      const res = validateScene({ items: [op.item] }, origin)
      warnings.push(...res.warnings)
      if (res.elements.length > 0) {
        resolveOverlaps(res.elements, useCanvasStore.getState().elements)
        useCanvasStore.setState((s) => ({ elements: [...s.elements, ...res.elements] }))
        added += res.elements.length
      }
    }
  }

  return { ok: added + updated + removed > 0, added, updated, removed, warnings }
}

/**
 * Apply a full multi-page lesson to a course.
 *   • page 0   → fills the CURRENTLY OPEN page (live canvas)
 *   • pages 1+ → new pages created and populated directly in the
 *                courses store (without switching the editor)
 * Optionally renames the course. Returns aggregate warnings.
 */
export function applyLesson(
  lesson: Lesson,
  ctx: { courseId: string; pageId: string; origin?: { x: number; y: number } },
): { ok: boolean; pagesAdded: number; warnings: string[] } {
  const warnings: string[] = []
  const pages = lesson.pages ?? []
  if (pages.length === 0) return { ok: false, pagesAdded: 0, warnings: ['Leçon sans pages.'] }

  const courses = useCoursesStore.getState()
  const canvas = useCanvasStore.getState()

  // Rename the course if a title is provided.
  if (lesson.title?.trim()) courses.updateCourse(ctx.courseId, { title: lesson.title.trim() })

  // ── Page 0 → the live page ────────────────────────────────
  const first = pages[0]
  const firstResult = validateScene({ items: first.items }, ctx.origin)
  warnings.push(...firstResult.warnings)
  if (firstResult.elements.length > 0) {
    resolveOverlaps(firstResult.elements, canvas.elements)
    canvas.addElements(firstResult.elements, { select: false, createdBy: 'ai' })
  }
  if (first.title?.trim()) courses.updatePage(ctx.courseId, ctx.pageId, { title: first.title.trim() })

  // ── Pages 1+ → new course pages ───────────────────────────
  let pagesAdded = 0
  for (let i = 1; i < pages.length; i++) {
    const p = pages[i]
    const created = courses.addPage(ctx.courseId, p.title?.trim() || `Page ${i + 1}`)
    if (!created) { warnings.push(`Échec création page ${i + 1}.`); continue }
    const r = validateScene({ items: p.items }, ctx.origin ?? { x: 0, y: 0 })
    warnings.push(...r.warnings)
    resolveOverlaps(r.elements, []) // fresh page — only de-overlap within itself
    courses.updatePage(ctx.courseId, created.id, {
      elements: r.elements,
      viewport: { x: 0, y: 0, zoom: 1 },
      instruments: [],
    })
    pagesAdded++
  }

  return { ok: true, pagesAdded, warnings }
}

/**
 * Snapshot the current canvas as a Scene the AI can read. Only
 * emits params the registry knows about for each element type, so
 * the output stays within the shared tool vocabulary.
 */
export function exportScene(): Scene {
  const { elements } = useCanvasStore.getState()
  const items: SceneItem[] = []

  for (const el of elements) {
    const tool = getTool(el.type)
    if (!tool) continue
    const rec = el as unknown as Record<string, unknown>
    const item: SceneItem = { type: el.type, x: el.x, y: el.y }
    if (el.id) item.id = el.id
    if (el.group) item.group = el.group
    for (const spec of tool.params ?? []) {
      if (rec[spec.key] !== undefined) item[spec.key] = rec[spec.key]
    }
    items.push(item)
  }

  return { version: SCENE_VERSION, items }
}
