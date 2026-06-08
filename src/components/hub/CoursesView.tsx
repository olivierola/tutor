/* ============================================================
   Courses view — a folder sidebar (left) + a responsive grid of
   course cards (right). Folders are one level deep; selecting one
   filters the grid. Courses can be dragged onto a folder to file
   them. Clicking a card opens its first page in the editor.
   ============================================================ */
import React, { useState } from 'react'
import { Plus, Folder as FolderIcon, FolderOpen, Layers, Inbox, Pencil, Trash2 } from 'lucide-react'
import { useCoursesStore, type CourseColor } from '../../store/coursesStore'
import { useNavStore } from '../../store/navStore'
import CourseCard, { COLOR_HEX } from './CourseCard'
import FolderCard from './FolderCard'
import { T, R } from '../../theme/tokens'

type Selection = { kind: 'all' } | { kind: 'unfiled' } | { kind: 'folder'; id: string }

const CoursesView: React.FC = () => {
  const courses = useCoursesStore((s) => s.courses)
  const folders = useCoursesStore((s) => s.folders)
  const createCourse = useCoursesStore((s) => s.createCourse)
  const updateCourse = useCoursesStore((s) => s.updateCourse)
  const deleteCourse = useCoursesStore((s) => s.deleteCourse)
  const duplicateCourse = useCoursesStore((s) => s.duplicateCourse)
  const createFolder = useCoursesStore((s) => s.createFolder)
  const renameFolder = useCoursesStore((s) => s.renameFolder)
  const deleteFolder = useCoursesStore((s) => s.deleteFolder)
  const moveCourseToFolder = useCoursesStore((s) => s.moveCourseToFolder)
  const openCourse = useNavStore((s) => s.openCourse)

  const [sel, setSel] = useState<Selection>({ kind: 'all' })
  const [dropTarget, setDropTarget] = useState<string | null>(null) // folder id / '__unfiled'

  const handleCreate = () => {
    const folderId = sel.kind === 'folder' ? sel.id : undefined
    const course = createCourse()
    if (folderId) moveCourseToFolder(course.id, folderId)
    openCourse(course.id, course.pages[0].id)
  }
  const handleOpen = (id: string) => { const c = courses.find((c) => c.id === id); if (c) openCourse(c.id, c.pages[0].id) }
  const handleRename = (id: string, cur: string) => { const t = window.prompt('Nom du cours', cur); if (t?.trim()) updateCourse(id, { title: t.trim() }) }
  const handleDelete = (id: string, title: string) => { if (window.confirm(`Supprimer « ${title} » ?`)) deleteCourse(id) }

  const countIn = (pred: (folderId?: string) => boolean) => courses.filter((c) => pred(c.folderId)).length
  const visible = courses.filter((c) => {
    // In "all", filed courses live inside their folder cards, so only
    // show unfiled courses alongside the folder tiles (explorer style).
    if (sel.kind === 'all') return !c.folderId
    if (sel.kind === 'unfiled') return !c.folderId
    return c.folderId === sel.id
  })

  // ── drag & drop helpers ───────────────────────────────────────
  const onDropTo = (folderId: string | undefined, e: React.DragEvent) => {
    e.preventDefault()
    const courseId = e.dataTransfer.getData('text/course-id')
    if (courseId) moveCourseToFolder(courseId, folderId)
    setDropTarget(null)
  }

  const folderRow = (
    key: string, icon: React.ReactNode, label: string, count: number,
    active: boolean, onClick: () => void,
    dnd?: { id: string; folderId: string | undefined; extra?: React.ReactNode },
  ) => {
    const isDrop = dnd && dropTarget === dnd.id
    return (
      <div
        key={key}
        onClick={onClick}
        onDragOver={dnd ? (e) => { e.preventDefault(); setDropTarget(dnd.id) } : undefined}
        onDragLeave={dnd ? () => setDropTarget((d) => (d === dnd.id ? null : d)) : undefined}
        onDrop={dnd ? (e) => onDropTo(dnd.folderId, e) : undefined}
        style={{
          display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: R.md,
          cursor: 'pointer', userSelect: 'none',
          background: isDrop ? T.accentSoft : active ? T.surface3 : 'transparent',
          color: active ? T.text1 : T.text2, fontSize: 13, fontWeight: active ? 600 : 400,
          border: `1px solid ${isDrop ? 'var(--accent)' : 'transparent'}`,
          transition: 'background var(--dur-fast) var(--ease)',
        }}
        onMouseEnter={(e) => { if (!active && !isDrop) e.currentTarget.style.background = T.hoverBg }}
        onMouseLeave={(e) => { if (!active && !isDrop) e.currentTarget.style.background = 'transparent' }}
      >
        <span style={{ flexShrink: 0, display: 'flex', color: active ? 'var(--accent-text)' : T.text3 }}>{icon}</span>
        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
        <span style={{ fontSize: 11.5, color: T.text3, fontFamily: 'monospace' }}>{count}</span>
        {dnd?.extra}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', maxWidth: 1280, margin: '0 auto', width: '100%', padding: '28px 32px', gap: 28, alignItems: 'flex-start' }}>
      {/* ── Folder sidebar ─────────────────────────────────────── */}
      <aside style={{ width: 210, flexShrink: 0, position: 'sticky', top: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 10px 8px' }}>
          Bibliothèque
        </div>
        {folderRow('all', <Layers size={16} />, 'Tous les cours', courses.length, sel.kind === 'all', () => setSel({ kind: 'all' }))}
        {folderRow('unfiled', <Inbox size={16} />, 'Sans dossier', countIn((f) => !f), sel.kind === 'unfiled', () => setSel({ kind: 'unfiled' }),
          { id: '__unfiled', folderId: undefined })}

        <div style={{ height: 1, background: T.border, margin: '10px 6px' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px 6px' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dossiers</span>
          <button title="Nouveau dossier" onClick={() => createFolder()} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: T.text3, padding: 2, display: 'flex' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-text)')} onMouseLeave={(e) => (e.currentTarget.style.color = T.text3)}>
            <Plus size={16} />
          </button>
        </div>

        {folders.length === 0 && (
          <div style={{ fontSize: 12, color: T.text3, padding: '4px 10px', lineHeight: 1.5 }}>
            Crée un dossier puis glisse-y des cours.
          </div>
        )}
        {folders.map((f) => {
          const active = sel.kind === 'folder' && sel.id === f.id
          return folderRow(
            f.id,
            active ? <FolderOpen size={16} /> : <FolderIcon size={16} style={{ color: COLOR_HEX[f.color] }} />,
            f.name, countIn((fid) => fid === f.id), active,
            () => setSel({ kind: 'folder', id: f.id }),
            {
              id: f.id, folderId: f.id,
              extra: active ? (
                <span style={{ display: 'flex', gap: 2 }}>
                  <button title="Renommer" onClick={(e) => { e.stopPropagation(); const n = window.prompt('Nom du dossier', f.name); if (n?.trim()) renameFolder(f.id, n) }}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: T.text3, padding: 1, display: 'flex' }}><Pencil size={13} /></button>
                  <button title="Supprimer le dossier" onClick={(e) => { e.stopPropagation(); if (window.confirm('Supprimer ce dossier ? Les cours seront déclassés, pas supprimés.')) { deleteFolder(f.id); setSel({ kind: 'all' }) } }}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#f87171', padding: 1, display: 'flex' }}><Trash2 size={13} /></button>
                </span>
              ) : undefined,
            },
          )
        })}
      </aside>

      {/* ── Main content ───────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: T.text1, margin: 0, letterSpacing: '-0.025em' }}>
              {sel.kind === 'all' ? 'Tous les cours' : sel.kind === 'unfiled' ? 'Sans dossier' : folders.find((f) => f.id === sel.id)?.name ?? 'Cours'}
            </h1>
            <p style={{ fontSize: 13.5, color: T.text3, margin: '6px 0 0' }}>
              {sel.kind === 'all'
                ? `${folders.length} dossier${folders.length > 1 ? 's' : ''} · ${visible.length} cours non classé${visible.length > 1 ? 's' : ''} · glissez une carte sur un dossier.`
                : `${visible.length} cours dans ce dossier.`}
            </p>
          </div>
          <button
            onClick={handleCreate}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0,
              height: 38, padding: '0 16px', borderRadius: R.md, cursor: 'pointer',
              background: 'var(--accent)', color: 'var(--text-on-accent)', border: 'none',
              fontSize: 13.5, fontWeight: 600, fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
          >
            <Plus size={17} /> Nouveau cours
          </button>
        </div>

        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
          {/* Folder cards — shown first, only in the "all courses" view */}
          {sel.kind === 'all' && folders.map((f) => (
            <FolderCard
              key={f.id}
              folder={f}
              count={countIn((fid) => fid === f.id)}
              isDropTarget={dropTarget === f.id}
              onOpen={() => setSel({ kind: 'folder', id: f.id })}
              onRename={() => { const n = window.prompt('Nom du dossier', f.name); if (n?.trim()) renameFolder(f.id, n) }}
              onDelete={() => { if (window.confirm('Supprimer ce dossier ? Les cours seront déclassés, pas supprimés.')) deleteFolder(f.id) }}
              onDragOver={(e) => { e.preventDefault(); setDropTarget(f.id) }}
              onDragLeave={() => setDropTarget((d) => (d === f.id ? null : d))}
              onDrop={(e) => onDropTo(f.id, e)}
            />
          ))}
          {visible.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onOpen={() => handleOpen(course.id)}
              onRename={() => handleRename(course.id, course.title)}
              onDuplicate={() => duplicateCourse(course.id)}
              onDelete={() => handleDelete(course.id, course.title)}
              onColorChange={(color: CourseColor) => updateCourse(course.id, { color })}
            />
          ))}
          <AddCourseCard onClick={handleCreate} />
        </div>
      </div>
    </div>
  )
}

const AddCourseCard: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        cursor: 'pointer', minHeight: 150, width: '100%',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
        background: hover ? T.surface2 : 'transparent',
        border: `1.5px dashed ${hover ? 'var(--accent)' : T.borderStrong}`,
        borderRadius: R.lg, fontFamily: 'inherit', color: hover ? 'var(--accent-text)' : T.text3,
        transition: 'all var(--dur-fast) var(--ease)',
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: R.md,
        background: hover ? T.accentSoft : T.surface3, color: hover ? 'var(--accent-text)' : T.text3,
        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all var(--dur-fast) var(--ease)',
      }}>
        <Plus size={22} />
      </div>
      <span style={{ fontSize: 13.5, fontWeight: 600 }}>Nouveau cours</span>
    </button>
  )
}

export default CoursesView
