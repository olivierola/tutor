/* ============================================================
   Course editor — wraps the infinite canvas for one course.

   Responsibilities:
     • hydrate canvasStore from the active page on open/switch
     • autosave the live canvas back into coursesStore (debounced)
     • floating controls over a full-bleed canvas: a back button
       and a pages dropdown (no full-width navbar)
   ============================================================ */
import React, { useEffect, useRef, useCallback, useState } from 'react'
import { ArrowLeft, Plus, X, ChevronDown, FileText, Check, PanelRight } from 'lucide-react'
import InfiniteCanvas from '../Canvas/InfiniteCanvas'
import VerticalToolbar from '../Toolbar/VerticalToolbar'
import AgentInput from '../Toolbar/AgentInput'
import ChatBubble from '../Canvas/ChatBubble'
import { useCanvasStore } from '../../store/canvasStore'
import { useCoursesStore } from '../../store/coursesStore'
import { useNavStore } from '../../store/navStore'
import { T, R } from '../../theme/tokens'

interface Props {
  courseId: string
  pageId: string
}

const CourseEditor: React.FC<Props> = ({ courseId, pageId }) => {
  const getCourse = useCoursesStore((s) => s.getCourse)
  const getPage = useCoursesStore((s) => s.getPage)
  const updatePage = useCoursesStore((s) => s.updatePage)
  const addPage = useCoursesStore((s) => s.addPage)
  const deletePage = useCoursesStore((s) => s.deletePage)

  const loadDocument = useCanvasStore((s) => s.loadDocument)
  const getDocument = useCanvasStore((s) => s.getDocument)

  const goHub = useNavStore((s) => s.goHub)
  const openCourse = useNavStore((s) => s.openCourse)

  const course = getCourse(courseId)
  const activePage = course?.pages.find((p) => p.id === pageId)

  // Toolbar (vertical) open state.
  const [toolbarOpen, setToolbarOpen] = useState(false)
  // Pages dropdown open state + outside-click close.
  const [pagesOpen, setPagesOpen] = useState(false)
  const pagesRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!pagesOpen) return
    const h = (e: MouseEvent) => { if (pagesRef.current && !pagesRef.current.contains(e.target as Node)) setPagesOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [pagesOpen])

  // Track which page is currently loaded so we save the right one.
  const loadedPageRef = useRef<string | null>(null)

  // Persist the live canvas into the page it was loaded from.
  const saveCurrent = useCallback(() => {
    const pid = loadedPageRef.current
    if (!pid) return
    const doc = getDocument()
    updatePage(courseId, pid, {
      elements: doc.elements,
      instruments: doc.instruments,
      viewport: doc.viewport,
    })
  }, [courseId, getDocument, updatePage])

  // Hydrate canvas when the active page changes.
  useEffect(() => {
    // save the previously loaded page before switching
    if (loadedPageRef.current && loadedPageRef.current !== pageId) saveCurrent()
    const page = getPage(courseId, pageId)
    if (page) {
      loadDocument({ elements: page.elements, instruments: page.instruments, viewport: page.viewport })
      loadedPageRef.current = pageId
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, pageId])

  // Debounced autosave on any canvas mutation.
  useEffect(() => {
    let timer: number | undefined
    const unsub = useCanvasStore.subscribe(
      (s) => [s.elements, s.instruments, s.viewport] as const,
      () => {
        window.clearTimeout(timer)
        timer = window.setTimeout(saveCurrent, 600)
      },
      { equalityFn: (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2] }
    )
    return () => { window.clearTimeout(timer); unsub() }
  }, [saveCurrent])

  // Save on unmount (leaving the editor).
  useEffect(() => () => { saveCurrent() }, [saveCurrent])

  const handleBack = () => { saveCurrent(); goHub('courses') }

  const handleAddPage = () => {
    saveCurrent()
    const page = addPage(courseId)
    if (page) openCourse(courseId, page.id)
  }

  const handleDeletePage = (pid: string) => {
    if (!course) return
    if (course.pages.length <= 1) return
    if (!window.confirm('Supprimer cette page ?')) return
    deletePage(courseId, pid)
    if (pid === pageId) {
      const remaining = getCourse(courseId)?.pages
      if (remaining && remaining[0]) openCourse(courseId, remaining[0].id)
    }
  }

  if (!course) {
    // Course vanished (deleted elsewhere) — bounce home.
    goHub('courses')
    return null
  }

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', background: 'var(--canvas-bg)' }}>
      {/* Full-bleed canvas */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <InfiniteCanvas />
      </div>

      {/* Chat panel — top-left */}
      <ChatBubble leftOffset={0} />

      {/* Vertical toolbar (right), shown when open, with slide-in */}
      {toolbarOpen && (
        <div className="toolbar-in" style={{ position: 'absolute', top: 64, right: 16, zIndex: 45 }}>
          <VerticalToolbar side="right" onClose={() => setToolbarOpen(false)} />
        </div>
      )}

      {/* Floating circular toggle button (top-right) */}
      <button
        onClick={() => setToolbarOpen((o) => !o)}
        title={toolbarOpen ? 'Masquer les outils' : 'Outils'}
        style={{
          position: 'absolute', top: 14, right: 14, zIndex: 46,
          width: 44, height: 44, borderRadius: '50%', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1px solid ${toolbarOpen ? 'var(--accent)' : T.border}`,
          background: toolbarOpen ? 'var(--accent)' : T.surfaceOverlay, backdropFilter: 'blur(12px)',
          color: toolbarOpen ? 'var(--text-on-accent)' : T.text2,
          boxShadow: T.shadowMd,
          transition: 'background var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease), transform var(--dur-fast) var(--ease)',
        }}
        onMouseEnter={(e) => { if (!toolbarOpen) e.currentTarget.style.color = T.text1 }}
        onMouseLeave={(e) => { if (!toolbarOpen) e.currentTarget.style.color = T.text2 }}
      >
        {toolbarOpen ? <X size={20} /> : <PanelRight size={19} />}
      </button>

      {/* Chat input — centred at the bottom */}
      <div style={{ position: 'absolute', bottom: 22, left: '50%', transform: 'translateX(-50%)', zIndex: 45 }}>
        <AgentInput />
      </div>

      {/* ── Floating controls (top-left) ─────────────────────────── */}
      <div style={{
        position: 'absolute', top: 14, left: 14, zIndex: 40,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        {/* Back button (floating pill) */}
        <button
          onClick={handleBack}
          title="Retour aux cours"
          style={{
            display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 12px',
            borderRadius: R.full, border: `1px solid ${T.border}`, cursor: 'pointer',
            background: T.surfaceOverlay, backdropFilter: 'blur(12px)',
            color: T.text2, fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
            boxShadow: T.shadowMd,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = T.text1)}
          onMouseLeave={(e) => (e.currentTarget.style.color = T.text2)}
        >
          <ArrowLeft size={16} /> Cours
        </button>

        {/* Pages dropdown (floating pill) */}
        <div ref={pagesRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setPagesOpen((o) => !o)}
            title="Pages"
            style={{
              display: 'flex', alignItems: 'center', gap: 8, height: 36, padding: '0 12px',
              borderRadius: R.full, cursor: 'pointer',
              border: `1px solid ${pagesOpen ? T.borderStrong : T.border}`,
              background: T.surfaceOverlay, backdropFilter: 'blur(12px)',
              color: T.text1, fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
              boxShadow: T.shadowMd, maxWidth: 280,
            }}
          >
            <FileText size={15} style={{ color: T.text3, flexShrink: 0 }} />
            <span style={{ color: T.text3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {course.title} ·
            </span>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {activePage?.title ?? 'Page'}
            </span>
            <ChevronDown size={15} style={{ color: T.text3, flexShrink: 0, transform: pagesOpen ? 'rotate(180deg)' : 'none', transition: 'transform var(--dur-fast)' }} />
          </button>

          {pagesOpen && (
            <div style={{
              position: 'absolute', top: 44, left: 0, minWidth: 240, zIndex: 50,
              background: T.surface1, border: `1px solid ${T.border}`, borderRadius: R.lg,
              boxShadow: T.shadowPop, padding: 6,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '6px 8px 4px' }}>
                Pages
              </div>
              {course.pages.map((p) => {
                const active = p.id === pageId
                return (
                  <div
                    key={p.id}
                    onClick={() => { if (!active) { saveCurrent(); openCourse(courseId, p.id) } setPagesOpen(false) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 8px',
                      borderRadius: R.sm, cursor: 'pointer',
                      background: active ? T.surface3 : 'transparent',
                      color: active ? T.text1 : T.text2,
                    }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = T.hoverBg }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent' }}
                  >
                    <Check size={14} style={{ color: active ? 'var(--accent-text)' : 'transparent', flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</span>
                    {course.pages.length > 1 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeletePage(p.id) }}
                        title="Supprimer la page"
                        style={{ display: 'flex', border: 'none', background: 'transparent', cursor: 'pointer', color: T.text3, padding: 2, borderRadius: 4 }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = T.text3)}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                )
              })}
              <div style={{ height: 1, background: T.border, margin: '4px 0' }} />
              <button
                onClick={() => { setPagesOpen(false); handleAddPage() }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px',
                  borderRadius: R.sm, border: 'none', cursor: 'pointer', background: 'transparent',
                  color: 'var(--accent-text)', fontSize: 13, fontFamily: 'inherit', textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.hoverBg)}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Plus size={15} /> Nouvelle page
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CourseEditor
