/* ============================================================
   Scene schema — the JSON contract between the AI tutor and the
   canvas. A Scene is an ordered list of items; each item names a
   registry tool (`type`) plus a position and any tool parameters.

   The AI emits this; `validateScene` normalises it into safe,
   fully-defaulted canvas elements; `applyScene` inserts them.

   Design goals:
     • forgiving input  — missing params fall back to registry
       defaults, unknown items are skipped (not fatal)
     • registry-aligned — `type` matches a ToolDef id, so the AI
       only ever references tools the canvas can actually render
     • groupable        — items sharing a `group` id move/delete
       together as one figure
   ============================================================ */

/** One element the AI wants on the canvas. */
export interface SceneItem {
  /** Registry tool id, e.g. "triangle", "axes", "atom", "text". */
  type: string
  /** Canvas-space anchor. Optional: auto-laid-out if omitted. */
  x?: number
  y?: number
  /** Optional figure grouping id; items with the same id bind together. */
  group?: string
  /** Stable id (optional — generated if absent). */
  id?: string
  /**
   * Tool parameters, keyed exactly as the element/registry expects
   * (e.g. strokeColor, expression, element, latex…). Unknown keys
   * are ignored by the validator.
   */
  [param: string]: unknown
}

export interface Scene {
  /** Schema marker for forward-compat. */
  version?: number
  /** Optional human/AI-facing title of the illustration. */
  title?: string
  /** Optional caption shown to the student. */
  caption?: string
  items: SceneItem[]
}

/** One page (chapter) of a multi-page lesson. */
export interface ScenePage {
  /** Page tab title, e.g. "Introduction", "Exercices". */
  title?: string
  items: SceneItem[]
}

/**
 * A full lesson the agent can author at once: several pages, each
 * its own canvas document. Returned instead of a single Scene when
 * the agent builds a complete course.
 */
export interface Lesson {
  version?: number
  /** Course title (may rename the course). */
  title?: string
  pages: ScenePage[]
}

/* ── Edit operations (targeted patches from the agent) ─────── */

/** Add a brand-new element. */
export interface AddOp {
  op: 'add'
  item: SceneItem
}
/** Patch params of an existing element by id. */
export interface UpdateOp {
  op: 'update'
  id: string
  /** Params to change, keyed as the element expects (e.g. { color: 'pink', fontSize: 24 }). */
  params: Record<string, unknown>
}
/** Delete an element by id (its group-mates are NOT auto-removed). */
export interface RemoveOp {
  op: 'remove'
  id: string
}

export type EditOp = AddOp | UpdateOp | RemoveOp

/** Result of applying a batch of edit operations. */
export interface OpsResult {
  ok: boolean
  added: number
  updated: number
  removed: number
  warnings: string[]
}

/** Result of validating a scene before it touches the canvas. */
export interface ValidationResult {
  ok: boolean
  /** Fully-normalised, ready-to-insert canvas elements. */
  elements: import('../types/canvas').CanvasElement[]
  /** Non-fatal problems (skipped items, clamped values, …). */
  warnings: string[]
  /** Fatal problems that prevented producing any elements. */
  errors: string[]
}

export const SCENE_VERSION = 1
