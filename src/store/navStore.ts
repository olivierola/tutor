/* ============================================================
   App navigation — which top-level view is showing.

   Kept deliberately tiny and separate from data stores. The
   hub shows a section (dashboard / courses / settings); the
   editor shows one course's pages on the infinite canvas.
   ============================================================ */
import { create } from 'zustand'

export type HubSection = 'dashboard' | 'courses' | 'settings'
export type View =
  | { kind: 'hub'; section: HubSection }
  | { kind: 'editor'; courseId: string; pageId: string }

interface NavState {
  view: View
  goHub: (section?: HubSection) => void
  openCourse: (courseId: string, pageId: string) => void
}

export const useNavStore = create<NavState>((set) => ({
  view: { kind: 'hub', section: 'courses' },
  goHub: (section = 'courses') => set({ view: { kind: 'hub', section } }),
  openCourse: (courseId, pageId) => set({ view: { kind: 'editor', courseId, pageId } }),
}))
