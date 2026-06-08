import React, { memo } from 'react'
import type { BondElement } from '../../../types/canvas'

interface Props {
  element: BondElement
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
}

const BondElementComp: React.FC<Props> = memo(({ element, isSelected, onClick }) => {
  const { x, y, x2, y2, bondOrder, strokeColor, strokeWidth } = element

  const dx = x2 - x
  const dy = y2 - y
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len < 2) return null

  // Perpendicular unit vector
  const px = -dy / len
  const py = dx / len
  const offset = strokeWidth * 2.5

  const lines: React.ReactNode[] = []

  if (bondOrder === 1) {
    lines.push(
      <line key="s" x1={x} y1={y} x2={x2} y2={y2}
        stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
    )
  } else if (bondOrder === 2) {
    lines.push(
      <line key="d1"
        x1={x + px * offset / 2} y1={y + py * offset / 2}
        x2={x2 + px * offset / 2} y2={y2 + py * offset / 2}
        stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />,
      <line key="d2"
        x1={x - px * offset / 2} y1={y - py * offset / 2}
        x2={x2 - px * offset / 2} y2={y2 - py * offset / 2}
        stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
    )
  } else if (bondOrder === 3) {
    lines.push(
      <line key="t1" x1={x} y1={y} x2={x2} y2={y2}
        stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />,
      <line key="t2"
        x1={x + px * offset} y1={y + py * offset}
        x2={x2 + px * offset} y2={y2 + py * offset}
        stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />,
      <line key="t3"
        x1={x - px * offset} y1={y - py * offset}
        x2={x2 - px * offset} y2={y2 - py * offset}
        stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
    )
  }

  return (
    <g onClick={onClick}>
      {/* Hit area */}
      <line x1={x} y1={y} x2={x2} y2={y2}
        stroke="transparent" strokeWidth={Math.max(strokeWidth + 14, 16)} />
      {lines}
      {isSelected && (
        <line x1={x} y1={y} x2={x2} y2={y2}
          stroke="#3b82f6" strokeWidth={strokeWidth + 4} strokeDasharray="6 3"
          style={{ pointerEvents: 'none' }} />
      )}
    </g>
  )
})

BondElementComp.displayName = 'BondElementComp'
export default BondElementComp
