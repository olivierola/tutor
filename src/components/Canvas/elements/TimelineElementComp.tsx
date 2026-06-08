import React, { memo, useState } from 'react'
import type { TimelineElement } from '../../../types/canvas'
import { useCanvasStore } from '../../../store/canvasStore'

interface Props {
  element: TimelineElement
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
}

const TimelineElementComp: React.FC<Props> = memo(({ element, isSelected, onClick }) => {
  const { x, y, steps, orientation, accent, textColor, numbered, length } = element
  const updateElement = useCanvasStore(s => s.updateElement)
  const pushHistory = useCanvasStore(s => s.pushHistory)
  const [edit, setEdit] = useState<number | null>(null)

  const n = Math.max(1, steps.length)
  const horizontal = orientation === 'horizontal'
  const gap = length / n
  const r = 13

  const setLabel = (i: number, v: string) => {
    const next = steps.map((s, j) => j === i ? { ...s, label: v } : s)
    updateElement(element.id, { steps: next })
  }

  const bbW = horizontal ? length + 40 : 220
  const bbH = horizontal ? 90 : n * 60 + 20

  return (
    <g transform={`translate(${x},${y})`} onClick={onClick} style={{ cursor: 'pointer' }}>
      {/* main axis */}
      {horizontal ? (
        <line x1={r} y1={0} x2={length - gap + r} y2={0} stroke={accent} strokeWidth={3} strokeLinecap="round" style={{ pointerEvents: 'none' }} />
      ) : (
        <line x1={0} y1={r} x2={0} y2={(n - 1) * 60 + r} stroke={accent} strokeWidth={3} strokeLinecap="round" style={{ pointerEvents: 'none' }} />
      )}

      {steps.map((s, i) => {
        const cx = horizontal ? i * gap + r : 0
        const cy = horizontal ? 0 : i * 60 + r
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r={r} fill="var(--surface-0)" stroke={accent} strokeWidth={3} style={{ pointerEvents: 'none' }} />
            {numbered && (
              <text x={cx} y={cy} dominantBaseline="central" textAnchor="middle" fontSize={12} fontWeight={700} fill={accent} style={{ pointerEvents: 'none' }}>
                {i + 1}
              </text>
            )}
            <foreignObject
              x={horizontal ? cx - gap / 2 + 4 : cx + 22}
              y={horizontal ? cy + 18 : cy - 16}
              width={horizontal ? gap - 8 : 180}
              height={horizontal ? 56 : 34}
              style={{ overflow: 'visible' }}
            >
              <div
                // @ts-expect-error xmlns
                xmlns="http://www.w3.org/1999/xhtml"
                onDoubleClick={(e) => { e.stopPropagation(); pushHistory(); setEdit(i) }}
                style={{ font: '600 12px system-ui', color: textColor, textAlign: horizontal ? 'center' : 'left', pointerEvents: edit === i ? 'auto' : 'none', lineHeight: 1.25 }}
              >
                {edit === i ? (
                  <input autoFocus defaultValue={s.label}
                    onBlur={(ev) => { setLabel(i, ev.target.value); setEdit(null) }}
                    onKeyDown={(ev) => { if (ev.key === 'Enter') (ev.target as HTMLInputElement).blur() }}
                    style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', font: 'inherit', color: 'inherit', textAlign: 'inherit' }} />
                ) : (
                  <>
                    <div>{s.label}</div>
                    {s.detail ? <div style={{ fontWeight: 400, fontSize: 11, opacity: 0.7 }}>{s.detail}</div> : null}
                  </>
                )}
              </div>
            </foreignObject>
          </g>
        )
      })}

      {isSelected && (
        <rect x={horizontal ? -10 : -16} y={horizontal ? -20 : -10} width={bbW} height={bbH} rx={8}
          fill="none" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 3" style={{ pointerEvents: 'none' }} />
      )}
    </g>
  )
})

TimelineElementComp.displayName = 'TimelineElementComp'
export default TimelineElementComp
