import React, { memo } from 'react'
import type { VectorElement } from '../../../types/canvas'
interface Props {
  element: VectorElement
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
}

const VectorElementComp = memo(({ element, isSelected, onClick }: Props) => {
  const arrowSize = 14

  const angle = Math.atan2(element.y2 - element.y, element.x2 - element.x)
  const lineX2 = element.x2 - Math.cos(angle) * arrowSize * 0.7
  const lineY2 = element.y2 - Math.sin(angle) * arrowSize * 0.7

  const mx = (element.x + element.x2) / 2
  const my = (element.y + element.y2) / 2
  const perpAngle = angle + Math.PI / 2
  const labelX = mx + Math.cos(perpAngle) * 14
  const labelY = my + Math.sin(perpAngle) * 14

  return (
    <g onClick={onClick} style={{ cursor: 'move' }}>
      {/* Hit area */}
      <line
        x1={element.x} y1={element.y}
        x2={element.x2} y2={element.y2}
        stroke="transparent"
        strokeWidth={16}
        strokeLinecap="round"
      />
      {isSelected && (
        <>
          <line
            x1={element.x} y1={element.y}
            x2={lineX2} y2={lineY2}
            stroke="#3b82f6"
            strokeWidth={6}
            strokeLinecap="round"
            opacity={0.35}
            style={{ pointerEvents: 'none' }}
          />
        </>
      )}
      {/* Vector shaft */}
      <line
        x1={element.x} y1={element.y}
        x2={lineX2} y2={lineY2}
        stroke={element.color}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      {/* Filled arrowhead */}
      <path
        d={`M ${element.x2} ${element.y2} L ${element.x2 - Math.cos(angle - Math.PI/6)*arrowSize} ${element.y2 - Math.sin(angle - Math.PI/6)*arrowSize} L ${element.x2 - Math.cos(angle + Math.PI/6)*arrowSize} ${element.y2 - Math.sin(angle + Math.PI/6)*arrowSize} Z`}
        fill={element.color}
        stroke="none"
      />
      {/* Origin dot */}
      <circle cx={element.x} cy={element.y} r={3} fill={element.color} />
      {/* Label */}
      {element.label && (
        <text
          x={labelX}
          y={labelY}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={13}
          fontWeight="600"
          fill={element.color}
          style={{ userSelect: 'none', pointerEvents: 'none' }}
        >
          {element.label}
        </text>
      )}
      {/* Magnitude label */}
      {element.magnitude !== undefined && (
        <text
          x={mx}
          y={my - 18}
          textAnchor="middle"
          fontSize={11}
          fill={element.color}
          opacity={0.8}
          style={{ userSelect: 'none', pointerEvents: 'none' }}
        >
          |v| = {element.magnitude.toFixed(2)}
        </text>
      )}
    </g>
  )
})

VectorElementComp.displayName = 'VectorElementComp'
export default VectorElementComp
