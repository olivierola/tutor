import React, { memo } from 'react'
import type { CircleElement } from '../../../types/canvas'

interface Props {
  element: CircleElement
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
}

const CircleElementComp = memo(({ element, isSelected, onClick }: Props) => {
  return (
    <g onClick={onClick} style={{ cursor: 'move' }}>
      {isSelected && (
        <ellipse
          cx={element.x} cy={element.y}
          rx={element.rx + 4} ry={element.ry + 4}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={2}
          strokeDasharray="5 3"
          opacity={0.7}
          style={{ pointerEvents: 'none' }}
        />
      )}
      <ellipse
        cx={element.x} cy={element.y}
        rx={element.rx} ry={element.ry}
        fill={element.fill}
        stroke={element.strokeColor}
        strokeWidth={element.strokeWidth}
      />
    </g>
  )
})

CircleElementComp.displayName = 'CircleElementComp'
export default CircleElementComp
