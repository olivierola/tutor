import React, { useEffect } from 'react'
import {
  BrowserRouter, Routes, Route, Navigate, useNavigate, useParams,
} from 'react-router-dom'
import Hub from './components/hub/Hub'
import CourseEditor from './components/editor/CourseEditor'
import { useCanvasStore } from './store/canvasStore'
import { useNavStore, type HubSection } from './store/navStore'
import { useCoursesStore } from './store/coursesStore'
import { useThemeSync } from './theme/useTheme'
import { useAuthStore } from './auth/authStore'
import AuthScreen from './auth/AuthScreen'
import { initCloudSync } from './auth/cloudSync'

/** Editor-only keyboard shortcuts (undo/redo/delete). */
function useEditorShortcuts(active: boolean) {
  const undo = useCanvasStore((s) => s.undo)
  const redo = useCanvasStore((s) => s.redo)
  const deleteSelectedElements = useCanvasStore((s) => s.deleteSelectedElements)
  const selectedIds = useCanvasStore((s) => s.selectedIds)

  useEffect(() => {
    if (!active) return
    const handler = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      const isInput = t?.tagName === 'INPUT' || t?.tagName === 'TEXTAREA' || t?.isContentEditable === true
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z': e.preventDefault(); e.shiftKey ? redo() : undo(); break
          case 'y': e.preventDefault(); redo(); break
        }
      } else if (!isInput && (e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        e.preventDefault(); deleteSelectedElements()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [active, undo, redo, deleteSelectedElements, selectedIds])
}

/** Registers react-router's navigate into the nav store (once). */
const RegisterNavigate: React.FC = () => {
  const navigate = useNavigate()
  const setNavigate = useNavStore((s) => s._setNavigate)
  useEffect(() => { setNavigate(navigate) }, [navigate, setNavigate])
  return null
}

/** A hub section route: mirrors the section into the nav store. */
const HubRoute: React.FC<{ section: HubSection }> = ({ section }) => {
  const setView = useNavStore((s) => s._setView)
  useEffect(() => { setView({ kind: 'hub', section }) }, [section, setView])
  useEditorShortcuts(false)
  return <Hub />
}

/** The course editor route: reads :courseId/:pageId from the URL. */
const EditorRoute: React.FC = () => {
  const { courseId = '', pageId = '' } = useParams()
  const setView = useNavStore((s) => s._setView)
  const getCourse = useCoursesStore((s) => s.getCourse)
  useEditorShortcuts(true)

  const course = getCourse(courseId)
  // Resolve the page: the requested one, else the course's first page.
  const page = course?.pages.find((p) => p.id === pageId) ?? course?.pages[0]

  useEffect(() => {
    if (course && page) setView({ kind: 'editor', courseId: course.id, pageId: page.id })
  }, [course, page, setView])

  if (!course) return <Navigate to="/cours" replace />
  if (!page) return <Navigate to="/cours" replace />
  // If the URL's pageId was stale/missing, canonicalise it.
  if (page.id !== pageId) return <Navigate to={`/cours/${course.id}/${page.id}`} replace />

  return <CourseEditor courseId={course.id} pageId={page.id} />
}

/** Shows the auth screen and detects the guest opt-in. */
const AuthGate: React.FC<{ onGuest: () => void }> = ({ onGuest }) => {
  const status = useAuthStore((s) => s.status)
  useEffect(() => { if (status === 'guest') onGuest() }, [status, onGuest])
  return <AuthScreen />
}

const App: React.FC = () => {
  useThemeSync()
  const authStatus = useAuthStore((s) => s.status)
  const initAuth = useAuthStore((s) => s.init)
  // Remember a guest choice for the session so reloads don't re-prompt.
  const [guestChosen, setGuestChosen] = React.useState(() => sessionStorage.getItem('tutor-ai:guest') === '1')

  useEffect(() => { initAuth(); initCloudSync() }, [initAuth])
  useEffect(() => {
    if (authStatus === 'guest' && guestChosen) sessionStorage.setItem('tutor-ai:guest', '1')
  }, [authStatus, guestChosen])

  // While resolving the session, render nothing (avoids a flash).
  if (authStatus === 'loading') return null
  // Not authed and hasn't opted into guest → show the auth screen.
  if (authStatus !== 'authed' && !guestChosen) {
    return <AuthGate onGuest={() => { setGuestChosen(true); sessionStorage.setItem('tutor-ai:guest', '1') }} />
  }

  return (
    <BrowserRouter>
      <RegisterNavigate />
      <Routes>
        <Route path="/" element={<Navigate to="/cours" replace />} />
        <Route path="/tableau-de-bord" element={<HubRoute section="dashboard" />} />
        <Route path="/cours" element={<HubRoute section="courses" />} />
        <Route path="/reglages" element={<HubRoute section="settings" />} />
        <Route path="/cours/:courseId/:pageId" element={<EditorRoute />} />
        <Route path="/cours/:courseId" element={<EditorRoute />} />
        <Route path="*" element={<Navigate to="/cours" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
