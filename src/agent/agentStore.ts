/* ============================================================
   Agent UI store — shares the agent's last message + status
   across components (the toolbar input AND the floating chat
   bubble), so the bubble can show clarifications/replies that
   aren't drawn on the canvas.
   ============================================================ */
import { create } from 'zustand'
import type { AgentStatus, AgentTurn } from './useAgent'

interface AgentUIStore {
  status: AgentStatus
  lastTurn: AgentTurn | null
  /** true when the reply is a chat-only answer (no canvas drawing). */
  chatOnly: boolean
  bubbleOpen: boolean
  set: (patch: Partial<Omit<AgentUIStore, 'set'>>) => void
  dismiss: () => void
}

export const useAgentStore = create<AgentUIStore>((set) => ({
  status: 'idle',
  lastTurn: null,
  chatOnly: false,
  bubbleOpen: false,
  set: (patch) => set(patch),
  dismiss: () => set({ bubbleOpen: false }),
}))
