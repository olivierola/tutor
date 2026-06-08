import React, { memo } from 'react'
import type { LineElement } from '../../../types/canvas'

interface Props {
  element: LineElement
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
}

const LineElementComp = memo(({ element, isSelected, onClick }: Props) => {
  const dash = element.dashed ? `${element.strokeWidth * 4} ${element.strokeWidth * 2}` : undefined

  return (
    <g onClick={onClick} style={{ cursor: 'move' }}>
      {/* Fat transparent hit area */}
      <line
        x1={element.x} y1={element.y}
        x2={element.x2} y2={element.y2}
        stroke="transparent"
        strokeWidth={Math.max(element.strokeWidth, 12)}
        strokeLinecap="round"
      />
      {isSelected && (
        <line
          x1={element.x} y1={element.y}
          x2={element.x2} y2={element.y2}
          stroke="#3b82f6"
          strokeWidth={element.strokeWidth + 4}
          strokeLinecap="round"
          opacity={0.35}
          style={{ pointerEvents: 'none' }}
        />
      )}
      <line
        x1={element.x} y1={element.y}
        x2={element.x2} y2={element.y2}
        stroke={element.strokeColor}
        strokeWidth={element.strokeWidth}
        strokeLinecap="round"
        strokeDasharray={dash}
      />
    </g>
  )
})

LineElementComp.displayName = 'LineElementComp'
export default LineElementComp
