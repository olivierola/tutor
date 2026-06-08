/* ============================================================
   Agent layer — the contract between the UI and whatever brain
   answers the student. Today a local rule-based stub fulfils it;
   tomorrow a Claude-backed implementation can drop in unchanged.

   An agent receives the student's prompt plus light context
   (the current scene, so it can build on what's already drawn)
   and returns a textual reply and/or a Scene to render.
   ============================================================ */
import type { Scene, Lesson, EditOp } from '../scene/types'

export interface AgentContext {
  /** Snapshot of the current canvas, so the agent can extend it. */
  currentScene?: Scene
  /** Where new elements should be anchored (canvas-space). */
  origin?: { x: number; y: number }
  /** Optional level/subject hints for register filtering later. */
  level?: 'college' | 'lycee' | 'superieur'
  subject?: string
  /** Prior turns of the persistent per-course conversation. */
  history?: { role: 'user' | 'assistant'; content: string }[]
}

export interface AgentResponse {
  /** Short message shown to the student (explanation, confirmation). */
  text: string
  /** Optional illustration to render on the current page. */
  scene?: Scene
  /** Optional full multi-page lesson to author across pages. */
  lesson?: Lesson
  /** Optional targeted edits (add/update/remove) to existing elements. */
  ops?: EditOp[]
}

export interface Agent {
  /** Human label, shown in the UI. */
  readonly name: string
  generate(prompt: string, ctx: AgentContext): Promise<AgentResponse>
}
