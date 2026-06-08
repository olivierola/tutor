import React, { memo, useState } from 'react'
import { BookOpen, FlaskConical, Star, Wrench, Target, StickyNote } from 'lucide-react'
import type { CourseCardElement, CourseCardKind } from '../../../types/canvas'
import { useCanvasStore } from '../../../store/canvasStore'
import { renderMd } from '../../../utils/markdown'

interface Props {
  element: CourseCardElement
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
}

const KIND: Record<CourseCardKind, { color: string; icon: React.ReactNode; label: string }> = {
  definition: { color: '#06b6d4', icon: <BookOpen size={15} />,     label: 'Définition' },
  example:    { color: '#ec4899', icon: <FlaskConical size={15} />, label: 'Exemple' },
  remember:   { color: '#f59e0b', icon: <Star size={15} />,        label: 'À retenir' },
  method:     { color: '#8b5cf6', icon: <Wrench size={15} />,      label: 'Méthode' },
  objective:  { color: '#22c55e', icon: <Target size={15} />,      label: 'Objectif' },
  note:       { color: '#64748b', icon: <StickyNote size={15} />,  label: 'Note' },
}

const CourseCardElementComp: React.FC<Props> = memo(({ element, isSelected, onClick }) => {
  const { x, y, width, kind, title, body, accent } = element
  const updateElement = useCanvasStore(s => s.updateElement)
  const pushHistory = useCanvasStore(s => s.pushHistory)
  const [editing, setEditing] = useState(false)
  const k = KIND[kind] ?? KIND.note
  const color = accent || k.color

  const charsPerLine = Math.max(14, Math.floor((width - 36) / 7))
  const bodyLines = body.split('\n').reduce((a, l) => a + Math.max(1, Math.ceil(l.length / charsPerLine)), 0)
  const height = 46 + bodyLines * 20 + 16

  return (
    <g transform={`translate(${x},${y})`} onClick={onClick}
       onDoubleClick={(e) => { e.stopPropagation(); if (!editing) { pushHistory(); setEditing(true) } }}
       style={{ cursor: 'pointer' }}>
      {/* card */}
      <rect x={0} y={0} width={width} height={height} rx={12} fill="var(--surface-1)"
        stroke={isSelected ? '#3b82f6' : 'var(--border)'} strokeWidth={isSelected ? 2 : 1} />
      {/* accent header band */}
      <path d={`M 0 12 Q 0 0 12 0 L ${width - 12} 0 Q ${width} 0 ${width} 12 L ${width} 36 L 0 36 Z`}
        fill={`color-mix(in srgb, ${color} 12%, transparent)`} style={{ pointerEvents: 'none' }} />
      <rect x={0} y={0} width={4} height={height} fill={color} style={{ pointerEvents: 'none' }} />

      <foreignObject x={4} y={0} width={width - 4} height={height} style={{ overflow: 'visible' }}>
        <div
          // @ts-expect-error xmlns
          xmlns="http://www.w3.org/1999/xhtml"
          style={{ width: '100%', boxSizing: 'border-box', padding: '9px 14px', fontFamily: 'var(--font-sans)', pointerEvents: editing ? 'auto' : 'none' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, color, fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
            {k.icon}
            {editing
              ? <input autoFocus defaultValue={title}
                  onBlur={(ev) => updateElement(element.id, { title: ev.target.value })}
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', font: 'inherit', color }} />
              : <span>{title || k.label}</span>}
          </div>
          {editing ? (
            <textarea defaultValue={body}
              onBlur={(ev) => { updateElement(element.id, { body: ev.target.value }); setEditing(false) }}
              style={{ width: '100%', minHeight: 50, resize: 'vertical', border: '1px solid var(--border)', borderRadius: 6, outline: 'none', background: 'var(--surface-0)', font: '13px var(--font-sans)', color: 'var(--text-1)', padding: 6, boxSizing: 'border-box' }} />
          ) : (
            <div style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: renderMd(body) }} />
          )}
        </div>
      </foreignObject>
    </g>
  )
})

CourseCardElementComp.displayName = 'CourseCardElementComp'
export default CourseCardElementComp
