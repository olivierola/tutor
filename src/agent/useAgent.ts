/* ============================================================
   useAgent — orchestrates a single ask→render turn:
     prompt → agent.generate → applyScene → canvas.
   Computes a sensible origin (centre of the current viewport)
   so the AI's figure lands where the user is looking, and
   surfaces status + the last message for the UI.
   ============================================================ */
import { useState, useCallback } from 'react'
import { remoteAgent } from './remoteAgent'
import type { Agent } from './types'
import { applyScene, applyLesson, applyOps, exportScene } from '../scene/apply'
import { useCanvasStore } from '../store/canvasStore'
import { useNavStore } from '../store/navStore'
import { useCoursesStore } from '../store/coursesStore'
import { useAgentStore } from './agentStore'

export type AgentStatus = 'idle' | 'pending' | 'done' | 'error'

export interface AgentTurn {
  text: string
  ok: boolean
  warnings: string[]
}

function viewportCentre(): { x: number; y: number } {
  const { viewport } = useCanvasStore.getState()
  // Convert screen centre to canvas-space.
  const sx = window.innerWidth / 2
  const sy = window.innerHeight / 2
  return {
    x: Math.round((sx - viewport.x) / viewport.zoom),
    y: Math.round((sy - viewport.y) / viewport.zoom),
  }
}

export function useAgent(agent: Agent = remoteAgent) {
  const [status, setStatus] = useState<AgentStatus>('idle')
  const [lastTurn, setLastTurn] = useState<AgentTurn | null>(null)

  const ask = useCallback(async (prompt: string) => {
    const text = prompt.trim()
    if (!text || status === 'pending') return
    setStatus('pending')
    setLastTurn(null)
    useAgentStore.getState().set({ status: 'pending', bubbleOpen: true, lastTurn: null })
    // Resolve the active course (for the persistent chat session).
    const view = useNavStore.getState().view
    const courseId = view.kind === 'editor' ? view.courseId : null
    const courses = useCoursesStore.getState()

    // Persist the user's turn + build conversational history for the agent.
    if (courseId) courses.addMessage(courseId, { role: 'user', content: text })
    const priorMsgs = courseId ? (courses.getCourse(courseId)?.messages ?? []) : []
    const history = priorMsgs.slice(-8).map((m) => ({ role: m.role, content: m.content }))

    try {
      const origin = viewportCentre()
      const res = await agent.generate(text, { currentScene: exportScene(), origin, history })

      let warnings: string[] = []
      let ok = true

      // Priority: full lesson > targeted edits (ops) > single scene.
      if (res.lesson) {
        const view = useNavStore.getState().view
        if (view.kind === 'editor') {
          const r = applyLesson(res.lesson, { courseId: view.courseId, pageId: view.pageId, origin })
          warnings = r.warnings
          ok = r.ok
        } else {
          warnings = ['Ouvre un cours pour générer une leçon complète.']
          ok = false
        }
      } else if (res.ops && res.ops.length > 0) {
        const r = applyOps(res.ops, origin)
        warnings = r.warnings
        ok = r.ok
      } else if (res.scene) {
        // Reveal step by step (live teaching) with the writing effect.
        const result = applyScene(res.scene, { origin, animate: true })
        warnings = result.warnings
        ok = result.ok
      }

      const turn = { text: res.text, ok, warnings }
      setLastTurn(turn)
      setStatus('done')

      // Persist the assistant's reply to the course chat session.
      if (courseId && res.text) courses.addMessage(courseId, { role: 'assistant', content: res.text })

      // Surface the reply in the floating chat bubble. A "chat-only"
      // answer (no drawing) always shows; otherwise the short text
      // accompanies the drawing.
      const chatOnly = !res.scene && !res.lesson && !(res.ops && res.ops.length)
      useAgentStore.getState().set({
        status: 'done', lastTurn: turn, chatOnly, bubbleOpen: Boolean(res.text),
      })
    } catch (e) {
      const turn = { text: e instanceof Error ? e.message : 'Erreur de l’agent.', ok: false, warnings: [] }
      setLastTurn(turn)
      setStatus('error')
      useAgentStore.getState().set({ status: 'error', lastTurn: turn, chatOnly: true, bubbleOpen: true })
    }
  }, [agent, status])

  const reset = useCallback(() => { setStatus('idle'); setLastTurn(null) }, [])

  return { status, lastTurn, ask, reset, agentName: agent.name }
}
