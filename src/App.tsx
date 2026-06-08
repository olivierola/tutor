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

const App: React.FC = () => {
  useThemeSync()
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
