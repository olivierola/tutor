/* ============================================================
   Scene validator — turns forgiving AI JSON into safe, fully
   defaulted canvas elements.

   Strategy per item:
     1. look up the tool in the registry (skip if unknown)
     2. build a baseline element via the existing factory
        (placeElement) so every required field has a sane default
     3. overlay only the params the registry declares for that
        tool, coercing/clamping each to its ParamSpec
     4. carry through x/y/group/id

   Nothing here throws on bad data — problems become warnings and
   the offending item is skipped, so one malformed entry can't
   sink an entire illustration.
   ============================================================ */
import type { Scene, SceneItem, ValidationResult } from './types'
import type { CanvasElement } from '../types/canvas'
import type { ParamSpec } from '../tools/types'
import { getTool } from '../tools/registry'
import { createElement } from '../utils/placeElement'
import { generateId } from '../utils/canvasUtils'

const DEFAULTS = {
  activeColor: '#e4e4e7',
  fillColor: 'transparent',
  strokeWidth: 2,
  gridVariant: 'square' as const,
  atomSymbol: 'C',
}

export function coerce(spec: ParamSpec, raw: unknown): unknown | undefined {
  switch (spec.kind) {
    case 'number': {
      const n = typeof raw === 'number' ? raw : Number(raw)
      if (!Number.isFinite(n)) return undefined
      let v = n
      if (spec.min !== undefined) v = Math.max(spec.min, v)
      if (spec.max !== undefined) v = Math.min(spec.max, v)
      return v
    }
    case 'boolean':
      return typeof raw === 'boolean' ? raw : raw === 'true' || raw === 1
    case 'text':
    case 'latex':
    case 'color':
      return raw == null ? undefined : String(raw)
    case 'select': {
      const v = String(raw)
      return spec.options.some((o) => o.value === v) ? v : undefined
    }
  }
}

/** Validate & normalise a single item into a CanvasElement (or null). */
function validateItem(
  item: SceneItem,
  warnings: string[],
  fallbackPos: { x: number; y: number },
): CanvasElement | null {
  const tool = getTool(item.type)
  if (!tool) {
    warnings.push(`Outil inconnu « ${item.type} » — ignoré.`)
    return null
  }
  if (tool.interaction === 'instrument' || tool.interaction === 'select') {
    warnings.push(`« ${item.type} » n'est pas un élément plaçable — ignoré.`)
    return null
  }

  const cx = typeof item.x === 'number' ? item.x : fallbackPos.x
  const cy = typeof item.y === 'number' ? item.y : fallbackPos.y

  // Baseline element with all required defaults filled in.
  const base = createElement(item.type, {
    cx, cy,
    activeColor: (item.strokeColor as string) || (item.color as string) || DEFAULTS.activeColor,
    fillColor: (item.fill as string) || DEFAULTS.fillColor,
    strokeWidth: typeof item.strokeWidth === 'number' ? item.strokeWidth : DEFAULTS.strokeWidth,
    gridVariant: DEFAULTS.gridVariant,
    atomSymbol: (item.element as string) || DEFAULTS.atomSymbol,
  })

  if (!base) {
    warnings.push(`Impossible de créer « ${item.type} » — ignoré.`)
    return null
  }

  // Overlay declared params (coerced) from the AI item.
  const el = base as unknown as Record<string, unknown>
  for (const spec of tool.params ?? []) {
    if (!(spec.key in item)) continue
    const v = coerce(spec, item[spec.key])
    if (v !== undefined) el[spec.key] = v
  }

  // ── Structured fields the registry can't express as simple params ──
  // (exercise content). Copied through verbatim, with fresh state.
  if (item.type === 'qcm') {
    if (Array.isArray(item.options)) {
      el.options = (item.options as unknown[])
        .filter((o): o is Record<string, unknown> => !!o && typeof o === 'object')
        .map((o) => ({ text: String((o as { text?: unknown }).text ?? ''), correct: Boolean((o as { correct?: unknown }).correct) }))
        .filter((o) => o.text)
    }
    el.chosen = []; el.status = 'unanswered'
  }
  if (item.type === 'short-answer') {
    if (item.answer != null) el.answer = String(item.answer)
    if (Array.isArray(item.alternatives)) el.alternatives = (item.alternatives as unknown[]).map(String)
    el.input = ''; el.status = 'unanswered'
  }
  if (item.type === 'fill-blank') {
    el.filled = []; el.status = 'unanswered'
  }
  if (item.type === 'flashcard') {
    el.flipped = false
  }

  // ── Reject AI authoring elements that have no REAL content ──
  // (the agent must fill them; otherwise we'd show placeholder text
  //  like "Titre" / "Écris ton cours ici").
  const hasText = (v: unknown) => typeof v === 'string' && v.trim().length > 0
  if (item.type === 'rich-text' && !hasText(item.body) && !hasText(item.heading)) {
    warnings.push('Bloc de texte vide — ignoré (l’agent doit fournir le contenu).')
    return null
  }
  if (item.type === 'course-card' && !hasText(item.body)) {
    warnings.push('Carte de cours sans contenu — ignorée.')
    return null
  }
  if (item.type === 'sticky-note' && !hasText(item.text)) {
    warnings.push('Post-it vide — ignoré.')
    return null
  }
  if (item.type === 'image' && !hasText(item.src) && !hasText(item.query as string)) {
    warnings.push('Image sans source — ignorée.')
    return null
  }
  // Exercises must be properly specified.
  if (item.type === 'qcm') {
    const opts = el.options as { correct: boolean }[]
    if (!hasText(item.question) || !opts?.length || !opts.some((o) => o.correct)) {
      warnings.push('QCM invalide (question, options ou bonne réponse manquante) — ignoré.')
      return null
    }
  }
  if (item.type === 'short-answer' && (!hasText(item.question) || !hasText(item.answer))) {
    warnings.push('Question à réponse courte incomplète — ignorée.')
    return null
  }
  if (item.type === 'fill-blank' && !/\{\{[^}]+\}\}/.test(String(item.template ?? ''))) {
    warnings.push('Texte à trous sans champ {{…}} — ignoré.')
    return null
  }
  if (item.type === 'flashcard' && (!hasText(item.front) || !hasText(item.back))) {
    warnings.push('Flashcard incomplète — ignorée.')
    return null
  }

  // Identity / position / grouping passthrough.
  if (typeof item.id === 'string' && item.id) el.id = item.id
  else el.id = el.id ?? generateId(item.type)
  if (typeof item.group === 'string') el.group = item.group

  return el as unknown as CanvasElement
}

/**
 * Validate a whole scene. Items without explicit coordinates are
 * laid out on a simple left-to-right grid so an AI can omit x/y.
 */
export function validateScene(
  scene: Scene,
  origin: { x: number; y: number } = { x: 0, y: 0 },
): ValidationResult {
  const warnings: string[] = []
  const errors: string[] = []
  const elements: CanvasElement[] = []

  if (!scene || !Array.isArray(scene.items)) {
    return { ok: false, elements, warnings, errors: ['Scène invalide : « items » manquant.'] }
  }

  const GAP = 200
  const PER_ROW = 4
  let autoIndex = 0

  for (const item of scene.items) {
    const col = autoIndex % PER_ROW
    const row = Math.floor(autoIndex / PER_ROW)
    const fallbackPos = { x: origin.x + col * GAP, y: origin.y + row * GAP }

    const el = validateItem(item, warnings, fallbackPos)
    if (el) {
      elements.push(el)
      if (typeof item.x !== 'number' || typeof item.y !== 'number') autoIndex++
    }
  }

  if (elements.length === 0) {
    errors.push('Aucun élément valide dans la scène.')
  }

  return { ok: elements.length > 0, elements, warnings, errors }
}

/** Parse a raw JSON string (e.g. an AI reply) into a validated result. */
export function parseAndValidate(
  raw: string,
  origin?: { x: number; y: number },
): ValidationResult {
  let data: Scene
  try {
    data = JSON.parse(raw) as Scene
  } catch {
    // Try to salvage a JSON object embedded in prose / code fences.
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) return { ok: false, elements: [], warnings: [], errors: ['JSON illisible.'] }
    try { data = JSON.parse(match[0]) as Scene }
    catch { return { ok: false, elements: [], warnings: [], errors: ['JSON illisible.'] } }
  }
  return validateScene(data, origin)
}
