import React, { memo } from 'react'
import type { ForceVectorElement } from '../../../types/canvas'

interface Props {
  element: ForceVectorElement
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
}

const ForceVectorElementComp: React.FC<Props> = memo(({ element, isSelected, onClick }) => {
  const { x, y, x2, y2, magnitude, unit, label, color, strokeWidth } = element

  const dx = x2 - x
  const dy = y2 - y
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len < 2) return null

  const angle = Math.atan2(dy, dx) * (180 / Math.PI)
  const arrowSize = strokeWidth * 4 + 8

  // Label position: offset perpendicular to the arrow
  const nx = -dy / len
  const ny = dx / len
  const lx = (x + x2) / 2 + nx * (arrowSize + 4)
  const ly = (y + y2) / 2 + ny * (arrowSize + 4)
  const displayLabel = label || (magnitude ? `${magnitude} ${unit || 'N'}` : '')

  const markerId = `fv-arrow-${element.id}`

  return (
    <g onClick={onClick}>
      <defs>
        <marker id={markerId} markerWidth={8} markerHeight={8} refX={6} refY={3} orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L6,3 L0,6 Z" fill={color} />
        </marker>
      </defs>

      {/* Hit area */}
      <line x1={x} y1={y} x2={x2} y2={y2} stroke="transparent" strokeWidth={Math.max(strokeWidth + 12, 14)} />

      {/* Arrow body */}
      <line
        x1={x} y1={y} x2={x2} y2={y2}
        stroke={color}
        strokeWidth={strokeWidth * 1.5}
        markerEnd={`url(#${markerId})`}
      />

      {/* Origin point */}
      <circle cx={x} cy={y} r={strokeWidth * 1.5} fill={color} style={{ pointerEvents: 'none' }} />

      {/* Magnitude arc decoration at origin */}
      <circle cx={x} cy={y} r={strokeWidth + 3} fill="none" stroke={color} strokeWidth={strokeWidth * 0.5} opacity={0.4} style={{ pointerEvents: 'none' }} />

      {/* Label */}
      {displayLabel && (
        <text
          x={lx} y={ly}
          textAnchor="middle" dominantBaseline="central"
          fontSize={Math.max(12, strokeWidth * 4)}
          fill={color}
          fontFamily="serif"
          fontStyle="italic"
          fontWeight="bold"
          style={{ pointerEvents: 'none' }}
        >
          {displayLabel}
        </text>
      )}

      {/* Angle indicator (small arc from horizontal) */}
      {angle !== 0 && len > 40 && (
        <g style={{ pointerEvents: 'none' }} opacity={0.5}>
          <path
            d={`M ${x + 20} ${y} A 20 20 0 0 ${angle > 0 ? 1 : 0} ${x + 20 * Math.cos(angle * Math.PI / 180)} ${y + 20 * Math.sin(angle * Math.PI / 180)}`}
            stroke={color} strokeWidth={strokeWidth * 0.6} fill="none"
          />
          <text x={x + 28} y={y + Math.sign(angle) * 14} fontSize={10} fill={color} fontFamily="serif">
            {Math.abs(Math.round(angle))}°
          </text>
        </g>
      )}

      {/* Selection */}
      {isSelected && (
        <line x1={x} y1={y} x2={x2} y2={y2}
          stroke="#3b82f6" strokeWidth={strokeWidth + 4} strokeDasharray="6 3" style={{ pointerEvents: 'none' }} />
      )}
    </g>
  )
})

ForceVectorElementComp.displayName = 'ForceVectorElementComp'
export default ForceVectorElementComp
