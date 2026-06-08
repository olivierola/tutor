/* ============================================================
   Lesson orchestrator — multi-prompt course generation.

   Instead of one overloaded prompt, we:
     1. call `lesson-plan` (the "prompteur") to get a detailed
        outline: pages, each with an ultra-detailed `brief`;
     2. generate each page SEPARATELY by calling `agent` with that
        page's brief (focused, complete content);
     3. apply pages progressively — the first onto the current
        page, the rest as new course pages — reporting progress.

   Falls back to a single-shot lesson if the planner isn't
   available, so generation always succeeds.
   ============================================================ */
import type { Scene } from '../scene/types'
import { isBackendEnabled, functionsUrl, supabaseAnonKey, getSupabase } from '../lib/supabase'
import { validateScene } from './../scene/validate'
import { autoLayout } from '../scene/autoLayout'
import { useCanvasStore } from '../store/canvasStore'
import { useCoursesStore } from '../store/coursesStore'

export interface PlanPage { title: string; objective?: string; brief: string }
export interface LessonPlan { title: string; pages: PlanPage[] }

export interface OrchestratorProgress {
  phase: 'planning' | 'page' | 'done' | 'error'
  current?: number
  total?: number
  pageTitle?: string
  message?: string
}

async function authHeader(): Promise<Record<string, string>> {
  const sb = await getSupabase()
  const token = sb ? (await sb.auth.getSession()).data.session?.access_token : undefined
  return { apikey: supabaseAnonKey, Authorization: `Bearer ${token ?? supabaseAnonKey}` }
}

/** Ask the planner for a structured outline. */
async function fetchPlan(topic: string): Promise<LessonPlan | null> {
  try {
    const res = await fetch(functionsUrl('lesson-plan'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: JSON.stringify({ topic }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as LessonPlan
    if (!data?.pages?.length) return null
    return data
  } catch { return null }
}

/** Generate one page's scene from its brief via the `agent` function. */
async function fetchPageScene(brief: string, origin: { x: number; y: number }): Promise<Scene | null> {
  try {
    const prompt =
      `Génère UNE seule page de cours (format "scene", surtout pas "lesson") ` +
      `correspondant exactement à ce brief :\n\n${brief}`
    const res = await fetch(functionsUrl('agent'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: JSON.stringify({ prompt, origin }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { scene?: Scene; lesson?: { pages?: { items: unknown[] }[] } }
    if (data.scene?.items?.length) return data.scene
    // tolerate a model that returned a lesson: take its first page
    const lp = data.lesson?.pages?.[0]
    if (lp?.items?.length) return { items: lp.items as Scene['items'] }
    return null
  } catch { return null }
}

/**
 * Run the full multi-prompt generation for a course, applying each
 * page as it arrives. Returns true if anything was produced.
 */
export async function generateLesson(
  topic: string,
  ctx: { courseId: string; pageId: string; origin: { x: number; y: number } },
  onProgress: (p: OrchestratorProgress) => void,
): Promise<boolean> {
  if (!isBackendEnabled) return false

  onProgress({ phase: 'planning' })
  const plan = await fetchPlan(topic)
  if (!plan) { onProgress({ phase: 'error', message: 'Plan indisponible.' }); return false }

  const courses = useCoursesStore.getState()
  const canvas = useCanvasStore.getState()
  if (plan.title?.trim()) courses.updateCourse(ctx.courseId, { title: plan.title.trim() })

  const total = plan.pages.length
  let produced = 0

  for (let i = 0; i < total; i++) {
    const page = plan.pages[i]
    onProgress({ phase: 'page', current: i + 1, total, pageTitle: page.title })

    const scene = await fetchPageScene(page.brief, ctx.origin)
    const result = scene ? validateScene(scene, ctx.origin) : null
    const els = result?.elements ?? []
    if (els.length === 0) continue
    autoLayout(els, ctx.origin)

    if (i === 0) {
      // First page fills the currently open page.
      canvas.addElements(els, { select: false, createdBy: 'ai' })
      courses.updatePage(ctx.courseId, ctx.pageId, { title: page.title || 'Introduction' })
    } else {
      const created = courses.addPage(ctx.courseId, page.title || `Page ${i + 1}`)
      if (created) {
        courses.updatePage(ctx.courseId, created.id, {
          elements: JSON.parse(JSON.stringify(els)),
          viewport: { x: 0, y: 0, zoom: 1 },
          instruments: [],
        })
      }
    }
    produced++
  }

  onProgress({ phase: 'done', total })
  return produced > 0
}
