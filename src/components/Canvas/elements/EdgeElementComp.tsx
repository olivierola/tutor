import React, { memo, useState } from 'react'
import type { EdgeElement, CanvasElement } from '../../../types/canvas'
import { useCanvasStore } from '../../../store/canvasStore'

interface Props {
  element: EdgeElement
  elements: CanvasElement[]
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
}

function nodeCenter(el: CanvasElement): { x: number; y: number; w: number; h: number } {
  const anyEl = el as unknown as { x: number; y: number; width?: number; height?: number }
  const w = anyEl.width ?? 0
  const h = anyEl.height ?? 0
  return { x: anyEl.x + w / 2, y: anyEl.y + h / 2, w, h }
}

/** Clip a point on the box border along the direction to the target. */
function clipToBox(c: { x: number; y: number; w: number; h: number }, tx: number, ty: number) {
  if (c.w === 0 || c.h === 0) return { x: c.x, y: c.y }
  const dx = tx - c.x, dy = ty - c.y
  if (dx === 0 && dy === 0) return { x: c.x, y: c.y }
  const hw = c.w / 2, hh = c.h / 2
  const scale = 1 / Math.max(Math.abs(dx) / hw, Math.abs(dy) / hh)
  return { x: c.x + dx * scale, y: c.y + dy * scale }
}

const EdgeElementComp: React.FC<Props> = memo(({ element, elements, isSelected, onClick }) => {
  const { x, y, x2, y2, fromId, toId, label, color, strokeWidth, arrow, lineStyle, routing } = element
  const updateElement = useCanvasStore(s => s.updateElement)
  const pushHistory = useCanvasStore(s => s.pushHistory)
  const [editing, setEditing] = useState(false)

  const fromEl = fromId ? elements.find(e => e.id === fromId) : undefined
  const toEl = toId ? elements.find(e => e.id === toId) : undefined

  let from = { x, y }
  let to = { x: x2, y: y2 }
  if (fromEl) {
    const c = nodeCenter(fromEl)
    from = clipToBox(c, toEl ? nodeCenter(toEl).x : x2, toEl ? nodeCenter(toEl).y : y2)
  }
  if (toEl) {
    const c = nodeCenter(toEl)
    to = clipToBox(c, fromEl ? nodeCenter(fromEl).x : x, fromEl ? nodeCenter(fromEl).y : y)
  }

  const markerId = `edge-arrow-${element.id}`
  const dash = lineStyle === 'dashed' ? `${strokeWidth * 4} ${strokeWidth * 3}`
    : lineStyle === 'dotted' ? `${strokeWidth} ${strokeWidth * 2}` : undefined

  // Path by routing
  let d: string
  if (routing === 'orthogonal') {
    const midX = (from.x + to.x) / 2
    d = `M ${from.x} ${from.y} L ${midX} ${from.y} L ${midX} ${to.y} L ${to.x} ${to.y}`
  } else if (routing === 'curved') {
    const dx = (to.x - from.x) * 0.4
    d = `M ${from.x} ${from.y} C ${from.x + dx} ${from.y}, ${to.x - dx} ${to.y}, ${to.x} ${to.y}`
  } else {
    d = `M ${from.x} ${from.y} L ${to.x} ${to.y}`
  }

  const mx = (from.x + to.x) / 2
  const my = (from.y + to.y) / 2

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      <defs>
        <marker id={markerId} markerWidth={10} markerHeight={10} refX={8} refY={3} orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L8,3 L0,6 Z" fill={color} />
        </marker>
      </defs>

      {/* hit area */}
      <path d={d} stroke="transparent" strokeWidth={Math.max(strokeWidth + 14, 18)} fill="none" />

      <path
        d={d} stroke={color} strokeWidth={strokeWidth} fill="none"
        strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash}
        markerEnd={arrow === 'end' || arrow === 'both' ? `url(#${markerId})` : undefined}
        markerStart={arrow === 'both' ? `url(#${markerId})` : undefined}
      />

      {/* editable label */}
      {(label || editing) && (
        <foreignObject x={mx - 60} y={my - 14} width={120} height={28} style={{ overflow: 'visible' }}>
          <div
            // @ts-expect-error xmlns
            xmlns="http://www.w3.org/1999/xhtml"
            onDoubleClick={(e) => { e.stopPropagation(); pushHistory(); setEditing(true) }}
            style={{ display: 'flex', justifyContent: 'center', pointerEvents: editing ? 'auto' : 'none' }}
          >
            {editing ? (
              <input autoFocus defaultValue={label}
                onBlur={(ev) => { updateElement(element.id, { label: ev.target.value }); setEditing(false) }}
                onKeyDown={(ev) => { if (ev.key === 'Enter') (ev.target as HTMLInputElement).blur() }}
                style={{ font: '12px system-ui', textAlign: 'center', border: `1px solid ${color}`, borderRadius: 4, padding: '1px 4px', background: 'var(--surface-0)', color: 'var(--text-1)', width: 110 }} />
            ) : (
              <span style={{ font: '12px system-ui', color: 'var(--text-1)', background: 'var(--surface-0)', padding: '1px 5px', borderRadius: 4, whiteSpace: 'nowrap' }}>
                {label}
              </span>
            )}
          </div>
        </foreignObject>
      )}

      {isSelected && (
        <>
          <path d={d} stroke="#3b82f6" strokeWidth={strokeWidth + 4} fill="none" strokeDasharray="6 3" style={{ pointerEvents: 'none' }} opacity={0.6} />
          <circle cx={from.x} cy={from.y} r={5} fill="#3b82f6" style={{ pointerEvents: 'none' }} />
          <circle cx={to.x} cy={to.y} r={5} fill="#3b82f6" style={{ pointerEvents: 'none' }} />
        </>
      )}
    </g>
  )
})

EdgeElementComp.displayName = 'EdgeElementComp'
export default EdgeElementComp
