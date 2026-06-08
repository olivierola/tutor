import React, { memo } from 'react'
import type { PenElement } from '../../../types/canvas'
import { getSvgPathFromPoints } from '../../../utils/canvasUtils'

interface Props {
  element: PenElement
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
}

const PenElementComp = memo(({ element, isSelected, onClick }: Props) => {
  const d = getSvgPathFromPoints(element.points)
  if (!d) return null

  return (
    <g
      onClick={onClick}
      style={{ cursor: 'move' }}
    >
      {/* Hit area (transparent thick stroke for easier clicking) */}
      <path
        d={d}
        fill="none"
        stroke="transparent"
        strokeWidth={Math.max(element.strokeWidth, 12)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Visible stroke */}
      <path
        d={d}
        fill="none"
        stroke={element.strokeColor}
        strokeWidth={element.strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={element.opacity}
      />
      {isSelected && (
        <path
          d={d}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={element.strokeWidth + 3}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.4}
          style={{ pointerEvents: 'none' }}
        />
      )}
    </g>
  )
})

PenElementComp.displayName = 'PenElementComp'
export default PenElementComp
