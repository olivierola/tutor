import React, { memo } from 'react'
import type { BenzeneRingElement } from '../../../types/canvas'

interface Props {
  element: BenzeneRingElement
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
}

const BenzeneRingElementComp: React.FC<Props> = memo(({ element, isSelected, onClick }) => {
  const { x, y, radius, strokeColor, strokeWidth, fill, aromatic } = element

  // 6 vertices of the regular hexagon (flat-top orientation)
  const vertices: [number, number][] = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 6) + (i * Math.PI) / 3   // 30° offset for flat-top
    return [Math.cos(a) * radius, Math.sin(a) * radius]
  })

  const hexPath = vertices.map((v, i) => `${i === 0 ? 'M' : 'L'} ${v[0]} ${v[1]}`).join(' ') + ' Z'

  // Alternating double bonds for Kekulé structure
  // Bond pairs: (0,1), (2,3), (4,5) are double bonds
  const doubleBondOffset = strokeWidth * 2.2
  const innerRadius = radius - doubleBondOffset

  const innerVertices: [number, number][] = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 6) + (i * Math.PI) / 3
    return [Math.cos(a) * innerRadius, Math.sin(a) * innerRadius]
  })

  return (
    <g transform={`translate(${x},${y})`} onClick={onClick}>
      {/* Hit area */}
      <circle cx={0} cy={0} r={radius + 6} fill="transparent" stroke="transparent" />

      {/* Hexagon */}
      <path d={hexPath} fill={fill} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinejoin="round" />

      {/* Aromaticity: inner circle or alternating double bonds */}
      {aromatic ? (
        <circle cx={0} cy={0} r={radius * 0.58}
          fill="none" stroke={strokeColor} strokeWidth={strokeWidth * 0.85}
          style={{ pointerEvents: 'none' }} />
      ) : (
        // Kekulé: inner partial bonds for double bonds at positions (0-1), (2-3), (4-5)
        <g style={{ pointerEvents: 'none' }}>
          {[[0, 1], [2, 3], [4, 5]].map(([a, b]) => (
            <line key={`db${a}`}
              x1={innerVertices[a][0]} y1={innerVertices[a][1]}
              x2={innerVertices[b][0]} y2={innerVertices[b][1]}
              stroke={strokeColor} strokeWidth={strokeWidth * 0.8} strokeLinecap="round"
            />
          ))}
        </g>
      )}

      {/* C labels at vertices (optional - small text) */}
      {vertices.map(([vx, vy], i) => (
        <text key={`c${i}`}
          x={vx * 1.18} y={vy * 1.18}
          textAnchor="middle" dominantBaseline="central"
          fontSize={Math.max(8, radius * 0.22)}
          fill={strokeColor} fontFamily="serif" fontWeight="bold"
          style={{ pointerEvents: 'none' }}>
          C
        </text>
      ))}

      {/* Selection */}
      {isSelected && (
        <circle cx={0} cy={0} r={radius + 7}
          fill="none" stroke="#3b82f6" strokeWidth={2} strokeDasharray="6 3"
          style={{ pointerEvents: 'none' }} />
      )}
    </g>
  )
})

BenzeneRingElementComp.displayName = 'BenzeneRingElementComp'
export default BenzeneRingElementComp
