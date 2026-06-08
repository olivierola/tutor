import React, { memo, useState } from 'react'
import type { PacketElement } from '../../../types/canvas'
import { useCanvasStore } from '../../../store/canvasStore'

interface Props {
  element: PacketElement
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
}

/** A network frame / packet drawn as labelled fields side by side. */
const PacketElementComp: React.FC<Props> = memo(({ element, isSelected, onClick }) => {
  const { x, y, title, fields, width, height, accent, textColor } = element
  const updateElement = useCanvasStore(s => s.updateElement)
  const pushHistory = useCanvasStore(s => s.pushHistory)
  const [edit, setEdit] = useState<number | null>(null)

  const titleH = title ? 22 : 0
  const totalBits = fields.reduce((a, f) => a + (f.bits ?? 1), 0) || 1

  let cursor = 0
  const segments = fields.map((f, i) => {
    const w = (width * (f.bits ?? 1)) / totalBits
    const seg = { ...f, i, x: cursor, w }
    cursor += w
    return seg
  })

  const setField = (i: number, label: string) => {
    const next = fields.map((f, j) => j === i ? { ...f, label } : f)
    updateElement(element.id, { fields: next })
  }

  return (
    <g transform={`translate(${x},${y})`} onClick={onClick} style={{ cursor: 'pointer' }}>
      {title && (
        <text x={0} y={-6} fontSize={12} fontWeight={700} fill={accent} fontFamily="system-ui" style={{ pointerEvents: 'none' }}>
          {title}
        </text>
      )}
      {segments.map(seg => (
        <g key={seg.i}>
          <rect x={seg.x} y={titleH} width={seg.w} height={height} fill={seg.color ?? 'var(--surface-1)'}
            stroke={accent} strokeWidth={1.25} style={{ pointerEvents: 'none' }} />
          <foreignObject x={seg.x} y={titleH} width={seg.w} height={height}>
            <div
              // @ts-expect-error xmlns
              xmlns="http://www.w3.org/1999/xhtml"
              onDoubleClick={(e) => { e.stopPropagation(); pushHistory(); setEdit(seg.i) }}
              style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', font: '600 11px system-ui', color: textColor, padding: '0 4px', boxSizing: 'border-box', pointerEvents: edit === seg.i ? 'auto' : 'none', overflow: 'hidden' }}
            >
              {edit === seg.i ? (
                <input autoFocus defaultValue={seg.label}
                  onBlur={(ev) => { setField(seg.i, ev.target.value); setEdit(null) }}
                  onKeyDown={(ev) => { if (ev.key === 'Enter') (ev.target as HTMLInputElement).blur() }}
                  style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', font: 'inherit', color: 'inherit', textAlign: 'center' }} />
              ) : (
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{seg.label}</span>
              )}
            </div>
          </foreignObject>
        </g>
      ))}

      {isSelected && (
        <rect x={-3} y={titleH - 3} width={width + 6} height={height + 6} rx={4} fill="none"
          stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 3" style={{ pointerEvents: 'none' }} />
      )}
    </g>
  )
})

PacketElementComp.displayName = 'PacketElementComp'
export default PacketElementComp
