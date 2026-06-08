/* ============================================================
   App navigation — the URL is the source of truth (react-router).
   This store mirrors the current view (derived from the route) so
   the many components that read `view` keep working, and exposes
   goHub/openCourse which push real URLs via a registered navigate
   function. RouterSync (in App) keeps `view` in sync with the URL.
   ============================================================ */
import { create } from 'zustand'

export type HubSection = 'dashboard' | 'courses' | 'settings'
export type View =
  | { kind: 'hub'; section: HubSection }
  | { kind: 'editor'; courseId: string; pageId: string }

/** Map hub sections to their URL path. */
export const SECTION_PATH: Record<HubSection, string> = {
  dashboard: '/tableau-de-bord',
  courses: '/cours',
  settings: '/reglages',
}

export function viewToPath(view: View): string {
  if (view.kind === 'editor') return `/cours/${view.courseId}/${view.pageId}`
  return SECTION_PATH[view.section]
}

type NavigateFn = (path: string) => void

interface NavState {
  view: View
  /** Internal: set by RouterSync from the current URL. */
  _setView: (view: View) => void
  /** Internal: register react-router's navigate. */
  _setNavigate: (fn: NavigateFn) => void
  goHub: (section?: HubSection) => void
  openCourse: (courseId: string, pageId: string) => void
}

let navigate: NavigateFn = () => { /* set once the router mounts */ }

export const useNavStore = create<NavState>((set) => ({
  view: { kind: 'hub', section: 'courses' },
  _setView: (view) => set({ view }),
  _setNavigate: (fn) => { navigate = fn },
  goHub: (section = 'courses') => navigate(SECTION_PATH[section]),
  openCourse: (courseId, pageId) => navigate(`/cours/${courseId}/${pageId}`),
}))
