import React, { memo, useState, useEffect } from 'react'
import type { StickyNoteElement, StickyColor } from '../../../types/canvas'
import { useCanvasStore } from '../../../store/canvasStore'

interface Props {
  element: StickyNoteElement
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
}

// Paper colours (fill, slightly darker edge, ink).
const PALETTE: Record<StickyColor, { fill: string; edge: string; ink: string }> = {
  yellow: { fill: '#fef9c3', edge: '#fde68a', ink: '#713f12' },
  pink:   { fill: '#fce7f3', edge: '#fbcfe8', ink: '#831843' },
  blue:   { fill: '#dbeafe', edge: '#bfdbfe', ink: '#1e3a8a' },
  green:  { fill: '#dcfce7', edge: '#bbf7d0', ink: '#14532d' },
  orange: { fill: '#ffedd5', edge: '#fed7aa', ink: '#7c2d12' },
  purple: { fill: '#ede9fe', edge: '#ddd6fe', ink: '#4c1d95' },
}

const StickyNoteElementComp: React.FC<Props> = memo(({ element, isSelected, onClick }) => {
  const { x, y, width, text, color, fontSize, tilt } = element
  const updateElement = useCanvasStore(s => s.updateElement)
  const pushHistory = useCanvasStore(s => s.pushHistory)
  const [editing, setEditing] = useState(false)
  const c = PALETTE[color] ?? PALETTE.yellow

  // Auto-size the note to its content: estimate the wrapped line count
  // from the text length and the note width, then derive a height.
  // Stays at least square so short notes keep the classic look.
  const pad = 14
  const lineH = (fontSize + 4) * 1.25
  const charW = (fontSize + 4) * 0.5          // rough advance for Caveat
  const charsPerLine = Math.max(6, Math.floor((width - pad * 2) / charW))
  const lineCount = (text || ' ').split('\n').reduce(
    (n, ln) => n + Math.max(1, Math.ceil(ln.length / charsPerLine)), 0,
  )
  const contentH = pad * 2 + lineCount * lineH
  const height = Math.max(width, Math.round(contentH))   // ≥ square

  // Persist the auto-height once if the stored value is stale (e.g. an
  // AI-created note with default 160 but long text). Keeps the selection
  // box, resize handle and collision layout in sync with what's drawn.
  useEffect(() => {
    if (Math.abs((element.height ?? 0) - height) > 2) {
      updateElement(element.id, { height })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height])

  return (
    <g
      transform={`translate(${x},${y}) rotate(${tilt}, ${width / 2}, ${height / 2})`}
      onClick={onClick}
      onDoubleClick={(e) => { e.stopPropagation(); if (!editing) { pushHistory(); setEditing(true) } }}
      style={{ cursor: 'pointer' }}
    >
      {/* drop shadow */}
      <rect x={3} y={5} width={width} height={height} rx={2} fill="rgba(0,0,0,0.18)" style={{ filter: 'blur(3px)', pointerEvents: 'none' }} />
      {/* paper */}
      <rect x={0} y={0} width={width} height={height} fill={c.fill} stroke={isSelected ? '#3b82f6' : c.edge} strokeWidth={isSelected ? 2 : 1} />
      {/* folded corner */}
      <path d={`M ${width - 16} ${height} L ${width} ${height - 16} L ${width} ${height} Z`} fill={c.edge} style={{ pointerEvents: 'none' }} />
      {/* tape strip on top */}
      <rect x={width / 2 - 22} y={-7} width={44} height={14} rx={1} fill="rgba(255,255,255,0.5)" stroke="rgba(0,0,0,0.06)" style={{ pointerEvents: 'none' }} />

      <foreignObject x={0} y={0} width={width} height={height} style={{ overflow: 'hidden' }}>
        <div
          // @ts-expect-error xmlns
          xmlns="http://www.w3.org/1999/xhtml"
          style={{
            width: '100%', height: '100%', boxSizing: 'border-box', padding: 14,
            fontFamily: "'Caveat', cursive", color: c.ink, fontSize: fontSize + 4,
            lineHeight: 1.25, pointerEvents: editing ? 'auto' : 'none',
            display: 'flex', alignItems: 'flex-start',
          }}
        >
          {editing ? (
            <textarea
              autoFocus defaultValue={text}
              onBlur={(ev) => {
                const t = ev.target.value
                // recompute the stored height so selection/handles match
                const lc = (t || ' ').split('\n').reduce((n, ln) => n + Math.max(1, Math.ceil(ln.length / charsPerLine)), 0)
                const h = Math.max(width, Math.round(pad * 2 + lc * lineH))
                updateElement(element.id, { text: t, height: h })
                setEditing(false)
              }}
              style={{ width: '100%', height: '100%', resize: 'none', border: 'none', outline: 'none', background: 'transparent', font: 'inherit', color: c.ink }}
            />
          ) : (
            <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{text}</div>
          )}
        </div>
      </foreignObject>
    </g>
  )
})

StickyNoteElementComp.displayName = 'StickyNoteElementComp'
export default StickyNoteElementComp
