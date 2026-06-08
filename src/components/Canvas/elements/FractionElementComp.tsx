import React, { memo } from 'react'
import type { FractionElement } from '../../../types/canvas'

interface Props {
  element: FractionElement
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
}

const FractionElementComp: React.FC<Props> = memo(({ element, isSelected, onClick }) => {
  const { x, y, numerator, denominator, fontSize, color } = element

  const barWidth = Math.max(numerator.length, denominator.length) * fontSize * 0.65 + 16
  const barY = 0
  const numY = -fontSize * 0.15 - 6
  const denY = fontSize * 0.85 + 6

  const padX = 8
  const padY = fontSize * 0.5
  const boxW = barWidth + padX * 2
  const boxH = fontSize * 2.2 + padY * 2

  return (
    <g transform={`translate(${x},${y})`} onClick={onClick}>
      {/* Hit area */}
      <rect x={-boxW / 2 - 4} y={-boxH / 2 - 4} width={boxW + 8} height={boxH + 8}
        fill="transparent" stroke="transparent" />

      {/* Numerator */}
      <text
        x={0} y={numY}
        textAnchor="middle"
        fontSize={fontSize}
        fill={color}
        fontFamily="serif"
        style={{ pointerEvents: 'none' }}
      >
        {numerator}
      </text>

      {/* Fraction bar */}
      <line
        x1={-barWidth / 2} y1={barY}
        x2={barWidth / 2} y2={barY}
        stroke={color} strokeWidth={Math.max(1.5, fontSize * 0.07)}
        style={{ pointerEvents: 'none' }}
      />

      {/* Denominator */}
      <text
        x={0} y={denY}
        textAnchor="middle"
        fontSize={fontSize}
        fill={color}
        fontFamily="serif"
        style={{ pointerEvents: 'none' }}
      >
        {denominator}
      </text>

      {/* Selection */}
      {isSelected && (
        <rect x={-boxW / 2 - 4} y={-boxH / 2 - 4} width={boxW + 8} height={boxH + 8}
          fill="none" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 3"
          style={{ pointerEvents: 'none' }} />
      )}
    </g>
  )
})

FractionElementComp.displayName = 'FractionElementComp'
export default FractionElementComp
