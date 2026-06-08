import React, { memo } from 'react'
import type { ArrowElement } from '../../../types/canvas'
import { getArrowheadPath } from '../../../utils/canvasUtils'

interface Props {
  element: ArrowElement
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
}

const ArrowElementComp = memo(({ element, isSelected, onClick }: Props) => {
  const arrowSize = Math.max(element.strokeWidth * 4, 12)
  const headPath = getArrowheadPath(element.x, element.y, element.x2, element.y2, arrowSize)

  // Shorten the line slightly so it doesn't poke through the arrowhead
  const angle = Math.atan2(element.y2 - element.y, element.x2 - element.x)
  const lineX2 = element.x2 - Math.cos(angle) * arrowSize * 0.7
  const lineY2 = element.y2 - Math.sin(angle) * arrowSize * 0.7

  // Label midpoint
  const mx = (element.x + element.x2) / 2
  const my = (element.y + element.y2) / 2

  return (
    <g onClick={onClick} style={{ cursor: 'move' }}>
      {/* Hit area */}
      <line
        x1={element.x} y1={element.y}
        x2={element.x2} y2={element.y2}
        stroke="transparent"
        strokeWidth={Math.max(element.strokeWidth, 14)}
        strokeLinecap="round"
      />
      {isSelected && (
        <>
          <line
            x1={element.x} y1={element.y}
            x2={lineX2} y2={lineY2}
            stroke="#3b82f6"
            strokeWidth={element.strokeWidth + 4}
            strokeLinecap="round"
            opacity={0.35}
            style={{ pointerEvents: 'none' }}
          />
          <path
            d={headPath}
            stroke="#3b82f6"
            strokeWidth={element.strokeWidth + 4}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.35}
            style={{ pointerEvents: 'none' }}
          />
        </>
      )}
      <line
        x1={element.x} y1={element.y}
        x2={lineX2} y2={lineY2}
        stroke={element.strokeColor}
        strokeWidth={element.strokeWidth}
        strokeLinecap="round"
      />
      <path
        d={headPath}
        stroke={element.strokeColor}
        strokeWidth={element.strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {element.label && (
        <text
          x={mx}
          y={my - 6}
          textAnchor="middle"
          fontSize={12}
          fill={element.strokeColor}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {element.label}
        </text>
      )}
    </g>
  )
})

ArrowElementComp.displayName = 'ArrowElementComp'
export default ArrowElementComp
