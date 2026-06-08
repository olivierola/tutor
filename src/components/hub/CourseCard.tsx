/* ============================================================
   Course card — the clickable tile that opens a course's
   infinite canvas. Styled after the reference cards: dark
   surface, subtle border, accent top-edge on hover, square
   icon chip, title, meta row, and a chevron / overflow menu.
   ============================================================ */
import React, { useState, useRef, useEffect } from 'react'
import { BookOpen, ChevronRight, MoreHorizontal, Pencil, Copy, Trash2 } from 'lucide-react'
import type { Course, CourseColor } from '../../store/coursesStore'
import { T, R } from '../../theme/tokens'

export const COLOR_HEX: Record<CourseColor, string> = {
  blue: '#4f46e5', violet: '#7c3aed', emerald: '#059669',
  amber: '#d97706', rose: '#db2777', cyan: '#0891b2', zinc: '#52525b',
}

const COLOR_ORDER: CourseColor[] = ['blue', 'violet', 'emerald', 'amber', 'rose', 'cyan', 'zinc']

interface Props {
  course: Course
  onOpen: () => void
  onRename: () => void
  onDuplicate: () => void
  onDelete: () => void
  onColorChange: (color: CourseColor) => void
}

const CourseCard: React.FC<Props> = ({ course, onOpen, onRename, onDuplicate, onDelete, onColorChange }) => {
  const [hover, setHover] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const accent = COLOR_HEX[course.color]

  useEffect(() => {
    if (!menuOpen) return
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [menuOpen])

  const pageCount = course.pages.length
  const elementCount = course.pages.reduce((n, p) => n + p.elements.length, 0)

  const menuItem = (icon: React.ReactNode, label: string, fn: () => void, danger = false) => (
    <button
      onClick={(e) => { e.stopPropagation(); setMenuOpen(false); fn() }}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
        padding: '7px 10px', borderRadius: R.sm, border: 'none', cursor: 'pointer',
        background: 'transparent', color: danger ? '#f87171' : T.text2,
        fontSize: 12.5, fontFamily: 'inherit', textAlign: 'left',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = T.hoverBg)}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {icon}{label}
    </button>
  )

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/course-id', course.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
      onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative', cursor: 'pointer',
        background: T.surface2, border: `1px solid ${hover ? T.borderStrong : T.border}`,
        borderRadius: R.lg, padding: 18, minHeight: 150,
        display: 'flex', flexDirection: 'column',
        transition: 'border-color var(--dur-fast) var(--ease), transform var(--dur-fast) var(--ease)',
        transform: hover ? 'translateY(-2px)' : 'none',
        boxShadow: hover ? T.shadowMd : 'none',
      }}
    >
      {/* Accent top edge — rounded to match the card so no clipping is needed */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: accent, opacity: hover ? 1 : 0.55,
        borderTopLeftRadius: R.lg, borderTopRightRadius: R.lg,
        transition: 'opacity var(--dur-fast) var(--ease)',
        pointerEvents: 'none',
      }} />

      {/* Header: icon chip + overflow menu */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{
          width: 40, height: 40, borderRadius: R.md,
          background: `color-mix(in srgb, ${accent} 18%, transparent)`,
          color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <BookOpen size={20} />
        </div>

        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o) }}
            style={{
              width: 28, height: 28, borderRadius: R.sm, border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: menuOpen ? T.surface3 : 'transparent', color: T.text3,
              opacity: hover || menuOpen ? 1 : 0,
              transition: 'opacity var(--dur-fast), background var(--dur-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = T.text1)}
            onMouseLeave={(e) => (e.currentTarget.style.color = T.text3)}
          >
            <MoreHorizontal size={16} />
          </button>
          {menuOpen && (
            <div style={{
              position: 'absolute', top: 32, right: 0, zIndex: 200, minWidth: 170,
              background: T.surface1, border: `1px solid ${T.border}`, borderRadius: R.md,
              boxShadow: T.shadowPop, padding: 5,
            }}>
              {menuItem(<Pencil size={14} />, 'Renommer', onRename)}
              {menuItem(<Copy size={14} />, 'Dupliquer', onDuplicate)}
              {/* Accent colour picker */}
              <div style={{ padding: '7px 10px 5px' }}>
                <div style={{ fontSize: 10.5, color: T.text3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 7 }}>
                  Couleur
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {COLOR_ORDER.map((c) => (
                    <button
                      key={c}
                      title={c}
                      onClick={(e) => { e.stopPropagation(); onColorChange(c) }}
                      style={{
                        width: 20, height: 20, borderRadius: '50%', cursor: 'pointer',
                        background: COLOR_HEX[c], border: '2px solid',
                        borderColor: course.color === c ? T.text1 : 'transparent',
                        boxShadow: course.color === c ? `0 0 0 2px ${T.surface1}` : 'none',
                        transform: course.color === c ? 'scale(1.12)' : 'scale(1)',
                        transition: 'transform var(--dur-fast), border-color var(--dur-fast)',
                      }}
                      onMouseEnter={(e) => { if (course.color !== c) (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)' }}
                      onMouseLeave={(e) => { if (course.color !== c) (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
                    />
                  ))}
                </div>
              </div>
              <div style={{ height: 1, background: T.border, margin: '4px 0' }} />
              {menuItem(<Trash2 size={14} />, 'Supprimer', onDelete, true)}
            </div>
          )}
        </div>
      </div>

      {/* Title + description */}
      <div style={{ marginTop: 14, flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: T.text1, marginBottom: 4 }}>
          {course.title}
        </div>
        {course.description && (
          <div style={{
            fontSize: 12.5, color: T.text3, lineHeight: 1.4,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {course.description}
          </div>
        )}
      </div>

      {/* Meta row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 14, fontSize: 12, color: T.text3,
      }}>
        <span>{pageCount} page{pageCount > 1 ? 's' : ''} · {elementCount} élément{elementCount > 1 ? 's' : ''}</span>
        <ChevronRight size={16} style={{ color: hover ? T.text1 : T.text3, transition: 'color var(--dur-fast)' }} />
      </div>
    </div>
  )
}

export default CourseCard
