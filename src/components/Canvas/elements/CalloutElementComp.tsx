import React, { memo, useState } from 'react'
import { Info, AlertTriangle, Lightbulb, ShieldAlert, CheckCircle2, BookOpen, FlaskConical } from 'lucide-react'
import type { CalloutElement, CalloutKind } from '../../../types/canvas'
import { useCanvasStore } from '../../../store/canvasStore'
import { renderMd } from '../../../utils/markdown'

interface Props {
  element: CalloutElement
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
}

const KIND: Record<CalloutKind, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  info:       { color: '#3b82f6', bg: 'rgba(59,130,246,0.10)',  icon: <Info size={16} />,         label: 'Info' },
  warning:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)',  icon: <AlertTriangle size={16} />, label: 'Attention' },
  tip:        { color: '#22c55e', bg: 'rgba(34,197,94,0.10)',   icon: <Lightbulb size={16} />,    label: 'Astuce' },
  danger:     { color: '#ef4444', bg: 'rgba(239,68,68,0.10)',   icon: <ShieldAlert size={16} />,  label: 'Danger' },
  success:    { color: '#10b981', bg: 'rgba(16,185,129,0.10)',  icon: <CheckCircle2 size={16} />, label: 'Réussi' },
  step:       { color: '#8b5cf6', bg: 'rgba(139,92,246,0.10)',  icon: null,                       label: 'Étape' },
  definition: { color: '#06b6d4', bg: 'rgba(6,182,212,0.10)',   icon: <BookOpen size={16} />,     label: 'Définition' },
  example:    { color: '#ec4899', bg: 'rgba(236,72,153,0.10)',  icon: <FlaskConical size={16} />, label: 'Exemple' },
}

const CalloutElementComp: React.FC<Props> = memo(({ element, isSelected, onClick }) => {
  const { x, y, width, kind, title, body, step } = element
  const updateElement = useCanvasStore(s => s.updateElement)
  const pushHistory = useCanvasStore(s => s.pushHistory)
  const [editing, setEditing] = useState(false)
  const k = KIND[kind]

  // estimate height from body
  const charsPerLine = Math.max(10, Math.floor((width - 56) / 7))
  const bodyLines = body.split('\n').reduce((acc, l) => acc + Math.max(1, Math.ceil(l.length / charsPerLine)), 0)
  const height = 40 + bodyLines * 19 + 14

  return (
    <g transform={`translate(${x},${y})`} onClick={onClick}
      onDoubleClick={(e) => { e.stopPropagation(); if (!editing) { pushHistory(); setEditing(true) } }}
      style={{ cursor: 'pointer' }}>
      <rect x={0} y={0} width={width} height={height} rx={10} fill={k.bg}
        stroke={isSelected ? '#3b82f6' : k.color} strokeWidth={isSelected ? 2 : 1.25} />
      <rect x={0} y={0} width={4} height={height} rx={2} fill={k.color} style={{ pointerEvents: 'none' }} />

      <foreignObject x={4} y={0} width={width - 4} height={height} style={{ overflow: 'visible' }}>
        <div
          // @ts-expect-error xmlns
          xmlns="http://www.w3.org/1999/xhtml"
          style={{ width: '100%', height: '100%', boxSizing: 'border-box', padding: '12px 14px', fontFamily: 'system-ui', pointerEvents: editing ? 'auto' : 'none' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, color: k.color, fontWeight: 700, fontSize: 13 }}>
            {kind === 'step' ? (
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: k.color, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>
                {step ?? 1}
              </span>
            ) : k.icon}
            {editing ? (
              <input autoFocus defaultValue={title}
                onBlur={(ev) => updateElement(element.id, { title: ev.target.value })}
                style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', font: 'inherit', color: k.color }} />
            ) : <span>{title || k.label}</span>}
          </div>
          {editing ? (
            <textarea defaultValue={body}
              onBlur={(ev) => { updateElement(element.id, { body: ev.target.value }); setEditing(false) }}
              style={{ width: '100%', minHeight: 40, resize: 'none', border: '1px solid var(--border)', borderRadius: 6, outline: 'none', background: 'var(--surface-0)', font: '13px system-ui', color: 'var(--text-1)', padding: 6, boxSizing: 'border-box' }} />
          ) : (
            <div style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.45 }} dangerouslySetInnerHTML={{ __html: renderMd(body) }} />
          )}
        </div>
      </foreignObject>
    </g>
  )
})

CalloutElementComp.displayName = 'CalloutElementComp'
export default CalloutElementComp
