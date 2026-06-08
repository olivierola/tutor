import React, { memo, useState } from 'react'
import type { TableElement } from '../../../types/canvas'
import { useCanvasStore } from '../../../store/canvasStore'

interface Props {
  element: TableElement
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
}

const TableElementComp: React.FC<Props> = memo(({ element, isSelected, onClick }) => {
  const { x, y, rows, colWidths, rowHeight, headerFill, accent, fontSize, hasHeader, zebra } = element
  const updateElement = useCanvasStore(s => s.updateElement)
  const pushHistory = useCanvasStore(s => s.pushHistory)
  const [edit, setEdit] = useState<{ r: number; c: number } | null>(null)

  const totalW = colWidths.reduce((a, b) => a + b, 0)
  const totalH = rows.length * rowHeight

  const colX = (c: number) => colWidths.slice(0, c).reduce((a, b) => a + b, 0)

  const setCell = (r: number, c: number, v: string) => {
    const next = rows.map(row => [...row])
    if (next[r]) next[r][c] = v
    updateElement(element.id, { rows: next })
  }

  return (
    <g transform={`translate(${x},${y})`} onClick={onClick} style={{ cursor: 'pointer' }}>
      <rect x={0} y={0} width={totalW} height={totalH} rx={6} fill="var(--surface-0)"
        stroke="var(--border)" strokeWidth={1} />

      {rows.map((row, r) => {
        const isHeader = hasHeader && r === 0
        const rowFill = isHeader ? headerFill : (zebra && r % 2 === 0 ? 'var(--surface-1)' : 'transparent')
        return (
          <g key={r}>
            {rowFill !== 'transparent' && (
              <rect x={0} y={r * rowHeight} width={totalW} height={rowHeight}
                fill={rowFill} style={{ pointerEvents: 'none' }} />
            )}
            {row.map((cell, c) => {
              const cx = colX(c)
              const editing = edit?.r === r && edit?.c === c
              return (
                <foreignObject key={c} x={cx} y={r * rowHeight} width={colWidths[c]} height={rowHeight}>
                  <div
                    // @ts-expect-error xmlns
                    xmlns="http://www.w3.org/1999/xhtml"
                    onDoubleClick={(e) => { e.stopPropagation(); pushHistory(); setEdit({ r, c }) }}
                    style={{
                      width: '100%', height: '100%', boxSizing: 'border-box', padding: '0 8px',
                      display: 'flex', alignItems: 'center',
                      font: `${isHeader ? 600 : 400} ${fontSize}px system-ui`,
                      color: isHeader ? accent : 'var(--text-1)',
                      pointerEvents: editing ? 'auto' : 'none', overflow: 'hidden',
                    }}
                  >
                    {editing ? (
                      <input autoFocus defaultValue={cell}
                        onBlur={(ev) => { setCell(r, c, ev.target.value); setEdit(null) }}
                        onKeyDown={(ev) => { if (ev.key === 'Enter') (ev.target as HTMLInputElement).blur() }}
                        style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', font: 'inherit', color: 'inherit' }} />
                    ) : (
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cell}</span>
                    )}
                  </div>
                </foreignObject>
              )
            })}
          </g>
        )
      })}

      {/* grid lines */}
      {rows.map((_, r) => r > 0 && (
        <line key={`h${r}`} x1={0} y1={r * rowHeight} x2={totalW} y2={r * rowHeight}
          stroke="var(--border)" strokeWidth={0.75} style={{ pointerEvents: 'none' }} />
      ))}
      {colWidths.map((_, c) => c > 0 && (
        <line key={`v${c}`} x1={colX(c)} y1={0} x2={colX(c)} y2={totalH}
          stroke="var(--border)" strokeWidth={0.75} style={{ pointerEvents: 'none' }} />
      ))}

      {isSelected && (
        <rect x={-3} y={-3} width={totalW + 6} height={totalH + 6} rx={8} fill="none"
          stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 3" style={{ pointerEvents: 'none' }} />
      )}
    </g>
  )
})

TableElementComp.displayName = 'TableElementComp'
export default TableElementComp
