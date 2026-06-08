/* ============================================================
   Remote agent — calls the Supabase `agent` edge function, which
   in turn calls Claude and returns a validated Scene. Falls back
   to the local rule-based agent when the backend isn't configured
   or the call fails, so the UI always gets an answer.
   ============================================================ */
import type { Agent, AgentContext, AgentResponse } from './types'
import type { Scene, Lesson, EditOp } from '../scene/types'
import { localAgent } from './localAgent'
import { isBackendEnabled, functionsUrl, supabaseAnonKey, getSupabase } from '../lib/supabase'

async function authHeader(): Promise<Record<string, string>> {
  const sb = await getSupabase()
  const token = sb ? (await sb.auth.getSession()).data.session?.access_token : undefined
  return {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${token ?? supabaseAnonKey}`,
  }
}

export const remoteAgent: Agent = {
  name: 'Tuteur IA',
  async generate(prompt: string, ctx: AgentContext): Promise<AgentResponse> {
    if (!isBackendEnabled) return localAgent.generate(prompt, ctx)

    try {
      const res = await fetch(functionsUrl('agent'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
        body: JSON.stringify({
          prompt,
          origin: ctx.origin,
          currentScene: ctx.currentScene,
          history: ctx.history,
        }),
      })
      if (!res.ok) throw new Error(`agent ${res.status}`)
      const data = (await res.json()) as { text?: string; scene?: Scene; lesson?: Lesson; ops?: EditOp[] }
      return { text: data.text ?? '', scene: data.scene, lesson: data.lesson, ops: data.ops }
    } catch (e) {
      console.warn('[remoteAgent] repli sur agent local :', e)
      return localAgent.generate(prompt, ctx)
    }
  },
}
