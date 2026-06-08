import React, { memo } from 'react'
import type { AtomElement } from '../../../types/canvas'

interface Props {
  element: AtomElement
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
}

const AtomElementComp: React.FC<Props> = memo(({ element, isSelected, onClick }) => {
  const { x, y, element: sym, radius, fillColor, strokeColor, showLabel, charge } = element
  const fs = Math.max(10, radius * 0.9)
  const chargeFontSize = fs * 0.65

  return (
    <g transform={`translate(${x},${y})`} onClick={onClick}>
      {/* Hit area */}
      <circle cx={0} cy={0} r={radius + 4} fill="transparent" stroke="transparent" />

      {/* Atom body */}
      <circle cx={0} cy={0} r={radius}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={Math.max(1.5, radius * 0.08)}
      />

      {/* Subtle radial gradient feel via inner highlight */}
      <circle cx={-radius * 0.25} cy={-radius * 0.25} r={radius * 0.35}
        fill="rgba(255,255,255,0.2)" style={{ pointerEvents: 'none' }} />

      {/* Element symbol */}
      {showLabel && (
        <text
          x={0} y={0}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={fs}
          fontWeight="bold"
          fontFamily="serif"
          fill={fillColor === '#ffffff' || fillColor === '#ffff30' ? '#1e293b' : 'white'}
          style={{ pointerEvents: 'none' }}
        >
          {sym}
        </text>
      )}

      {/* Charge superscript */}
      {charge && (
        <text
          x={radius * 0.7}
          y={-radius * 0.6}
          textAnchor="start"
          fontSize={chargeFontSize}
          fontFamily="serif"
          fill={strokeColor}
          style={{ pointerEvents: 'none' }}
        >
          {charge}
        </text>
      )}

      {/* Selection */}
      {isSelected && (
        <circle cx={0} cy={0} r={radius + 5}
          fill="none" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 3"
          style={{ pointerEvents: 'none' }} />
      )}
    </g>
  )
})

AtomElementComp.displayName = 'AtomElementComp'
export default AtomElementComp
