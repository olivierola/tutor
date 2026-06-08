/* ============================================================
   Folder card — a folder-shaped tile shown in the courses grid.
   Clicking opens the folder (filters the grid); a course can be
   dropped onto it to file it. Shows the folder colour, name and
   course count, plus rename/delete on hover.
   ============================================================ */
import React, { useState, useRef, useEffect } from 'react'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import type { Folder } from '../../store/coursesStore'
import { COLOR_HEX } from './CourseCard'
import { T, R } from '../../theme/tokens'

interface Props {
  folder: Folder
  count: number
  isDropTarget: boolean
  onOpen: () => void
  onRename: () => void
  onDelete: () => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
}

const FolderCard: React.FC<Props> = ({ folder, count, isDropTarget, onOpen, onRename, onDelete, onDragOver, onDragLeave, onDrop }) => {
  const [hover, setHover] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const accent = COLOR_HEX[folder.color]

  useEffect(() => {
    if (!menuOpen) return
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [menuOpen])

  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      style={{
        position: 'relative', cursor: 'pointer', minHeight: 150,
        background: isDropTarget ? T.accentSoft : T.surface2,
        border: `1px solid ${isDropTarget ? 'var(--accent)' : hover ? T.borderStrong : T.border}`,
        borderRadius: R.lg, padding: 16, display: 'flex', flexDirection: 'column',
        transform: hover && !isDropTarget ? 'translateY(-2px)' : 'none',
        boxShadow: hover ? T.shadowMd : 'none',
        transition: 'border-color var(--dur-fast) var(--ease), transform var(--dur-fast) var(--ease), background var(--dur-fast) var(--ease)',
      }}
    >
      {/* Folder glyph */}
      <div style={{ position: 'relative', width: 56, height: 44, marginBottom: 14 }}>
        {/* back tab */}
        <div style={{
          position: 'absolute', top: 0, left: 0, width: 26, height: 10, borderRadius: '4px 8px 0 0',
          background: accent, opacity: 0.9,
        }} />
        {/* body */}
        <div style={{
          position: 'absolute', top: 7, left: 0, width: 56, height: 37, borderRadius: '4px 8px 8px 8px',
          background: `color-mix(in srgb, ${accent} 85%, #000 0%)`,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)',
        }} />
        {/* front flap */}
        <div style={{
          position: 'absolute', top: 15, left: 0, width: 56, height: 29, borderRadius: '6px',
          background: `color-mix(in srgb, ${accent} 70%, #fff 14%)`,
        }} />
      </div>

      {/* Overflow menu */}
      <div ref={menuRef} style={{ position: 'absolute', top: 12, right: 12 }}>
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o) }}
          style={{
            width: 28, height: 28, borderRadius: R.sm, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: menuOpen ? T.surface3 : 'transparent', color: T.text3,
            opacity: hover || menuOpen ? 1 : 0, transition: 'opacity var(--dur-fast)',
          }}
        >
          <MoreHorizontal size={16} />
        </button>
        {menuOpen && (
          <div style={{
            position: 'absolute', top: 32, right: 0, zIndex: 200, minWidth: 160,
            background: T.surface1, border: `1px solid ${T.border}`, borderRadius: R.md, boxShadow: T.shadowPop, padding: 5,
          }}>
            <MenuItem icon={<Pencil size={14} />} label="Renommer" onClick={() => { setMenuOpen(false); onRename() }} />
            <div style={{ height: 1, background: T.border, margin: '4px 0' }} />
            <MenuItem icon={<Trash2 size={14} />} label="Supprimer" danger onClick={() => { setMenuOpen(false); onDelete() }} />
          </div>
        )}
      </div>

      {/* Name + count */}
      <div style={{ marginTop: 'auto' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: T.text1, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {folder.name}
        </div>
        <div style={{ fontSize: 12.5, color: T.text3 }}>
          {count} cours{count > 1 ? '' : ''}
        </div>
      </div>
    </div>
  )
}

const MenuItem: React.FC<{ icon: React.ReactNode; label: string; danger?: boolean; onClick: () => void }> = ({ icon, label, danger, onClick }) => (
  <button
    onClick={(e) => { e.stopPropagation(); onClick() }}
    style={{
      display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px',
      borderRadius: R.sm, border: 'none', cursor: 'pointer', background: 'transparent',
      color: danger ? '#f87171' : T.text2, fontSize: 12.5, fontFamily: 'inherit', textAlign: 'left',
    }}
    onMouseEnter={(e) => (e.currentTarget.style.background = T.hoverBg)}
    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
  >
    {icon}{label}
  </button>
)

export default FolderCard
