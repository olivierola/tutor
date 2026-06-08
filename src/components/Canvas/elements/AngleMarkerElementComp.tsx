import React, { memo } from 'react'
import type { AngleMarkerElement } from '../../../types/canvas'

interface Props {
  element: AngleMarkerElement
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
}

function polarToXY(angleDeg: number, r: number): { x: number; y: number } {
  const a = (angleDeg * Math.PI) / 180
  return { x: Math.cos(a) * r, y: Math.sin(a) * r }
}

const AngleMarkerElementComp: React.FC<Props> = memo(({ element, isSelected, onClick }) => {
  const { x, y, ray1Angle, ray2Angle, radius, color, label, fill } = element

  const sw = 2
  const rayLen = radius * 2.2

  const p1 = polarToXY(ray1Angle, rayLen)
  const p2 = polarToXY(ray2Angle, rayLen)

  // Arc from ray1Angle to ray2Angle
  const startA = ray1Angle
  const endA = ray2Angle
  const diff = ((endA - startA) % 360 + 360) % 360
  const largeArc = diff > 180 ? 1 : 0
  const sweep = 1

  const arc1 = polarToXY(startA, radius)
  const arc2 = polarToXY(endA, radius)

  const arcPath = `M ${arc1.x} ${arc1.y} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${arc2.x} ${arc2.y}`

  // midpoint angle for label
  const midAngle = startA + diff / 2
  const lp = polarToXY(midAngle, radius * 0.65)

  const angleMeasure = Math.round(diff > 180 ? 360 - diff : diff)

  return (
    <g transform={`translate(${x},${y})`} onClick={onClick}>
      {/* Hit area */}
      <circle cx={0} cy={0} r={rayLen + 6} fill="transparent" stroke="transparent" />

      {/* Rays */}
      <line x1={0} y1={0} x2={p1.x} y2={p1.y} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <line x1={0} y1={0} x2={p2.x} y2={p2.y} stroke={color} strokeWidth={sw} strokeLinecap="round" />

      {/* Vertex point */}
      <circle cx={0} cy={0} r={sw + 1} fill={color} style={{ pointerEvents: 'none' }} />

      {/* Arc fill */}
      {fill && (
        <path
          d={`M 0 0 L ${arc1.x} ${arc1.y} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${arc2.x} ${arc2.y} Z`}
          fill={fill} opacity={0.25} style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Arc */}
      <path d={arcPath} fill="none" stroke={color} strokeWidth={sw} style={{ pointerEvents: 'none' }} />

      {/* Label */}
      <text
        x={lp.x} y={lp.y}
        textAnchor="middle" dominantBaseline="central"
        fontSize={Math.max(11, radius * 0.32)}
        fill={color}
        fontFamily="serif"
        fontStyle="italic"
        style={{ pointerEvents: 'none' }}
      >
        {label || `${angleMeasure}°`}
      </text>

      {/* Selection */}
      {isSelected && (
        <circle cx={0} cy={0} r={rayLen + 8}
          fill="none" stroke="#3b82f6" strokeWidth={2} strokeDasharray="6 3"
          style={{ pointerEvents: 'none' }} />
      )}
    </g>
  )
})

AngleMarkerElementComp.displayName = 'AngleMarkerElementComp'
export default AngleMarkerElementComp
